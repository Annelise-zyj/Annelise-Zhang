# Annelise Portfolio Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve six standalone chapters and deliver one integrated, scrollable portfolio with the AboveBeneath scene transition, pointer bubbles, and audio behavior.

**Architecture:** Keep existing chapter markup and isolated scripts in same-origin iframes to avoid CSS and WebGL collisions. A parent shell owns chapter navigation, full-screen transitions, background scenes, pointer bubbles, and audio. Chapter 4 retains internal scrolling and modal playback.

**Tech Stack:** Vite, TypeScript, existing Three.js, vanilla DOM/CSS, audio elements and locally vendored AboveBeneath assets.

**Spec:** Current user conversation, plus `INTEGRATION_NOTES.md` in preserved source and Codrops `reference/AboveBeneath`.

## Global Constraints

- Preserve all six existing standalone pages in a separate snapshot before integration.
- Keep all existing portfolio media and content.
- Move final page left and right contact information lower.
- Only chapter transitions use full-screen motion; chapter 4 scrolls normally within itself.
- Third through final chapters use AboveBeneath's pointer-following bubble effect.
- Use AboveBeneath's lake, underwater and splash sound files. Pause while a project video plays.
- Navigation goes to integrated chapters; all modal close buttons remain usable.

## Review Focus

- Chapter navigation from directory and top nav reaches the right chapter without reloading the parent page.
- Returning from directory to cover hides directory content.
- Video playing and pausing controls ambient audio without restarting unexpectedly.
- Image and video paths still resolve in iframe pages after Vite build.
- Desktop and phone layouts keep controls visible and avoid horizontal overflow.

### Task 1: Preserve and prepare

- [x] Download and serve the AboveBeneath reference locally.
- [x] Lower contact groups in original page and save a snapshot of the six chapters.
- [x] Create a separate integration working copy.
- [ ] Copy the reference scene images and three audio files into the integration copy.

### Task 2: Build integrated shell

- [ ] Move original cover to `cover.html`; make `index.html` the shell.
- [ ] Add six full-screen chapter slots with isolated existing pages.
- [ ] Implement wheel, keyboard, touch and nav-driven chapter switching; retain inner scrolling and modals.
- [ ] Port AboveBeneath transform/scale transition geometry and timings.
- [ ] Port pointer bubble trail to chapters 3–6.

### Task 3: Sound and background

- [ ] Apply locally copied AboveBeneath scene images as atmospheric chapter backgrounds.
- [ ] Use lake above and underwater below, plus splash on chapter switching.
- [ ] Add a visible sound toggle and honor browser gesture requirements.
- [ ] Pause ambience during video playback and resume only when allowed.

### Task 4: Verify

- [ ] Build the integrated site without errors.
- [ ] Check all six chapters, images, video modal, photo globe, dialogs, cursor, and audio in a browser.
- [ ] Check desktop and phone layouts and report any remaining limitations.
