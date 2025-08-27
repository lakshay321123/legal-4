"""Integration tests for contextual prompt templates."""
import sys, pathlib
sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))


from chat.controller import SessionMetadata, select_template


def test_user_us_with_history():
    session = SessionMetadata(
        history=["What is the statute of limitations?", "It depends."],
        role="user",
        jurisdiction="US",
    )
    template = select_template(session)
    assert "Conversation so far" in template
    assert "United States law" in template
    assert "concise" in template


def test_lawyer_eu_no_history():
    session = SessionMetadata(history=[], role="lawyer", jurisdiction="EU")
    template = select_template(session)
    assert "European Union law" in template
    assert "detailed legal analysis" in template
    assert "Conversation so far" not in template


def test_admin_unknown_jurisdiction():
    session = SessionMetadata(history=["previous"], role="admin", jurisdiction="BR")
    template = select_template(session)
    assert "administrative guidance" in template
    assert "international legal principles" in template

