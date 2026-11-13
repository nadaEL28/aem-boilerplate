#!/usr/bin/env python3
"""Deny a push to the Adobe upstream remote, and any force-push."""

import json
import re
import sys

raw = sys.stdin.read()
try:
    command = json.loads(raw).get("command") or ""
except json.JSONDecodeError:
    command = raw


def deny(message: str) -> None:
    json.dump(
        {
            "permission": "deny",
            "user_message": message,
            "agent_message": message,
        },
        sys.stdout,
    )
    sys.exit(0)


for part in re.split(r"(?:&&|\|\||;|\n)", command):
    if not re.search(r"\bgit\s+push\b", part):
        continue
    if re.search(r"--force(?:-with-lease)?|(?:^|\s)-f(?:\s|$)", part):
        deny("Force-push is blocked in this trial repo.")
    if "adobe/aem-boilerplate" in part or re.search(r"\bgit\s+push\s+upstream\b", part):
        deny(
            "Push stays on nadaEL28/aem-boilerplate. Do not push to adobe/aem-boilerplate."
        )

json.dump({"permission": "allow"}, sys.stdout)
