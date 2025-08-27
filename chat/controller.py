"""Chat controller selecting contextual prompt templates."""

from dataclasses import dataclass, field
from typing import List

from prompts.contextual import build_template


@dataclass
class SessionMetadata:
    """Metadata describing a chat session.

    Attributes
    ----------
    history:
        Previous conversation turns.
    role:
        Declared role of the interacting user (``user``, ``lawyer`` or ``admin``).
    jurisdiction:
        Jurisdiction to consider when generating responses.
    """

    history: List[str] = field(default_factory=list)
    role: str = "user"
    jurisdiction: str = "OTHER"


def select_template(session: SessionMetadata) -> str:
    """Select a contextual prompt for the given ``session``.

    Parameters
    ----------
    session:
        Session metadata describing the active conversation.

    Returns
    -------
    str
        A context sensitive template string.
    """

    return build_template(session.history, session.role, session.jurisdiction)

