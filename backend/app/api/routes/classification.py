"""Classification API routes"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError

from app.schemas.classification import ClassificationRequest, ClassificationResponse
from app.services.classification_service import get_classification_service

router = APIRouter(prefix="/api", tags=["classification"])


@router.post("/classify", response_model=ClassificationResponse)
async def classify_text(request: ClassificationRequest) -> ClassificationResponse:
    """
    Classify input text.

    Returns:
        Classification result with confidence score and reasoning
    """
    try:
        service = get_classification_service()
        result = service.classify(
            text=request.text,
            model=request.model,
            include_features=False,  # Can be made configurable
        )

        return ClassificationResponse(
            result=result["result"],
            confidence=result["confidence"],
            reasoning=result["reasoning"],
            metadata=result["metadata"],
            features=result.get("features"),
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.post("/classify/batch")
async def classify_batch(texts: list = Query(..., description="List of texts to classify")):
    """
    Classify multiple texts in batch.

    Returns:
        List of classification results
    """
    try:
        if not texts or len(texts) == 0:
            raise ValueError("texts cannot be empty")

        if len(texts) > 100:
            raise ValueError("Maximum 100 texts per batch")

        service = get_classification_service()
        results = service.classify_batch(texts)

        return {
            "classifications": results,
            "count": len(results),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch classification failed: {str(e)}")


@router.get("/classify/stats")
async def get_classification_stats():
    """
    Get classification service statistics.

    Returns:
        Statistics about classifications performed
    """
    try:
        service = get_classification_service()
        stats = service.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.post("/classify/cache/clear")
async def clear_classification_cache():
    """
    Clear the classification cache.

    Returns:
        Confirmation message
    """
    try:
        service = get_classification_service()
        service.clear_cache()
        return {"message": "Classification cache cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")
