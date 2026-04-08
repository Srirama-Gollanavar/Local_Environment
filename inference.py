"""Reference inference entrypoints for OpenEnv validation.

This module mirrors the JavaScript environment so automated checks can import
`reset`, `step`, and `state` directly from the repo root.
"""

from __future__ import annotations

from dataclasses import dataclass
import sys
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


def server() -> None:
    """Console entry point required by the OpenEnv validator."""
    print("Study Productivity OpenEnv server entry point is available.")


def choose_action(observation: Dict[str, Any]) -> str:
    """Match the baseline JavaScript agent policy for deterministic runs."""
    energy = observation["energy"]
    tasks_completed = observation["tasks_completed"]

    if energy <= 30:
        return "rest"
    if energy > 50:
        return "study"
    if tasks_completed < 2:
        return "study"
    return "rest"


def grade_easy(final_state: Dict[str, Any]) -> float:
    return min(final_state["tasks_completed"] / 3.0, 1.0)


def grade_medium(final_state: Dict[str, Any]) -> float:
    average_productivity = final_state["total_productivity"] / 30.0
    return min(average_productivity / 0.1, 1.0)


def grade_hard(final_state: Dict[str, Any]) -> float:
    task_score = min(final_state["tasks_completed"] / 5.0, 1.0)
    productivity_score = min(final_state["total_productivity"] / 3.0, 1.0)
    energy_score = final_state["energy"] / 100.0
    return min((task_score * 0.6) + (productivity_score * 0.3) + (energy_score * 0.1), 1.0)


def run_episode(task_name: str) -> tuple[float, int]:
    env = StudyProductivityEnv()
    observation = env.reset()
    step_count = 0

    print(f"[START] task={task_name}", flush=True)

    done = False
    final_state = observation
    while not done:
        action = choose_action(observation)
        result = env.step(action)
        final_state = result["state"]
        step_count += 1
        print(
            "[STEP] "
            f"step={step_count} "
            f"action={action} "
            f"reward={result['reward']} "
            f"day={final_state['day']} "
            f"energy={final_state['energy']:.1f} "
            f"tasks={final_state['tasks_completed']} "
            f"productivity={final_state['total_productivity']:.3f}",
            flush=True,
        )
        observation = final_state
        done = result["done"]

    score_by_task = {
        "easy": grade_easy(final_state),
        "medium": grade_medium(final_state),
        "hard": grade_hard(final_state),
    }
    score = score_by_task[task_name]
    print(f"[END] task={task_name} score={score:.3f} steps={step_count}", flush=True)
    return score, step_count


def main() -> int:
    """Run deterministic task episodes and emit structured validator output."""
    try:
        for task_name in ("easy", "medium", "hard"):
            run_episode(task_name)
        return 0
    except Exception as exc:
        print(f"inference.py failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
