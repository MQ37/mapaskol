#!/bin/sh
if [ -z "$1" ]; then
    python3 -m http.server 5000 --directory www
elif [ "$1" = "flask" ]; then
    venv/bin/python webapp/app.py
fi
