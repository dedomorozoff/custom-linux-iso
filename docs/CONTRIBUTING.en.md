# Contributing Guide

Thanks for your interest in the project! This document describes how to contribute: add support for a new base, new editor or AI agent, improve the wizard.

## Local Development

```bash
git clone https://github.com/<user>/vibe-linux-builder.git
cd vibe-linux-builder
npm install
npm run dev
```

The app opens at http://localhost:5173

## Project Structure

- `src/App.tsx` — main UI, script generator, demo wizard
- `src/utils/cn.ts` — Tailwind class utility
- `src/index.css` — global styles
- `docs/` — build documentation
- `.github/workflows/deploy.yml` — CI for GitHub Pages

## How to Add a New Editor

1. In `src/App.tsx`, find the `editors` array (component state).
2. Add an object:

```ts
{
  id: 'sublime',
  name: 'Sublime Text',
  desc: 'Lightweight editor, AI via plugins',
  selected: false
}
```

3. In `generateBuildScript` function, add installation. Example for Flatpak:

```bash
flatpak install -y flathub com.sublimetext.four
```

Or via .deb/.rpm.

4. Update wizard: add item to `wizardSteps` array if selection is needed.

## How to Add a New AI Agent

Similar to editors, but in the `agents` array. For CLI tools, add installation via pip/pipx/npm.

Example:

```ts
{
  id: 'opencode',
  name: 'OpenCode',
  desc: 'AI agent for project generation',
  selected: true
}
```

In the script:

```bash
pipx install opencode-ai
```

## New Base Support

Add an option to `baseOptions`:

```ts
{ id: 'alpine', name: 'Alpine 3.20', desc: 'Minimalist, musl', selected: false }
```

Then in `generateBuildScript` add installation block via `apk`.

Ensure that:
- kernel and bootloader are installed
- NetworkManager or equivalent is present
- systemd or OpenRC works (adapt wizard)

## Wizard Modification

Wizard is described as `wizardSteps` array. Each step is an object with `title`, `desc`, and optionally `options`.

To add real logic, edit lines where `/usr/local/bin/vibe-wizard` is generated in `generateBuildScript`. It uses `whiptail` for TUI.

Example adding an item:

```bash
whiptail --title "Additional Tools" --checklist "Select:" 20 70 6 \
  "lazygit" "TUI for git" ON \
  "btop" "Resource monitor" ON 2> /tmp/choice
```

## Code Style

- Strict TypeScript, no any
- Functional components, hooks
- Tailwind for styles, no inline styles
- Accessibility: semantic tags, focus styles

## Script Testing

Before PR, test generation:

1. Select parameters in UI
2. Download script
3. Review manually
4. (Optional) run in VM or Docker

Do not commit generated ISOs.

## Submitting PR

1. Fork the repository
2. Create a branch: `git checkout -b feature/add-helix`
3. Make changes, test locally
4. Ensure `npm run build` passes without errors
5. Commit with clear message
6. Open PR with description

## Bug Reports

Open an Issue with:

- Problem description
- Steps to reproduce
- Expected and actual result
- Screenshot (if UI)
- Node/npm version

## Suggestions

Ideas for development:

- ARM64 support
- Nix integration
- Presets (frontend, data-science, embedded)
- Config export to JSON/YAML
- Script validation with shellcheck

Thanks for contributing!
