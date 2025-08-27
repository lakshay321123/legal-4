"""Manage conversation state for legal Q&A sessions.

This module tracks clarifying questions ("challenges") that the
assistant raises when verifying assumptions. Each challenge can be
marked as answered or unanswered, allowing the application to surface
unresolved items to the user before final analysis.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class StateManager:
    """Store and update clarification challenges.

    The ``challenges`` dictionary maps a question to the user's
    answer. ``None`` represents an unresolved challenge.
    """

    challenges: Dict[str, Optional[str]] = field(default_factory=dict)

    def add_challenge(self, question: str) -> None:
        """Record a clarification question if not already present."""
        self.challenges.setdefault(question, None)

    def answer_challenge(self, question: str, answer: str) -> None:
        """Store the user's answer for a given challenge."""
        if question in self.challenges:
            self.challenges[question] = answer

    def unresolved_challenges(self) -> List[str]:
        """Return a list of unanswered clarification questions."""
        return [q for q, a in self.challenges.items() if not a]

    def format_unresolved(self) -> str:
        """Format unresolved challenges for display to the user.

        Returns an empty string if all challenges have been resolved.
        """
        pending = self.unresolved_challenges()
        if not pending:
            return ""
        lines = [
            "The following points need confirmation before legal analysis:",
        ]
        for idx, q in enumerate(pending, 1):
            lines.append(f"{idx}. {q}")
        lines.append("Please clarify or correct these items.")
        return "\n".join(lines)
