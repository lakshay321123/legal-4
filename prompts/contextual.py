"""Dynamic prompt templates for chat interactions.

This module provides utilities for constructing prompt text that adapts
based on previous conversation history, the role of the user interacting
with the system, and the jurisdiction in which the query is framed.
"""

from typing import List, Sequence

ROLE_TEMPLATES = {
    "user": "Provide a concise, helpful response.",
    "lawyer": "Offer detailed legal analysis tailored for professionals.",
    "admin": "Return high level administrative guidance.",
}

JURISDICTION_TEMPLATES = {
    "US": "Reference United States law.",
    "EU": "Reference European Union law.",
    "OTHER": "Reference general international legal principles.",
}

def build_template(history: Sequence[str] | None, role: str, jurisdiction: str) -> str:
    """Compose a context aware template string.

    Parameters
    ----------
    history:
        Ordered collection of previous conversation turns. When present,
        they are embedded in the template to preserve context.
    role:
        The role of the current user. The wording changes when the role is
        recognised (``user``, ``lawyer`` or ``admin``). Unrecognised roles
        fall back to ``user`` semantics.
    jurisdiction:
        Jurisdiction of the question. Currently recognised values are
        ``US`` and ``EU``. Any other value falls back to a generic
        international wording.

    Returns
    -------
    str
        Combined template string.
    """
    parts: List[str] = []
    if history:
        parts.append("Conversation so far: " + " | ".join(history))

    parts.append(ROLE_TEMPLATES.get(role, ROLE_TEMPLATES["user"]))
    parts.append(JURISDICTION_TEMPLATES.get(jurisdiction, JURISDICTION_TEMPLATES["OTHER"]))

    return " ".join(parts)

