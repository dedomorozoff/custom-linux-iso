# ISO Build: Detailed Guide

This document describes how the generated `build-vibe-linux.sh` script works, what dependencies are required, and how to customize the process.

## Script Architecture

1. **Environment Preparation**
   - Root check, dependency check
   - Create working directory `workdir/`
   - Download base image (debootstrap, pacstrap, dnf --installroot)

2. **Base System**
   - Install kernel, initramfs, systemd
   - Network configuration (NetworkManager, systemd-resolved)
   - Locales, timezone, layout
   - User with passwordless sudo (for live session)

3. **Graphics Subsystem**
   - Xorg + Openbox (minimal WM) or GNOME (via flatpak/repos)
   - LightDM with auto-login
   - PipeWire + WirePlumber for audio
   - Fonts, themes, icons

4. **Package Managers and Languages**
   - Flatpak + Flathub
   - fnm (Node), pyenv (Python), rustup (Rust)
   - Go (official tarball), Bun, Deno
   - pipx for isolated Python utilities

5. **Editors and AI**
   - Flatpak: dev.zed.Zed, com.visualstudio.code
   - VS Code extensions: Continue, Cline
   - CLI: aider-chat (pip), gpt-engineer (pipx)
   - Ollama (deb/rpm/AUR) + `llama3` model

6. **Wizard**
   - Script `/usr/local/bin/vibe-wizard` (bash + whiptail/zenity)
   - systemd unit `vibe-wizard.service` (Type=oneshot, runs after graphical session)
   - Installs missing packages, clones dotfiles, configures git based on selection

7. **Finalization**
   - Clean apt/dnf/pacman cache, remove logs
   - Create live user with passwordless sudo
   - Squashfs root, create ISO with ISOLINUX (BIOS) and GRUB EFI
   - Checksum verification

## Host Dependencies

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y \
  debootstrap squashfs-tools xorriso \
  grub-pc-bin grub-efi-amd64-bin \
  mtools dosfstools \
  qemu-utils \
  whiptail
```

For Arch image build additionally:

```bash
sudo apt install -y arch-install-scripts
```

### Arch Linux

```bash
sudo pacman -Syu --needed \
  arch-install-scripts squashfs-tools \
  libisoburn dosfstools mtools \
  grub
```

### Fedora

```bash
sudo dnf install -y \
  squashfs-tools xorriso \
  grub2-tools mtools dosfstools \
  dnf-plugins-core
```

## Working Directory Structure

```
workdir/
  chroot/               # mounted root filesystem
  iso/
    live/               # squashfs
    boot/
      grub/
      isolinux/
    EFI/
  build.log
```

## Customization

### Add Custom Packages

In `generateBuildScript` function, find the block for selected base (debian/ubuntu → apt, arch → pacman, fedora → dnf) and add packages to the array.

Example (Ubuntu):

```bash
apt install -y \
  neovim ripgrep fd-find \
  build-essential pkg-config \
  ...
```

### Change WM/DE

Openbox + tint2 is used by default. To install GNOME/KDE:

- Ubuntu: `apt install -y ubuntu-desktop`
- Arch: `pacman -S gnome`
- Fedora: `dnf groupinstall "Workstation"`

Replace Openbox launch in `/etc/xdg/openbox/autostart` or switch DM to gdm.

### Custom Dotfiles

Add repository cloning to `/etc/skel` in the script:

```bash
git clone https://github.com/<user>/dotfiles /etc/skel/.dotfiles
```

Then create symlinks in post-install.

### Disable Auto-Login

In LightDM config (`/etc/lightdm/lightdm.conf`) comment out `autologin-user=`.

## Building Each Base

### Ubuntu 24.04

- Uses debootstrap noble
- main/universe/multiverse repositories
- PPA for fresh versions (neovim, git)
- Flatpak from official PPA

### Debian 13

- debootstrap trixie
- contrib and non-free-firmware included
- Backports for new packages

### Arch

- pacstrap base linux linux-firmware
- AUR helper (yay) for packages like cursor-bin
- rolling release

### Fedora 43

- dnf --installroot
- RPM Fusion for multimedia
- Flatpak from Fedora repositories

## Debugging

- Build logs in chroot: `/root/build.log`
- Check squashfs: `unsquashfs -l workdir/iso/live/filesystem.squashfs`
- Test in QEMU:
  ```bash
  qemu-system-x86_64 -m 4096 -cdrom vibe-linux-*.iso -enable-kvm
  ```
- Mount ISO for inspection:
  ```bash
  sudo mount -o loop vibe-linux-*.iso /mnt
  ls /mnt
  ```

## Common Issues

**debootstrap: command not found**
→ install `debootstrap`

**xorriso: cannot find grub-mkrescue**
→ install `grub-pc-bin grub-efi-amd64-bin`

**filesystem.squashfs file > 4 GiB**
→ UDF is used for files larger than 4 GiB (`-udf` flag in xorriso)

**Not enough space**
→ ~30 GB free required

**Network error in chroot**
→ copy `/etc/resolv.conf` to `workdir/chroot/etc/`

**LightDM not starting**
→ check drivers in VM, add `nomodeset` to kernel parameters

## Performance

- SSD strongly recommended
- Package caching speeds up repeated builds
- Use QEMU with KVM for tests
