# Сборка ISO: подробное руководство

[🇬🇧 English version](BUILD.en.md)

Этот документ описывает, как работает сгенерированный скрипт `build-vibe-linux.sh`, какие зависимости требуются и как кастомизировать процесс.

## Архитектура скрипта

1. **Подготовка окружения**
   - Проверка root, зависимостей
   - Создание рабочей директории `workdir/`
   - Загрузка базового образа (debootstrap, pacstrap, dnf --installroot)

2. **Базовая система**
   - Установка ядра, initramfs, systemd
   - Настройка сети (NetworkManager, systemd-resolved)
   - Локали, часовой пояс, раскладка
   - Пользователь с sudo без пароля (для live-сессии)

3. **Графическая подсистема**
   - Xorg + Openbox (минимальный WM) или GNOME (через flatpak/репозитории)
   - LightDM с автологином
   - PipeWire + WirePlumber для аудио
   - Шрифты, темы, иконки

4. **Пакетные менеджеры и языки**
   - Flatpak + Flathub
   - fnm (Node), pyenv (Python), rustup (Rust)
   - Go (официальный tarball), Bun, Deno
   - pipx для изолированных Python-утилит

5. **Редакторы и AI**
   - Flatpak: io.zed.Zed, com.cursor.Cursor, com.visualstudio.code
   - VS Code расширения: Continue, Cline
   - CLI: aider-chat (pip), gpt-engineer (pipx)
   - Ollama (deb/rpm/AUR) + модель `llama3`

6. **Wizard**
   - Скрипт `/usr/local/bin/vibe-wizard` (bash + whiptail/zenity)
   - systemd unit `vibe-wizard.service` (Type=oneshot, запускается после графической сессии)
   - При выборе устанавливает недостающие пакеты, клонирует dotfiles, настраивает git

7. **Финализация**
   - Очистка кэша apt/dnf/pacman, удаление логов
   - Создание пользователя live, без пароля sudo
   - Squashfs корня, создание ISO с ISOLINUX (BIOS) и GRUB EFI
   - Проверка контрольных сумм

## Зависимости на хосте

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y \
  debootstrap squashfs-tools xorriso \
  grub-pc-bin grub-efi-amd64-bin \
  mtools dosfstools \
  qemu-utils \
  whiptail
```

Для сборки Arch-образа дополнительно:

```bash
sudo apt-get install -y arch-install-scripts
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

## Структура рабочей директории

```
workdir/
  chroot/               # монтируемая корневая ФС
  iso/
    live/               # squashfs
    boot/
      grub/
      isolinux/
    EFI/
  build.log
```

## Кастомизация

### Добавить собственные пакеты

В функции `generateBuildScript` найдите блок для выбранной базы (debian/ubuntu → apt, arch → pacman, fedora → dnf) и добавьте пакеты в массив.

Пример (Ubuntu):

```bash
apt-get install -y \
  neovim ripgrep fd-find \
  build-essential pkg-config \
  ...
```

### Изменить WM/DE

По умолчанию используется Openbox + tint2. Чтобы поставить GNOME/KDE:

- Ubuntu: `apt-get install -y ubuntu-desktop`
- Arch: `pacman -S gnome`
- Fedora: `dnf groupinstall "Workstation"`

Замените запуск Openbox в `/etc/xdg/openbox/autostart` или переключите DM на gdm.

### Свои dotfiles

Добавьте в скрипт клонирование репозитория в `/etc/skel`:

```bash
git clone https://github.com/<user>/dotfiles /etc/skel/.dotfiles
```

Плюс выполните симлинки в post-install.

### Отключить автологин

В конфиге LightDM (`/etc/lightdm/lightdm.conf`) закомментируйте `autologin-user=`.

## Сборка каждой базы

### Ubuntu 24.04

- Использует debootstrap noble
- Репозитории main/universe/multiverse
- PPA для свежих версий (neovim, git)
- Flatpak из официального PPA

### Debian 13

- debootstrap trixie
- Включены contrib и non-free-firmware
- Backports для новых пакетов

### Arch

- pacstrap base linux linux-firmware
- AUR helper (yay) для пакетов типа cursor-bin
- rolling release

### Fedora 43

- dnf --installroot
- RPM Fusion для multimedia
- Flatpak из репозиториев Fedora

## Отладка

- Логи сборки в chroot: `/root/build.log`
- Проверить squashfs: `unsquashfs -l workdir/iso/live/filesystem.squashfs`
- Тест в QEMU:
  ```bash
  qemu-system-x86_64 -m 4096 -cdrom vibe-linux-*.iso -enable-kvm
  ```
- Монтирование ISO для проверки:
  ```bash
  sudo mount -o loop vibe-linux-*.iso /mnt
  ls /mnt
  ```

## Частые проблемы

**debootstrap: command not found**  
→ установите `debootstrap`

**xorriso: cannot find grub-mkrescue**
→ установите `grub-pc-bin grub-efi-amd64-bin`

**Файл filesystem.squashfs > 4 GiB**
→ используется UDF для поддержки файлов больше 4 GiB (параметр `-udf` в xorriso)

**Недостаточно места**
→ требуется ~30 GB свободных

**Ошибка сети в chroot**  
→ скопируйте `/etc/resolv.conf` в `workdir/chroot/etc/`

**LightDM не запускается**  
→ проверьте драйверы в VM, добавьте `nomodeset` в параметры ядра

## Производительность

- SSD настоятельно рекомендуется
- Кэширование пакетов ускоряет повторные сборки
- Для тестов используйте QEMU с KVM
