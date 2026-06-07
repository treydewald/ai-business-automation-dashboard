"""Rule-based classification rules for text categorization"""

from typing import Dict, List, Tuple
from dataclasses import dataclass
import re


@dataclass
class ClassificationRule:
    """Single classification rule with keywords and confidence weights"""
    category: str
    keywords: List[str]
    patterns: List[str]  # Regex patterns
    weight: float = 1.0


# Define classification rules
CLASSIFICATION_RULES = [
    ClassificationRule(
        category="urgency",
        keywords=["urgent", "critical", "asap", "immediately", "rush", "emergency", "priority", "high"],
        patterns=[r"\bASAP\b", r"\b!\s*!", r"\bCRITICAL\b", r"\bUREGNT\b"],
        weight=1.0,
    ),
    ClassificationRule(
        category="inquiry",
        keywords=["what", "how", "when", "where", "why", "question", "ask", "can you", "help"],
        patterns=[r"\?", r"\bhelp\s*with\b", r"\bcan\s*you\b"],
        weight=0.8,
    ),
    ClassificationRule(
        category="feedback",
        keywords=["feedback", "suggestion", "improvement", "idea", "better", "enhance", "improve"],
        patterns=[r"\bfeedback\b", r"\bsuggestion\b", r"\bshould\b"],
        weight=0.8,
    ),
    ClassificationRule(
        category="bug_report",
        keywords=["bug", "error", "issue", "broken", "crash", "fail", "problem", "doesn't work"],
        patterns=[r"\berror\b", r"\bbroken\b", r"\bcrash\b", r"\bissuee?\b"],
        weight=0.9,
    ),
    ClassificationRule(
        category="feature_request",
        keywords=["feature", "request", "add", "implement", "support", "new", "capability"],
        patterns=[r"\bfeature\s*request\b", r"\badd\s+support\b", r"\bimplement\b"],
        weight=0.85,
    ),
    ClassificationRule(
        category="documentation",
        keywords=["documentation", "docs", "readme", "guide", "tutorial", "how-to", "manual"],
        patterns=[r"\bdocumentation\b", r"\b(read|doc)me\b", r"\bguide\b"],
        weight=0.8,
    ),
    ClassificationRule(
        category="notification",
        keywords=["notify", "alert", "alarm", "remind", "update", "notification", "inform"],
        patterns=[r"\bnotify\b", r"\balert\b", r"\bremind\b"],
        weight=0.7,
    ),
]


class RuleBasedClassifier:
    """Rule-based text classifier using keyword and pattern matching"""

    def __init__(self, rules: List[ClassificationRule] = None):
        self.rules = rules or CLASSIFICATION_RULES
        self._build_index()

    def _build_index(self):
        """Build keyword and pattern indexes for faster lookup"""
        self.keyword_index: Dict[str, List[ClassificationRule]] = {}
        for rule in self.rules:
            for keyword in rule.keywords:
                key = keyword.lower()
                if key not in self.keyword_index:
                    self.keyword_index[key] = []
                self.keyword_index[key].append(rule)

    def classify(self, text: str, threshold: float = 0.3) -> Tuple[str, float, str]:
        """
        Classify text using rules.

        Returns:
            Tuple of (category, confidence, reasoning)
        """
        text_lower = text.lower()
        scores: Dict[str, float] = {}

        # Score based on keywords
        for keyword, rules in self.keyword_index.items():
            if keyword in text_lower:
                for rule in rules:
                    if rule.category not in scores:
                        scores[rule.category] = 0
                    # Count keyword occurrences
                    count = text_lower.count(keyword)
                    scores[rule.category] += count * rule.weight

        # Score based on patterns
        for rule in self.rules:
            for pattern in rule.patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    if rule.category not in scores:
                        scores[rule.category] = 0
                    scores[rule.category] += 0.5 * rule.weight

        # Find best match
        if not scores:
            return ("unclassified", 0.0, "No matching patterns found")

        best_category = max(scores, key=scores.get)
        best_score = scores[best_category]

        # Normalize confidence to 0-1 range
        # Using a simple heuristic: each keyword adds ~0.1 to confidence
        normalized_confidence = min(1.0, best_score / (len(text_lower.split()) * 0.2))

        if normalized_confidence < threshold:
            return ("unclassified", normalized_confidence, f"Low confidence for {best_category}")

        # Generate reasoning
        reasoning = self._generate_reasoning(text_lower, best_category, scores)

        return (best_category, normalized_confidence, reasoning)

    def _generate_reasoning(self, text: str, category: str, scores: Dict[str, float]) -> str:
        """Generate human-readable reasoning for classification"""
        rule = next((r for r in self.rules if r.category == category), None)
        if not rule:
            return f"Classified as {category} based on pattern matching"

        found_keywords = []
        for keyword in rule.keywords:
            if keyword in text:
                found_keywords.append(keyword)

        if found_keywords:
            return f"Classified as '{category}' based on keywords: {', '.join(found_keywords[:3])}"
        return f"Classified as '{category}' based on text patterns"

    def get_features(self, text: str) -> Dict[str, float]:
        """Extract simple text features"""
        words = text.split()
        return {
            "word_count": float(len(words)),
            "char_count": float(len(text)),
            "avg_word_length": sum(len(w) for w in words) / len(words) if words else 0,
            "punctuation_count": float(sum(1 for c in text if c in "!?.,")),
            "uppercase_ratio": float(sum(1 for c in text if c.isupper()) / len(text)) if text else 0,
        }
