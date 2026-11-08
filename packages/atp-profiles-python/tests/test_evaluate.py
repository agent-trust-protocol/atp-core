"""Python-specific behaviour: non-JSON inputs, immutability and the result type."""

import math
import unittest

from atp_profiles import (
    BUILTIN_PROFILES,
    DEV_MODE_PROFILE,
    SAFE_DEFAULT_PROFILE,
    ProfileEvaluationResult,
    __version__,
    evaluate_action_with_profile,
)


class Evaluate(unittest.TestCase):
    def test_result_shape(self):
        result = evaluate_action_with_profile(SAFE_DEFAULT_PROFILE, {"actionType": "shell", "state": "executing"})
        self.assertIsInstance(result, ProfileEvaluationResult)
        self.assertEqual(result.decision, "require_approval")
        self.assertFalse(result.allowed)
        self.assertEqual(result.reason, "control_blocked")
        allowed = evaluate_action_with_profile(SAFE_DEFAULT_PROFILE, {"actionType": "filesystem", "state": "executing"})
        self.assertEqual(allowed.to_dict(), {"allowed": True, "decision": "allow"})

    def test_non_finite_trust_scores_deny(self):
        profile = {**dict(DEV_MODE_PROFILE), "trust_requirements": {"min_score": 0.7}}
        for trust_score in (math.nan, math.inf, -math.inf, True, "1"):
            self.assertEqual(evaluate_action_with_profile(profile, {"actionType": "network", "trustScore": trust_score}).decision, "deny")
        for min_score in (math.nan, math.inf, True):
            bad = {**profile, "trust_requirements": {"min_score": min_score}}
            self.assertEqual(evaluate_action_with_profile(bad, {"actionType": "network", "trustScore": 1}).decision, "deny")

    def test_mandate_requires_exactly_true(self):
        profile = {**dict(DEV_MODE_PROFILE), "authority_requirements": {"require_mandate": True}}
        for verified in (1, "true", [True], None):
            self.assertEqual(evaluate_action_with_profile(profile, {"actionType": "network", "mandateVerified": verified}).decision, "deny")
        self.assertEqual(evaluate_action_with_profile(profile, {"actionType": "network", "mandateVerified": True}).decision, "allow")

    def test_unusual_inputs_fail_closed_without_raising(self):
        for profile in (None, 0, "safe-default", [], {}, object(), {"controls": None}, {"controls": "shell"}):
            self.assertEqual(evaluate_action_with_profile(profile, {"actionType": "filesystem"}).reason, "unknown_profile")
        for context in (None, [], "shell", {"actionType": object()}, {"actionType": b"shell"}):
            self.assertEqual(evaluate_action_with_profile(SAFE_DEFAULT_PROFILE, context).decision, "deny")
        self.assertEqual(evaluate_action_with_profile(SAFE_DEFAULT_PROFILE, {"actionType": "shell", "state": ["executing"]}).decision, "require_approval")

    def test_builtin_profiles_are_read_only(self):
        with self.assertRaises(TypeError):
            BUILTIN_PROFILES["safe-default"] = {}
        with self.assertRaises(TypeError):
            SAFE_DEFAULT_PROFILE["controls"]["shell"]["allowed"] = True
        with self.assertRaises(AttributeError):
            SAFE_DEFAULT_PROFILE["state_policies"]["executing"]["allowed_tools"].append("shell")
        self.assertEqual(evaluate_action_with_profile(SAFE_DEFAULT_PROFILE, {"actionType": "shell", "state": "executing"}).decision, "require_approval")

    def test_version_tracks_the_npm_package(self):
        self.assertEqual(__version__, "3.0.0")


if __name__ == "__main__":
    unittest.main()
