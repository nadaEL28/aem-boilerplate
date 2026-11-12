# Slack messages for #bugs

Paste each one as its own top-level message in a public channel. The automation trigger is "New message in channel", which fires on top-level messages only.

## 1. Vague

the banner thing looks broken on my phone

## 2. Reproducible (A11Y-142)

Cards block: VoiceOver announces the launch photo as an unlabeled image.

Steps: open a page with a cards block, image cell alt "Team planning a launch". After decorate, the fallback img in the optimized picture has no alt attribute. Chrome, VoiceOver, macOS. Expected: the author alt is still on that img. A11Y-142.

## 3. Usage question

How do I run this site on my machine, and which command lints and tests?
