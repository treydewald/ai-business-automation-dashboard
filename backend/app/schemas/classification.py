from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class ClassificationRequest(BaseModel):
    """Request schema for text classification"""
    text: str = Field(..., min_length=1, max_length=10000, description="Text to classify")
    model: Optional[str] = Field(default="default", description="Model name to use")
    include_reasoning: bool = Field(default=True, description="Include reasoning in response")


class ClassificationResponse(BaseModel):
    """Response schema for classification result"""
    result: str = Field(..., description="Classification result/category")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score 0-1")
    reasoning: str = Field(..., description="Explanation of classification")
    metadata: Dict[str, any] = Field(default_factory=dict, description="Additional metadata")
    features: Optional[Dict[str, float]] = Field(default=None, description="Feature vector")
