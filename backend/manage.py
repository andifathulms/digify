#!/usr/bin/env python
"""Entry point administratif Django."""

import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:  # pragma: no cover - hanya kalau environment rusak
        raise ImportError(
            "Django tidak ditemukan. Jalankan lewat Docker: docker compose up --build"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
