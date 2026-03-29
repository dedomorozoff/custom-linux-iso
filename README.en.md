# Vibe Linux ISO Builder

Web configurator for generating a bash script that builds a custom Linux ISO for vibe coding (programming with AI). The script installs modern editors (Zed, Cursor, VS Code, Neovim, Helix), AI agents (Continue, Aider, GPT-Engineer, Cline, OpenCode), languages (Node.js LTS, Python 3.12, Rust, Go, Bun, Deno), and development tools.

Additionally, a graphical post-install wizard (TUI based on whiptail/zenity) is embedded in the image, which runs on first live session start and allows installing selected components.

## Features

- Base selection: Ubuntu 24.04 LTS, Debian 13, Arch Linux, Fedora 43
- User, hostname, layout, NVIDIA drivers configuration
- Editor installation with AI assistants
- CLI agents for code auto-generation and refactoring
- Local LLMs via Ollama
- Docker/Podman, git, gh, tmux, fzf, ripgrep
- Auto-login and setup wizard in live mode
- Ready-to-use `build-vibe-linux.sh` generation

## How to Use (Web App)

1. Open the app in a browser (locally `npm run dev` or on GitHub Pages).
2. Configure settings: base, user, software list.
3. Click "Download build.sh" or copy the script from the Script tab.
4. Run the script on a Linux machine (Ubuntu/Debian 13+ recommended) as root.

```bash
sudo bash build-vibe-linux.sh
```

The script creates a temporary directory, builds the base system chroot, installs packages, adds the wizard, and builds an ISO using `xorriso`.

Build machine requirements:
- sudo/root
- ~25–50 GB free space
- packages: debootstrap (for Debian/Ubuntu), arch-install-scripts (for Arch), dnf, squashfs-tools, xorriso, mtools, dosfstools, qemu-utils
- fast internet

Result: `vibe-linux-<base>-<version>-amd64.iso` in the working directory.

## Post-Install Wizard

When booting the live system, `/usr/local/bin/vibe-wizard` automatically launches:

- Step 1: Welcome, system information
- Step 2: Additional base selection (Flatpak, NVIDIA, Ollama)
- Step 3: Editor selection
- Step 4: AI agent selection
- Step 5: Language runtime selection
- Step 6: Apply (installs missing components, configures git, zsh, tmux)

Wizard uses `whiptail` in TTY and `zenity` in graphical session.

## Project Build

Local development:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Deploy to GitHub Pages

### Option 1: Automatic via GitHub Actions

The repository already contains `.github/workflows/deploy.yml`. On push to `main`/`master` branch, it builds the site and publishes to `gh-pages` branch.

Steps:

1. Create a GitHub repository and push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Vibe Linux Builder"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
2. In repository Settings → Pages → Source: select `gh-pages` branch and `/ (root)` folder.
3. After the first push, Action builds the project. Site will be available at `https://<username>.github.io/<repo>/`.

The workflow file automatically detects the base path from the repository name.

### Option 2: Manual deploy with gh-pages

For manual publishing from local machine:

```bash
npm install
npm run deploy
```

The script builds the project and pushes the `dist` folder to `gh-pages` branch. Make sure `base` is set correctly in `vite.config.ts` if deploying to a subdirectory.

To build with correct base manually:

```bash
npm run deploy:gh
```

Or add to `package.json`:

```json
"homepage": "https://<username>.github.io/<repo>/"
```

and configure `base` in `vite.config.ts`:

```ts
export default defineConfig({
  base: '/<repo>/',
  // ...
});
```

### Local production build preview

```bash
npm run build
npm run preview
```

## Script Structure

Generated `build-vibe-linux.sh` does the following:

1. Checks dependencies (debootstrap/pacstrap/dnf, xorriso, mtools, squashfs-tools).
2. Creates working directory and mounts base system.
3. Installs kernel, systemd, NetworkManager, PipeWire, Xorg/Wayland, display manager (lightdm), and minimal environment (Openbox or GNOME components).
4. Configures user, sudo, auto-login.
5. Adds repositories (Flathub) and installs Flatpak apps: Zed, Cursor, VS Code.
6. Installs version managers: `fnm` (Node), `pyenv` (Python), `rustup`, plus Go, Bun, Deno.
7. Installs CLI agents: `aider-chat`, `gpt-engineer`, configures Continue and Cline (VS Code extensions, instructions).
8. Installs Ollama and pulls `llama3` model (optional).
9. Copies wizard (`/usr/local/bin/vibe-wizard`) and systemd service for auto-start.
10. Cleans cache, creates squashfs, and builds bootable ISO (BIOS/UEFI) with ISOLINUX/GRUB.

## Customization

Edit the generator in `src/App.tsx` (function `generateBuildScript`) if you need to:

- Add packages to the base image
- Change Flatpak ID list
- Switch display manager (lightdm → gdm/sddm)
- Add custom dotfiles

## Security

- Script requires root for mounting chroot and creating images.
- Review the generated bash script before running.
- Image is for local use; do not include secrets.

## License

MIT. Use freely, modify for your needs. PRs and ideas welcome!

## Support

If something doesn't work:
- Check build logs in `workdir/chroot/root/build.log`
- Ensure all dependencies are installed
- For Arch, use a host with `arch-install-scripts`
- Report bugs via Issues in the repository
