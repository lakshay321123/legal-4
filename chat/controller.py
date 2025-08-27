"""Chat controller exposing reasoning pipeline hooks."""

from typing import Any, Dict

from reasoning.chain import ReasoningChain


class ChatController:
    """Provides API hooks for each reasoning sub-task.

    The controller sequentially runs the reasoning steps exposed by
    :class:`ReasoningChain` so that external callers can inspect or reuse
    intermediate data.
    """

    def __init__(self) -> None:
        self.chain = ReasoningChain()

    # Individual hooks -------------------------------------------------
    def gather_facts(self, query: str) -> Dict[str, Any]:
        return self.chain.gather_facts(query)

    def extract_legal_rules(self, facts: Dict[str, Any]) -> Dict[str, Any]:
        return self.chain.extract_legal_rules(facts)

    def apply_rules(self, facts: Dict[str, Any], rules: Dict[str, Any]) -> Dict[str, Any]:
        return self.chain.apply_rules(facts, rules)

    def conclude(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        return self.chain.conclude(analysis)

    # Orchestrated execution -------------------------------------------
    def run_reasoning(self, query: str) -> Dict[str, Any]:
        """Execute all reasoning steps sequentially for ``query``."""
        facts = self.gather_facts(query)
        rules = self.extract_legal_rules(facts)
        application = self.apply_rules(facts, rules)
        conclusion = self.conclude(application)
        return {
            "facts": facts,
            "rules": rules,
            "application": application,
            "conclusion": conclusion,
        }


__all__ = ["ChatController"]
