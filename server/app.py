"""Minimal server entry point expected by OpenEnv validation."""

from inference import reset


def main() -> None:
    """Start the validation server entry point."""
    print("OpenEnv server entry point ready.")
    print(reset())
