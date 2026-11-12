# Bugbot review rules

Project rules for Bugbot. See https://cursor.com/docs/bugbot.

If a changed file adds a new block under `blocks/<name>/` and the diff does not both preserve image alternative text and add a visible `:focus` or `:focus-visible` style for controls in that block, then:

- Add a blocking Bug titled "New block is missing alt text or focus styles"
- Body: "A new block must handle image alt text and keyboard focus styles. Pass authored alt through to the fallback img. Do not ship `outline: none` unless a visible replacement is in the same change."

If any changed file contains `/\.innerHTML\s*=/` and the value is not a string literal written in that function, then:

- Add a blocking Bug titled "innerHTML with unsanitized content"
- Body: "innerHTML is assigned from content that is not a local string literal. Fetched HTML and author HTML can inject markup. Build the DOM with DOM APIs, or sanitize before assignment."

If the PR modifies `blocks/**/*.{js,css}` and does not also modify `blocks/<same-block>/README.md`, then:

- Add a non-blocking Bug titled "Block changed without a README update"
- Body: "This PR changes block markup or behavior and does not update that block's README. Describe the authored cells and any accessibility contract."
