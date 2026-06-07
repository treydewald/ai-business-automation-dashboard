"""Classification service for text categorization"""

import logging
import hashlib
from typing import Dict, Tuple, Optional
from functools import lru_cache
from datetime import datetime

from app.rules.classification_rules import RuleBasedClassifier

logger = logging.getLogger(__name__)


class ClassificationService:
    """Service for classifying text with caching and logging"""

    def __init__(self, cache_size: int = 1024):
        self.classifier = RuleBasedClassifier()
        self.cache_size = cache_size
        self._init_cache()
        self.classification_log = []

    def _init_cache(self):
        """Initialize the classification cache"""
        # LRU cache decorator
        @lru_cache(maxsize=self.cache_size)
        def _cached_classify(text_hash: str, text: str, model: str) -> Tuple[str, float, str]:
            return self.classifier.classify(text)

        self._cached_classify = _cached_classify

    def classify(
        self,
        text: str,
        model: str = "default",
        use_cache: bool = True,
        include_features: bool = False,
    ) -> Dict:
        """
        Classify text with optional caching.

        Args:
            text: Text to classify
            model: Model name (currently only "default" supported)
            use_cache: Whether to use cached results
            include_features: Whether to include feature vector in response

        Returns:
            Dictionary with classification results
        """
        try:
            # Create text hash for caching
            text_hash = hashlib.md5(text.encode()).hexdigest() if use_cache else None

            # Get classification
            if use_cache and text_hash:
                category, confidence, reasoning = self._cached_classify(text_hash, text, model)
            else:
                category, confidence, reasoning = self.classifier.classify(text)

            # Extract features if requested
            features = None
            if include_features:
                features = self.classifier.get_features(text)

            result = {
                "result": category,
                "confidence": round(confidence, 4),
                "reasoning": reasoning,
                "metadata": {
                    "model": model,
                    "timestamp": datetime.utcnow().isoformat(),
                    "text_length": len(text),
                },
                "features": features,
            }

            # Log classification
            self._log_classification(text, result)

            return result

        except Exception as e:
            logger.error(f"Classification error: {str(e)}")
            raise

    def classify_batch(self, texts: list, **kwargs) -> list:
        """
        Classify multiple texts.

        Args:
            texts: List of texts to classify
            **kwargs: Additional arguments to pass to classify()

        Returns:
            List of classification results
        """
        return [self.classify(text, **kwargs) for text in texts]

    def _log_classification(self, text: str, result: Dict):
        """Log classification for analysis"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "text_length": len(text),
            "result": result["result"],
            "confidence": result["confidence"],
        }
        self.classification_log.append(log_entry)

        # Keep log manageable
        if len(self.classification_log) > 10000:
            self.classification_log = self.classification_log[-5000:]

        logger.info(
            f"Classification: text_len={len(text)}, "
            f"result={result['result']}, "
            f"confidence={result['confidence']}"
        )

    def get_stats(self) -> Dict:
        """Get classification statistics"""
        if not self.classification_log:
            return {
                "total_classifications": 0,
                "average_confidence": 0,
                "category_distribution": {},
            }

        categories = {}
        total_confidence = 0

        for entry in self.classification_log:
            category = entry["result"]
            confidence = entry["confidence"]

            categories[category] = categories.get(category, 0) + 1
            total_confidence += confidence

        return {
            "total_classifications": len(self.classification_log),
            "average_confidence": round(total_confidence / len(self.classification_log), 4),
            "category_distribution": categories,
        }

    def clear_cache(self):
        """Clear the classification cache"""
        self._init_cache()
        logger.info("Classification cache cleared")


# Global instance
_classification_service: Optional[ClassificationService] = None


def get_classification_service() -> ClassificationService:
    """Get or create global classification service instance"""
    global _classification_service
    if _classification_service is None:
        _classification_service = ClassificationService()
    return _classification_service
