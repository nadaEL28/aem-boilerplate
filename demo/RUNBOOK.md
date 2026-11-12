# Demo runbook (30 minutes)

Fork only: `nadaEL28/aem-boilerplate`, base `main`. Never push or open a PR against `adobe/aem-boilerplate`.

## Seeded bug (say this out loud)

**A11Y-142** is in `blocks/cards/cards.js`. `decorate` still calls `createOptimizedPicture` with the author alt, then `removeAttribute('alt')` on the fallback `img`. An image authored as `alt="Team planning a launch"` is rendered with no alt attribute (WCAG 1.1.1). The axe check that would fail is `test/a11y.test.mjs` → "cards decorate keeps the author image alt". It is skipped with `TODO(A11Y-142)` so `npm test` stays green on `main`. Prompt B should fix the line and remove the skip. Do not fix it before the demo.

## Day before

Merge the `demo-setup` pull request into `main` on this fork. Cloud agents fork from the default branch. Until that merge, they will not see the tests, rules, or A11Y-142.

Then do the manual dashboard steps below. After they are done:

1. Cloud agent (not Prompt A or B). In the Agents Window, Cloud dropdown, repo `nadaEL28/aem-boilerplate`, branch `main`. Prompt: "Add `blocks/hero/README.md` describing the existing hero CSS (full-bleed wrapper, white heading on the photo). Run `npm run lint` and `npm test`. Open a PR with a screenshot of a hero." Wait until it finishes and the PR has an artifact. Docs: [Capabilities](https://cursor.com/docs/cloud-agent/capabilities).
2. Bugbot on that PR. If it did not review on its own, comment `cursor review`.
3. One automation run. Paste Slack message 3 from `demo/slack-messages.md` into the public channel. Confirm a thread reply that points at the README.

## Manual setup (you have to click these)

- **Bugbot.** Connect GitHub if needed, then open Bugbot in [Automations](https://cursor.com/automations) and turn it on for `nadaEL28/aem-boilerplate`. [Bugbot](https://cursor.com/docs/bugbot).
- **Slack.** [Cursor integrations](https://cursor.com/docs/integrations/slack): Connect Slack, install the app, pick this fork as a default repo. The channel must be public.
- **Automation.** Agents Window, [cursor.com/automations](https://cursor.com/automations), or `/automate`. Trigger: **New message in channel** (top-level messages only). Channel: that public channel. Instructions: `demo/automation-prompt.md`, unchanged. Tools: Send to Slack, Read Slack, Memories. Repository `nadaEL28/aem-boilerplate`, branch `main`. Turn off opening pull requests if that tool is listed. [Automations](https://cursor.com/docs/cloud-agent/automations).
- **Spend limit.** Cloud Agents ask for one the first time you use them ([Cloud Agents](https://cursor.com/docs/cloud-agent)). Personal on-demand spend is at [cursor.com/dashboard/spending](https://cursor.com/dashboard/spending). A team admin sets the team cap under usage-based pricing. If the automation runs as a service account: Dashboard → Settings → API Keys → Service Accounts → Edit spend limit ([Service accounts](https://cursor.com/docs/account/enterprise/service-accounts)). Pick a cap you are willing to spend for this demo.
- **Artifacts on the PR.** Cloud Agents dashboard: allow posting artifacts to GitHub if you want the screenshot or recording in the PR body ([Capabilities](https://cursor.com/docs/cloud-agent/capabilities)).

## Minute by minute

| Time | Do | Say while you wait | If it is slow |
| --- | --- | --- | --- |
| 0:00 | Cmd+Shift+P → Open Agents Window. Show this repo. | The team has to ship an accessible promo banner, fix one a11y bug, and keep CI green, while Slack keeps arriving. | Stay in the editor. The Cloud dropdown is the same control. [Agents Window](https://cursor.com/docs/agent/agents-window). |
| 0:02 | Cloud dropdown. Paste Prompts A, B, and C from `demo/live-prompts.md` as three cloud agents. Target this fork, base `main`. | Three agents, three branches: a new block, the audit, a contributor guide. Each VM installs from `.cursor/environment.json` and starts `aem up` on port 3000. | Open [cursor.com/agents](https://cursor.com/agents) and start the same three there. |
| 0:06 | Prompt D in the model picker, three models, local. Do not let them commit. | Same rename, three models. `--text-color` is in `styles/styles.css`. | `agent --list-models`, then `agent -p --mode=ask` with Prompt D and "do not edit files". |
| 0:12 | Open yesterday's finished agent. Show the screenshot or recording, then the PR. | This is the evidence bar in `.cursor/rules/definition-of-done.mdc`: artifact plus how I verified. | Open the PR files changed if the artifact pane is empty. Narrate `npm test` from the log. |
| 0:16 | Open that PR's Bugbot review. | `.cursor/BUGBOT.md`: alt and focus on new blocks, unsanitized `innerHTML` blocks, a README warning if block code changes alone. | Comment `cursor review` or `bugbot run`. [Bugbot](https://cursor.com/docs/bugbot). |
| 0:20 | Paste Slack messages 1 and 2 (and 3 if you skipped it yesterday). | Vague report gets at most three questions. The usage question should cite Running locally. A11Y-142 should come back as a real bug, with a priority and a reviewer from git history. No PR. | Read yesterday's usage-question thread. Triage message 2 yourself from `cards.js` if the bot is quiet. |
| 0:25 | Plan mode. Paste `demo/spec-request.md`. Do not accept a build. | Marketing asked for a banner with a countdown. Plan mode turns that into a spec before anyone writes the block. Prompt A is already building the accessible version. | CLI: `agent -p --plan` with the same sentence. [Parameters](https://cursor.com/docs/cli/reference/parameters). |
| 0:28 | Terminal: `agent -p --mode=ask "What does npm test cover, and which check is skipped for A11Y-142? Do not edit files."` | Same agent, no window: scripts and CI. | If `agent` is missing: `curl https://cursor.com/install -fsS \| bash`, then `agent login`. [Headless CLI](https://cursor.com/docs/cli/headless). |

Stop at 0:30 even if A–C are still running. Say you will open their PRs when the VMs finish. Do not merge a live agent's PR on stage.
