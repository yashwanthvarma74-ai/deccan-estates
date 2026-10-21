"""Heuristic prompt-injection screening for retrieved passages (OWASP LLM01).

Retrieved text is untrusted: a seller could upload a PDF that says "ignore previous
instructions". We drop obviously hostile passages and flag the rest so the caller can
wrap them as data, never as instructions.
"""
import re

_PATTERNS = [
    r"ignore (all |any )?(previous|prior|above) (instructions|prompts)",
    r"disregard (the )?(system|previous) (prompt|instructions)",
    r"you are now\b",
    r"reveal (your|the) (system )?prompt",
    r"<\s*/?\s*(system|assistant)\s*>",
    r"\bBEGIN SYSTEM\b",
]
_RX = re.compile("|".join(_PATTERNS), re.IGNORECASE)


def is_suspicious(text: str) -> bool:
    return bool(_RX.search(text))
