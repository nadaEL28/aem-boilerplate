#!/usr/bin/env python3
"""Remind the agent when an edit reintroduces a known accessibility miss."""

import json
import re
import sys

raw = sys.stdin.read()
notes = []

if re.search(r"removeAttribute\(\s*['\"]alt['\"]\s*\)", raw):
    notes.append(
        "This edit calls removeAttribute('alt'). A11Y-142 was that bug. "
        "Pass the authored alt through. Use alt=\"\" only for a decorative image."
    )

if re.search(r"outline\s*:\s*none", raw, re.IGNORECASE):
    notes.append(
        "This edit sets outline: none. Keep a visible :focus-visible style "
        "at least as clear as the header nav button."
    )

if notes:
    json.dump({"additional_context": " ".join(notes)}, sys.stdout)
else:
    json.dump({}, sys.stdout)
