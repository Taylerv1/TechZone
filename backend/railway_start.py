from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
PORT = os.environ.get('PORT', '8000')


def run_step(*args: str) -> None:
    subprocess.run(args, cwd=BACKEND_DIR, check=True)


def main() -> None:
    python_executable = sys.executable

    run_step(python_executable, 'manage.py', 'migrate', '--noinput')
    run_step(python_executable, 'manage.py', 'collectstatic', '--noinput')

    os.execvp(
        python_executable,
        [
            python_executable,
            '-m',
            'gunicorn',
            'config.wsgi:application',
            '--chdir',
            str(BACKEND_DIR),
            '--bind',
            f'0.0.0.0:{PORT}',
        ],
    )


if __name__ == '__main__':
    main()
