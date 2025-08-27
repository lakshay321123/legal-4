"""Chat controller with domain-specific expertise profiles."""
from __future__ import annotations

import os
from typing import Any, Dict, Optional

import yaml

# Directory containing expertise profiles
EXPERTISE_DIR = os.path.join(os.path.dirname(__file__), "..", "config", "expertise")

# Keyword mapping for domain detection
_KEYWORD_MAP: Dict[str, list[str]] = {
    "criminal": ["crime", "ipc", "penal", "murder", "bail"],
    "civil": ["contract", "tort", "property", "injunction"],
    "intellectual_property": ["copyright", "trademark", "patent", "ip"],
    "tax": ["tax", "gst", "income tax", "assessment"],
}


def detect_domain(text: str) -> Optional[str]:
    """Detect the legal domain from input text."""
    text = text.lower()
    for domain, keywords in _KEYWORD_MAP.items():
        if any(keyword in text for keyword in keywords):
            return domain
    return None


def load_profile(domain: Optional[str] = None, *, text: str = "") -> Dict[str, Any]:
    """Load an expertise profile by domain or detect from text."""
    if domain is None:
        domain = detect_domain(text)
    if domain is None:
        return {}

    path = os.path.join(EXPERTISE_DIR, f"{domain}.yml")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        return {}


class ChatController:
    """Simple chat controller that manages expertise profiles."""

    def __init__(self, domain: Optional[str] = None) -> None:
        self.domain = domain
        self.profile: Dict[str, Any] = {}

    def configure(self, *, domain: Optional[str] = None, text: str = "") -> None:
        """Configure the controller using an explicit domain or detected keywords."""
        self.domain = domain or detect_domain(text)
        if self.domain:
            self.profile = load_profile(self.domain)
        else:
            self.profile = {}

    def get_profile(self) -> Dict[str, Any]:
        """Return the currently loaded expertise profile."""
        return self.profile
