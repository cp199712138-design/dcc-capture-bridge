# Instant Canvas Coordination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Instant Canvas split threads into a real coordinated development system with scoped child-thread tasks, local ownership files, and dispatcher verification.

**Architecture:** The `00 项目总览` thread is the dispatcher. The six child threads own focused folders and report evidence back using a fixed status format. Shared files are allowed only when the task names the exact section and verification command.

**Tech Stack:** Static browser canvas, Node local server, MAXScript 3ds Max adapter, future Blender Python adapter, local git, Codex thread dispatch.

---

## File Structure

- Create `development/00-dispatch/README.md`: central ownership and reporting rules.
- Create `development/00-dispatch/thread-map.md`: current thread names and workspace root.
- Create `development/00-dispatch/acceptance-checklist.md`: dispatcher verification checklist.
- Create `UI/TASKS.md`: UI thread scope and first repair assignment.
- Create `Canvas/TASKS.md`: Canvas thread scope and first repair assignment.
- Create `API/TASKS.md`: API thread scope and first repair assignment.
- Create `3ds Max/TASKS.md`: 3ds Max thread scope and first repair assignment.
- Create `Blender/TASKS.md`: Blender thread scope and first repair assignment.
- Create `测试发布/TASKS.md`: testing and release thread scope and first repair assignment.
- Modify `development/README.md`: add `00-dispatch` to the module map.

## Product Design Brief

Instant Canvas is a DCC evidence-to-AI realtime editing canvas. The customer-facing surface should feel like a serious Krea-style production tool: dark, dense, bilingual, canvas-first, with truthful provider status and no fake AI output.

The current work is coordination and repair, not a fresh visual redesign. Product Design follow-up belongs in `01 UI` and `02 Canvas` after their scoped audits return evidence.

---

### Task 1: Establish Dispatcher Control

**Files:**
- Create: `development/00-dispatch/README.md`
- Create: `development/00-dispatch/thread-map.md`
- Create: `development/00-dispatch/acceptance-checklist.md`
- Modify: `development/README.md`

- [ ] **Step 1: Add dispatcher folder**

Create the dispatcher files with thread ownership, conflict rules, and report format.

- [ ] **Step 2: Register dispatcher in development map**

Add `00-dispatch/` to `development/README.md` above `01-ui-shell/`.

- [ ] **Step 3: Verify**

Run:

```powershell
Get-ChildItem development\00-dispatch
```

Expected: `README.md`, `thread-map.md`, and `acceptance-checklist.md` are present.

---

### Task 2: Create Child Thread Task Files

**Files:**
- Create: `UI/TASKS.md`
- Create: `Canvas/TASKS.md`
- Create: `API/TASKS.md`
- Create: `3ds Max/TASKS.md`
- Create: `Blender/TASKS.md`
- Create: `测试发布/TASKS.md`

- [ ] **Step 1: Write one scoped assignment per responsibility folder**

Each file must include:

```text
Owner thread
Scope
Do not touch
First assignment
Verification
Report format
```

- [ ] **Step 2: Verify no unowned broad assignment exists**

Run:

```powershell
Get-ChildItem UI,Canvas,API,'3ds Max',Blender,'测试发布' -Filter TASKS.md
```

Expected: six `TASKS.md` files are present.

---

### Task 3: Dispatch Work to Existing Threads

**Files:**
- No direct file edits.

- [ ] **Step 1: Send UI assignment**

Send the content of `UI/TASKS.md` to `Instant Canvas 即时画布 / 01 UI`.

- [ ] **Step 2: Send Canvas assignment**

Send the content of `Canvas/TASKS.md` to `Instant Canvas 即时画布 / 02 Canvas`.

- [ ] **Step 3: Send API assignment**

Send the content of `API/TASKS.md` to `Instant Canvas 即时画布 / 03 API`.

- [ ] **Step 4: Send 3ds Max assignment**

Send the content of `3ds Max/TASKS.md` to `Instant Canvas 即时画布 / 04 3ds Max`.

- [ ] **Step 5: Send Blender assignment**

Send the content of `Blender/TASKS.md` to `Instant Canvas 即时画布 / 05 Blender`.

- [ ] **Step 6: Send testing/release assignment**

Send the content of `测试发布/TASKS.md` to `Instant Canvas 即时画布 / 06 测试发布`.

- [ ] **Step 7: Verify thread dispatch**

Use thread list state to confirm all six child threads exist and have received messages.

---

### Task 4: Dispatcher Verification

**Files:**
- Read: `development/00-dispatch/acceptance-checklist.md`

- [ ] **Step 1: Run cheap static checks**

Run:

```powershell
git status --short
node capture-canvas/check-page.mjs
node capture-canvas/test-api-contract.mjs
```

Expected: command output either passes or identifies a specific failing subsystem.

- [ ] **Step 2: Run full smoke checks when child threads report completion**

Run:

```powershell
node capture-canvas/simulate-flow.mjs
node capture-canvas/browser-smoke.mjs
```

Expected: both pass, or `browser-smoke.mjs` reports an environment blocker that is not a product bug.

- [ ] **Step 3: Final audit**

Compare changed files to the ownership map. If a thread edited outside scope, route the conflict back to that thread before handoff.

---

## Self-Review

Spec coverage:

- Uses existing `Instant Canvas 即时画布 / 00-06` threads rather than creating duplicate project entries.
- Establishes a real dispatcher plan and local ownership files.
- Splits UI, Canvas, API, 3ds Max, Blender, and testing/release responsibilities.
- Keeps Product Design scope focused on UI/Canvas audit because no new visual target has been confirmed.
- Keeps GitHub scope to branch/readiness coordination until the user asks to push or open a PR.
- Keeps Chrome and Computer Use as verification surfaces, not unnecessary automation.

Placeholder scan:

- No `TBD`, `TODO`, or unbounded "implement later" assignments are used.

Type consistency:

- Thread names match the current Codex sidebar entries.
- Verification commands match the scripts documented in the current README.
