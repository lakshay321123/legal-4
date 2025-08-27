"""Build legal analysis prompts with assumption verification.

The ``build_legal_prompt`` function assembles a base prompt for legal
analysis and injects a "verify assumptions" section. Each claim is
converted into a clarifying question, which can be tracked using the
provided :class:`~session.state_manager.StateManager`.
"""

from typing import Iterable, Optional

from session.state_manager import StateManager


def build_legal_prompt(
    question: str, claims: Iterable[str], state: Optional[StateManager] = None
) -> str:
    """Create a prompt that asks the model to verify key assumptions.

    Parameters
    ----------
    question:
        The user's original question.
    claims:
        Key assertions extracted from the user's input that may require
        confirmation.
    state:
        Optional ``StateManager`` used to track which challenges have
        been answered.
    """

    lines = [
        "You are a legal research assistant.",
        f"User question: {question}",
        "",
        "## Verify Assumptions",
    ]
    for claim in claims:
        challenge = f"What evidence supports the claim that {claim}?"
        lines.append(f"- {challenge}")
        if state:
            state.add_challenge(challenge)
    return "\n".join(lines)


def unresolved_challenges_prompt(state: StateManager) -> str:
    """Return a formatted list of unresolved challenges.

    This helper can be called before producing a final legal answer to
    remind users to confirm or correct outstanding points.
    """
    block = state.format_unresolved()
    return block if not block else f"\n{block}\n"
