"""Profile evaluation, ported from the TypeScript ``atp-profiles`` evaluator.

The decision logic mirrors ``packages/atp-profiles/src/evaluate.ts`` exactly,
including JavaScript truthiness and the difference between a missing value and
``null``. Shared conformance vectors generated from the TypeScript package check
that both implementations return the same decision and reason.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Dict, Literal, Optional

ProfileDecision = Literal["allow", "deny", "require_approval"]

_MISSING = object()


@dataclass(frozen=True)
class ProfileEvaluationResult:
    """Outcome of evaluating one action against a profile."""

    allowed: bool
    decision: ProfileDecision
    reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Return the same JSON shape as the TypeScript evaluator."""
        out: Dict[str, Any] = {"allowed": self.allowed, "decision": self.decision}
        if self.reason:
            out["reason"] = self.reason
        return out


def _result(decision: ProfileDecision, reason: Optional[str] = None) -> ProfileEvaluationResult:
    return ProfileEvaluationResult(allowed=decision == "allow", decision=decision, reason=reason or None)


def _is_array(value: Any) -> bool:
    return isinstance(value, (list, tuple))


def _is_object(value: Any) -> bool:
    """JavaScript ``typeof value === 'object' && value !== null`` for JSON values."""
    return isinstance(value, Mapping) or _is_array(value)


def _finite_number(value: Any) -> bool:
    """JavaScript ``Number.isFinite``: a real number, not a boolean, not NaN or infinite."""
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _truthy(value: Any) -> bool:
    """JavaScript truthiness for JSON values (empty objects and arrays are truthy)."""
    if value is None or value is False:
        return False
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value != 0 and not math.isnan(value)
    if isinstance(value, str):
        return value != ""
    return True


def _get(container: Any, key: str, default: Any = _MISSING) -> Any:
    """Own-property lookup that only reads mappings (like ``obj?.[key]`` on plain objects)."""
    if isinstance(container, Mapping) and key in container:
        return container[key]
    return default


def _includes(names: Any, action_type: str) -> bool:
    """``names?.includes(actionType)`` for arrays and strings; anything else is False."""
    if _is_array(names):
        return action_type in names
    if isinstance(names, str):
        return action_type in names
    return False


def evaluate_action_with_profile(profile: Any, context: Optional[Mapping[str, Any]] = None) -> ProfileEvaluationResult:
    """Category/state gate shared by ATP runtimes; it is not a runtime sandbox.

    ``context`` uses the same keys as the TypeScript API: ``actionType`` (required),
    ``state`` or ``sessionState``, and the externally verified ``trustScore`` and
    ``mandateVerified``. Those last two must come from trusted verifiers, never
    from untrusted action metadata.

    Any missing, unknown or malformed profile denies (reason ``unknown_profile``)
    instead of raising, so callers that only act on the returned decision still
    fail closed.
    """
    ctx: Mapping[str, Any] = context if isinstance(context, Mapping) else {}

    controls = _get(profile, "controls", None)
    if not isinstance(profile, Mapping) or controls is None or not _is_object(controls) or not _truthy(controls):
        return _result("deny", "unknown_profile")

    trust_requirements = _get(profile, "trust_requirements", None)
    minimum = _get(trust_requirements, "min_score")
    if minimum is not _MISSING:
        trust_score = ctx.get("trustScore")
        if (
            not _finite_number(minimum)
            or minimum < 0
            or minimum > 1
            or not _finite_number(trust_score)
            or trust_score < minimum
            or trust_score > 1
        ):
            return _result("deny", "trust_requirement_unmet")

    authority = _get(profile, "authority_requirements", None)
    if _truthy(_get(authority, "require_mandate", None)) and ctx.get("mandateVerified") is not True:
        return _result("deny", "authority_requirement_unmet")

    action_type = ctx.get("actionType")
    if not isinstance(action_type, str) or action_type == "":
        return _result("deny", "unknown_action_type")

    # Array-valued controls are treated as having no categories (JSON arrays carry no named keys).
    control = _get(controls, action_type)

    state = ctx.get("state")
    if state is None:
        state = ctx.get("sessionState")
    state_policies = _get(profile, "state_policies", None)
    policy: Any = _MISSING
    if isinstance(state, str) and state != "" and isinstance(state_policies, Mapping) and state in state_policies:
        policy = state_policies[state]

    recognized = control is not _MISSING or any(
        _includes(_get(policy, key, None), action_type)
        for key in ("allowed_tools", "restricted_tools", "require_approval_for")
    )
    if not recognized:
        fallback = _get(profile, "unknown_action", None)
        decision: ProfileDecision = fallback if fallback in ("allow", "require_approval") and isinstance(fallback, str) else "deny"
        return _result(decision, "unknown_action_type")

    if isinstance(control, Mapping) and control.get("allowed", _MISSING) is False:
        approval = "require_approval" in control and _truthy(control.get("require_approval"))
        return _result("require_approval" if approval else "deny", "control_blocked")
    if _includes(_get(policy, "restricted_tools", None), action_type):
        return _result("deny", "state_restricted")
    if _includes(_get(policy, "require_approval_for", None), action_type):
        return _result("require_approval", "state_approval_required")
    return _result("allow")
