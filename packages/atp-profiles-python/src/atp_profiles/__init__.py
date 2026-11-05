"""ATP security profiles for Python.

A port of the ``atp-profiles`` npm package for Agent Trust Protocol (ATP):
runtime-agnostic, fail-closed security profiles and the evaluator that turns an
action category and lifecycle state into ``allow``, ``require_approval`` or
``deny``. Built-in profiles are generated from the TypeScript package and the
evaluator is checked against shared conformance vectors.
"""

from __future__ import annotations

import json
from importlib import resources
from types import MappingProxyType
from typing import Any, Mapping

from ._evaluate import ProfileDecision, ProfileEvaluationResult, evaluate_action_with_profile

__all__ = [
    "BUILTIN_PROFILES",
    "SAFE_DEFAULT_PROFILE",
    "DEV_MODE_PROFILE",
    "ENTERPRISE_LOCKED_PROFILE",
    "OPENCLAW_SANDBOX_PROFILE",
    "ProfileDecision",
    "ProfileEvaluationResult",
    "evaluate_action_with_profile",
    "__version__",
]

__version__ = "3.0.0"


def _freeze(value: Any) -> Any:
    """Make the shipped profiles read-only so one caller cannot loosen them for another."""
    if isinstance(value, dict):
        return MappingProxyType({key: _freeze(item) for key, item in value.items()})
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    return value


def _load_builtin_profiles() -> Mapping[str, Mapping[str, Any]]:
    text = resources.files(__package__).joinpath("builtin_profiles.json").read_text(encoding="utf-8")
    return _freeze(json.loads(text))


BUILTIN_PROFILES: Mapping[str, Mapping[str, Any]] = _load_builtin_profiles()
"""Read-only built-in profiles keyed by id: safe-default, dev-mode, enterprise-locked, openclaw-sandbox."""

SAFE_DEFAULT_PROFILE = BUILTIN_PROFILES["safe-default"]
DEV_MODE_PROFILE = BUILTIN_PROFILES["dev-mode"]
ENTERPRISE_LOCKED_PROFILE = BUILTIN_PROFILES["enterprise-locked"]
OPENCLAW_SANDBOX_PROFILE = BUILTIN_PROFILES["openclaw-sandbox"]
