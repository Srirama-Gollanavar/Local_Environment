"""Reference inference entrypoints for OpenEnv validation.

This module mirrors the JavaScript environment so automated checks can import
`reset`, `step`, and `state` directly from the repo root.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
import os
import sys
from typing import Dict, Any
from urllib import error, request


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
MODEL_CACHE: str | None = None


def reset() -> Dict[str, Any]:
    return ENV.reset()


def state() -> Dict[str, Any]:
    return ENV.state()


def step(action: str) -> Dict[str, Any]:
    return ENV.step(action)


def server() -> None:
    """Console entry point required by the OpenEnv validator."""
    main()


def emit_structured(line: str) -> None:
    """Write validator-facing output to stdout immediately."""
    sys.stdout.write(f"{line}\n")
    sys.stdout.flush()


def get_required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def parse_action(raw_text: str) -> str:
    normalized = raw_text.strip().lower()
    for action in ("study", "rest", "skip"):
        if action in normalized:
            return action
    raise RuntimeError(f"Model returned invalid action: {raw_text!r}")


def prompt_messages(task_name: str, observation: Dict[str, Any]) -> list[Dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You are controlling a study productivity simulation. "
                "Choose exactly one action from: study, rest, skip. "
                "Return only the single action word."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Task: {task_name}\n"
                f"Day: {observation['day']}\n"
                f"Energy: {observation['energy']}\n"
                f"Tasks completed: {observation['tasks_completed']}\n"
                f"Current productivity: {observation['productivity']}\n"
                f"Total productivity: {observation['total_productivity']}\n"
                "Pick the best next action and answer with only one word."
            ),
        },
    ]


def choose_action(observation: Dict[str, Any]) -> str:
    """Fallback heuristic so inference still completes if the proxy is unavailable."""
    energy = observation["energy"]
    tasks_completed = observation["tasks_completed"]

    if energy <= 30:
        return "rest"
    if energy > 50:
        return "study"
    if tasks_completed < 2:
        return "study"
    return "rest"


def get_preferred_model_candidates() -> list[str]:
    candidates = [
        os.environ.get("MODEL"),
        os.environ.get("OPENAI_MODEL"),
        os.environ.get("LLM_MODEL"),
        os.environ.get("MODEL_NAME"),
        "gpt-4.1-mini",
        "gpt-4.1",
        "gpt-4o",
        "o4-mini",
        "gpt-4o-mini",
    ]
    return [candidate for candidate in candidates if candidate]


def fetch_available_models(api_base_url: str, api_key: str) -> list[str]:
    endpoint = f"{api_base_url.rstrip('/')}/models"
    http_request = request.Request(
        endpoint,
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )

    try:
        with request.urlopen(http_request) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return []

    models = []
    for item in payload.get("data", []):
        model_id = item.get("id")
        if isinstance(model_id, str) and model_id:
            models.append(model_id)
    return models


def select_model(api_base_url: str, api_key: str) -> str:
    global MODEL_CACHE
    if MODEL_CACHE:
        return MODEL_CACHE

    preferred = get_preferred_model_candidates()
    available = fetch_available_models(api_base_url, api_key)

    for candidate in preferred:
        if candidate in available:
            MODEL_CACHE = candidate
            return MODEL_CACHE

    if available:
        MODEL_CACHE = available[0]
        return MODEL_CACHE

    MODEL_CACHE = preferred[0]
    return MODEL_CACHE


def try_choose_action_via_proxy(task_name: str, observation: Dict[str, Any]) -> str:
    api_base_url = get_required_env("API_BASE_URL")
    api_key = get_required_env("API_KEY")
    messages = prompt_messages(task_name, observation)
    attempted_models: list[str] = []

    primary_model = select_model(api_base_url, api_key)
    for model in [primary_model, *get_preferred_model_candidates()]:
        if model in attempted_models:
            continue
        attempted_models.append(model)
        try:
            return choose_action_via_http(api_base_url, api_key, model, messages)
        except RuntimeError as exc:
            if "does not exist" in str(exc).lower() or "notfounderror" in str(exc).lower():
                continue
            raise

    raise RuntimeError(f"No working model found through the LLM proxy: {attempted_models}")


def choose_action_via_http(
    api_base_url: str,
    api_key: str,
    model: str,
    messages: list[Dict[str, str]],
) -> str:
    payload = json.dumps(
        {
            "model": model,
            "messages": messages,
            "temperature": 0,
            "max_tokens": 4,
        }
    ).encode("utf-8")
    endpoint = f"{api_base_url.rstrip('/')}/chat/completions"
    http_request = request.Request(
        endpoint,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request) as response:
            response_data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LLM proxy request failed: {exc.code} {detail}") from exc

    content = response_data["choices"][0]["message"]["content"]
    return parse_action(content)


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

    emit_structured(f"[START] task={task_name}")

    done = False
    final_state = observation
    while not done:
        try:
            action = try_choose_action_via_proxy(task_name, observation)
        except Exception:
            action = choose_action(observation)
        result = env.step(action)
        final_state = result["state"]
        step_count += 1
        emit_structured(f"[STEP] step={step_count} reward={result['reward']}")
        observation = final_state
        done = result["done"]

    score_by_task = {
        "easy": grade_easy(final_state),
        "medium": grade_medium(final_state),
        "hard": grade_hard(final_state),
    }
    score = score_by_task[task_name]
    emit_structured(f"[END] task={task_name} score={score:.3f} steps={step_count}")
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
