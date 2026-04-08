"""Server entry point for OpenEnv multi-mode deployment validation.

This module intentionally keeps imports light so repository validators can
discover it even before dependencies are installed. When ``openenv-core`` is
available, ``create_app`` returns a small ASGI app. Otherwise the module still
exposes a valid console entry point and a diagnostic payload.
"""

from __future__ import annotations

from typing import Any, Callable, Dict

from inference import reset, state, step


def get_environment_api() -> Dict[str, Callable[..., Any]]:
    """Return the callable environment API used by validators and adapters."""
    return {
        "reset": reset,
        "state": state,
        "step": step,
    }


def create_app() -> Any:
    """Create an ASGI app when ``openenv-core`` is installed.

    Validators sometimes only need the module and callable to exist. We keep a
    graceful fallback so imports do not fail in bare checkouts.
    """
    try:
        from openenv_core import create_app as openenv_create_app  # type: ignore
    except Exception:
        async def fallback_app(scope: Dict[str, Any], receive: Any, send: Any) -> None:
            body = (
                b'{"status":"missing_dependency","detail":"Install openenv-core>=0.2.0"}'
            )
            headers = [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode("ascii")),
            ]

            if scope.get("type") != "http":
                return

            await send(
                {
                    "type": "http.response.start",
                    "status": 503,
                    "headers": headers,
                }
            )
            await send(
                {
                    "type": "http.response.body",
                    "body": body,
                }
            )

        return fallback_app

    return openenv_create_app(get_environment_api())


app = create_app()


def main() -> None:
    """Console script entry point declared in ``pyproject.toml``."""
    initial_state = reset()
    print("OpenEnv server entry point ready.")
    print(initial_state)


if __name__ == "__main__":
    main()
