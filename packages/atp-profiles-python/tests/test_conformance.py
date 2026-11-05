"""Shared conformance vectors generated from the TypeScript atp-profiles package."""

import json
import pathlib
import unittest

from atp_profiles import BUILTIN_PROFILES, evaluate_action_with_profile

CONFORMANCE = pathlib.Path(__file__).resolve().parents[2] / "atp-profiles" / "conformance"


def _thaw(value):
    if hasattr(value, "items"):
        return {key: _thaw(item) for key, item in value.items()}
    if isinstance(value, tuple):
        return [_thaw(item) for item in value]
    return value


class ConformanceVectors(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.vectors = json.loads((CONFORMANCE / "vectors.json").read_text(encoding="utf-8"))

    def test_builtin_profiles_match_typescript(self):
        expected = json.loads((CONFORMANCE / "builtin-profiles.json").read_text(encoding="utf-8"))
        self.assertEqual(_thaw(BUILTIN_PROFILES), expected)
        self.assertEqual(list(BUILTIN_PROFILES), list(expected))

    def test_every_vector_matches_typescript(self):
        vectors = self.vectors["vectors"]
        self.assertEqual(len(vectors), self.vectors["count"])
        self.assertGreater(len(vectors), 400)
        for vector in vectors:
            profile = BUILTIN_PROFILES[vector["profileRef"]] if "profileRef" in vector else vector["profile"]
            with self.subTest(vector["name"]):
                actual = evaluate_action_with_profile(profile, vector["context"]).to_dict()
                self.assertEqual(actual, vector["expected"])


if __name__ == "__main__":
    unittest.main()
