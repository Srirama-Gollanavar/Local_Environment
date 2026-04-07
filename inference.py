"""Reference inference entrypoints for OpenEnv validation.

This module mirrors the JavaScript environment so automated checks can import
`reset`, `step`, and `state` directly from the repo root.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class SeededRandom:
    seed: int = 42

    def next(self) -> float:
        self.seed = (self.seed * 9301 + 49297) % 233280
        return self.seed / 233280


class StudyProductivityEnv:
    def __init__(self, seed: int = 42) -> None:
        self.seed = seed
        self.rng = SeededRandom(seed)
        self.MAX_DAYS = 30
        self.MAX_ENERGY = 100
        self.STUDY_ENERGY_COST = 20
        self.STUDY_PRODUCTIVITY_GAIN = 0.1
        self.REST_ENERGY_RESTORE = 30
        self.state_: Dict[str, Any] = {}
        self.reset()

    def reset(self) -> Dict[str, Any]:
        self.state_ = {
            "day": 1,
            "energy": 80.0,
            "tasks_completed": 0,
            "productivity": 0.0,
            "total_productivity": 0.0,
        }
        return self.state()

    def state(self) -> Dict[str, Any]:
        return {
            "day": self.state_["day"],
            "energy": self.state_["energy"],
            "tasks_completed": self.state_["tasks_completed"],
            "productivity": self.state_["productivity"],
            "total_productivity": self.state_["total_productivity"],
        }

    def step(self, action: str) -> Dict[str, Any]:
        valid_actions = {"study", "rest", "skip"}
        if action not in valid_actions:
            raise ValueError(f"Invalid action: {action}")

        reward = 0
        done = False

        if action == "study":
            if self.state_["energy"] < self.STUDY_ENERGY_COST:
                reward = -5
            else:
                self.state_["energy"] -= self.STUDY_ENERGY_COST
                self.state_["tasks_completed"] += 1
                self.state_["productivity"] += self.STUDY_PRODUCTIVITY_GAIN
                self.state_["total_productivity"] += self.STUDY_PRODUCTIVITY_GAIN
                reward = 10
        elif action == "rest":
            self.state_["energy"] = min(
                self.state_["energy"] + self.REST_ENERGY_RESTORE,
                self.MAX_ENERGY,
            )
            reward = 2
        else:
            reward = -3

        self.state_["day"] += 1
        self.state_["productivity"] = min(self.state_["productivity"], 1.0)

        if action != "rest":
            self.state_["energy"] = max(self.state_["energy"] - 2, 0)

        if self.state_["day"] > self.MAX_DAYS:
            done = True

        return {
            "state": self.state(),
            "reward": reward,
            "done": done,
            "info": {
                "action": action,
                "energy": self.state_["energy"],
                "tasks": self.state_["tasks_completed"],
            },
        }


ENV = StudyProductivityEnv()


def reset() -> Dict[str, Any]:
    return ENV.reset()


def state() -> Dict[str, Any]:
    return ENV.state()


def step(action: str) -> Dict[str, Any]:
    return ENV.step(action)


if __name__ == "__main__":
    print(reset())
