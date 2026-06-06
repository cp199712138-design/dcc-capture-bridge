# Reality-first Principles

## Core Rule

Do not ship fake value.

A feature is only real if it passes all three checks:

```text
Useful to a customer
Recognizable by AI / downstream workflow
Verified in the actual target software
```

## What Counts as Real

### Real viewport capture

A saved image from the active viewport at the real viewport pixel size.

### Real production render

A file produced by the current DCC renderer using the user's current render setup.

### Real AI-ready input

An image or pass that can be fed into an AI workflow and produce a measurable, inspectable result.

### Real ComfyUI integration

A workflow that successfully uploads input, submits a prompt, receives a prompt id, and retrieves output.

## What Does Not Count

- Claiming 8K viewport capture when the API only captures current viewport pixels.
- Hiding normal render behavior behind a new button and calling it unique.
- Adding AI labels without a working workflow.
- Hard-coding a ComfyUI workflow without checking nodes exist.
- Showing UI tabs for features that cannot run yet unless they are clearly marked as planned.

## Product Test

Before adding a feature, ask:

1. What exact problem does it solve?
2. Who uses it?
3. What file or output proves it worked?
4. Can AI use this output directly?
5. Can we demonstrate it in under three minutes?

If the answer is unclear, do not build it yet.
