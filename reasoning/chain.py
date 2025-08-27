from __future__ import annotations

"""Reasoning orchestration module.

This module defines a small pipeline that chains together multiple
reasoning sub-tasks: fact gathering, legal rule extraction, rule
application, and drawing a conclusion. Each step writes its intermediate
state to ``logs/reasoning`` to aid debugging and audits.
"""

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict
import json

LOG_DIR = Path("logs/reasoning")


def _log(step: str, payload: Any) -> None:
    """Persist ``payload`` for ``step`` in ``logs/reasoning``.

    The payload is serialized as JSON when possible and as ``str``
    otherwise.  Each log file is timestamped to avoid collisions.
    """
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.utcnow().isoformat()
    path = LOG_DIR / f"{timestamp}_{step}.log"
    with open(path, "w", encoding="utf-8") as fh:
        if isinstance(payload, (dict, list)):
            json.dump(payload, fh, indent=2)
        else:
            fh.write(str(payload))


@dataclass
class ReasoningChain:
    """Chains together reasoning sub-tasks.

    Each method returns the intermediate result of the step and writes it
    to ``logs/reasoning`` for traceability.
    """

    def gather_facts(self, query: str) -> Dict[str, Any]:
        """Collect facts relevant to ``query``."""
        facts = {"facts": f"Facts collected for: {query}"}
        _log("facts", facts)
        return facts

    def extract_legal_rules(self, facts: Dict[str, Any]) -> Dict[str, Any]:
        """Derive legal rules from ``facts``."""
        rules = {"rules": f"Rules derived from {facts['facts']}"}
        _log("rules", rules)
        return rules

    def apply_rules(self, facts: Dict[str, Any], rules: Dict[str, Any]) -> Dict[str, Any]:
        """Apply ``rules`` to ``facts``."""
        analysis = {
            "analysis": f"Applying {rules['rules']} to {facts['facts']}"
        }
        _log("application", analysis)
        return analysis

    def conclude(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Produce a conclusion from ``analysis``."""
        conclusion = {
            "conclusion": f"Conclusion based on {analysis['analysis']}"
        }
        _log("conclusion", conclusion)
        return conclusion

    def run(self, query: str) -> Dict[str, Any]:
        """Execute the full chain of reasoning for ``query``."""
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


__all__ = ["ReasoningChain"]
