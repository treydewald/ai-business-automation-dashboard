"""Tests for classification service"""

import pytest
from app.services.classification_service import ClassificationService, get_classification_service
from app.rules.classification_rules import RuleBasedClassifier


class TestRuleBasedClassifier:
    """Test rule-based classifier"""

    def test_classify_urgency(self):
        """Test classification of urgent text"""
        classifier = RuleBasedClassifier()
        category, confidence, reasoning = classifier.classify("This is URGENT and needs to be done ASAP")
        assert category == "urgency"
        assert confidence > 0.5
        assert "urgent" in reasoning.lower() or "asap" in reasoning.lower()

    def test_classify_bug_report(self):
        """Test classification of bug report"""
        classifier = RuleBasedClassifier()
        category, confidence, reasoning = classifier.classify("There's a critical bug in the system, it keeps crashing")
        assert category == "bug_report"
        assert confidence > 0.5

    def test_classify_inquiry(self):
        """Test classification of inquiry"""
        classifier = RuleBasedClassifier()
        category, confidence, reasoning = classifier.classify("How can I do this? Can you help?")
        assert category == "inquiry"
        assert confidence > 0.3

    def test_classify_feature_request(self):
        """Test classification of feature request"""
        classifier = RuleBasedClassifier()
        category, confidence, reasoning = classifier.classify("We need a new feature to support batch processing")
        assert category == "feature_request"
        assert confidence > 0.5

    def test_classify_unclassified(self):
        """Test classification of unrelated text"""
        classifier = RuleBasedClassifier()
        category, confidence, reasoning = classifier.classify("The weather is nice today")
        assert category == "unclassified"
        assert confidence < 0.3

    def test_feature_extraction(self):
        """Test feature extraction"""
        classifier = RuleBasedClassifier()
        features = classifier.get_features("Hello world!")
        assert "word_count" in features
        assert "char_count" in features
        assert features["word_count"] == 2.0
        assert features["char_count"] == 12.0


class TestClassificationService:
    """Test classification service"""

    def test_service_classify(self):
        """Test classification service classify method"""
        service = ClassificationService()
        result = service.classify("This is urgent and needs immediate attention")
        assert "result" in result
        assert "confidence" in result
        assert "reasoning" in result
        assert result["result"] == "urgency"
        assert result["confidence"] > 0.5

    def test_service_caching(self):
        """Test classification service caching"""
        service = ClassificationService()
        text = "Bug report: the system is broken"

        # First classification
        result1 = service.classify(text, use_cache=True)

        # Second classification (should be cached)
        result2 = service.classify(text, use_cache=True)

        assert result1["result"] == result2["result"]
        assert result1["confidence"] == result2["confidence"]

    def test_service_batch_classify(self):
        """Test batch classification"""
        service = ClassificationService()
        texts = [
            "This is urgent!",
            "Can you help me?",
            "I have a feature idea",
        ]
        results = service.classify_batch(texts)
        assert len(results) == 3
        assert results[0]["result"] == "urgency"
        assert results[1]["result"] == "inquiry"
        assert results[2]["result"] == "feature_request"

    def test_service_stats(self):
        """Test getting service statistics"""
        service = ClassificationService()

        # Perform some classifications
        service.classify("urgent issue")
        service.classify("how do I?")
        service.classify("urgent problem")

        stats = service.get_stats()
        assert stats["total_classifications"] == 3
        assert "average_confidence" in stats
        assert "category_distribution" in stats
        assert stats["category_distribution"]["urgency"] == 2

    def test_global_service_instance(self):
        """Test global service instance"""
        service1 = get_classification_service()
        service2 = get_classification_service()
        assert service1 is service2  # Should be same instance

    def test_service_with_features(self):
        """Test service with feature extraction"""
        service = ClassificationService()
        result = service.classify(
            "This is an urgent bug report",
            include_features=True,
        )
        assert result["features"] is not None
        assert "word_count" in result["features"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
