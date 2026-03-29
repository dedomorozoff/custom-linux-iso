# Vibe Linux ISO Builder

[🇬🇧 English version](README.en.md)

Веб-конфигуратор для генерации bash-скрипта, который собирает собственный ISO-образ Linux для вайб-кодинга (programming with AI). Скрипт устанавливает современные редакторы (Zed, Cursor, VS Code, Neovim, Helix), AI-агентов (Continue, Aider, GPT-Engineer, Cline, OpenCode), языки (Node.js LTS, Python 3.12, Rust, Go, Bun, Deno) и инструменты разработки.

Дополнительно в образ встраивается графический мастер пост-установки (TUI на whiptail/zenity), который запускается при первом старте live-сессии и позволяет доустановить выбранные компоненты.

## Возможности

- Выбор базы: Ubuntu 24.04 LTS, Debian 13, Arch Linux, Fedora 43
- Настройка пользователя, hostname, раскладки, драйверов NVIDIA
- Установка редакторов с AI-ассистентами
- CLI-агенты для автогенерации и рефакторинга кода
- Локальные LLM через Ollama
- Docker/Podman, git, gh, tmux, fzf, ripgrep
- Автологин и мастер настройки в live-режиме
- Генерация готового `build-vibe-linux.sh`

## Как пользоваться (веб-приложение)

1. Откройте приложение в браузере (локально `npm run dev` или на GitHub Pages).
2. Настройте параметры: база, пользователь, список ПО.
3. Нажмите «Скачать build.sh» или скопируйте скрипт из вкладки Script.
4. Запустите скрипт на машине с Linux (рекомендуется Ubuntu/Debian 13+) от root.

```bash
sudo bash build-vibe-linux.sh
```

Скрипт создаст временную директорию, соберёт chroot базовой системы, установит пакеты, добавит wizard, и с помощью `xorriso` соберёт ISO.

Требования к сборочной машине:
- sudo/root
- ~25–50 ГБ свободного места
- пакеты: debootstrap (для Debian/Ubuntu), arch-install-scripts (для Arch), dnf, squashfs-tools, xorriso, mtools, dosfstools, qemu-utils
- быстрый интернет

Результат: `vibe-linux-<base>-<версия>-amd64.iso` в рабочей директории.

## Мастер пост-установки

При загрузке live-системы автоматически запускается `/usr/local/bin/vibe-wizard`:

- Шаг 1: Приветствие, информация о системе
- Шаг 2: Выбор дополнительной базы (Flatpak, NVIDIA, Ollama)
- Шаг 3: Выбор редакторов
- Шаг 4: Выбор AI-агентов
- Шаг 5: Выбор языковых рантаймов
- Шаг 6: Применение (устанавливает недостающее, настраивает git, zsh, tmux)

Wizard использует `whiptail` в TTY и `zenity` в графической сессии.

## Сборка проекта

Локальная разработка:

```bash
npm install
npm run dev
```

Сборка production:

```bash
npm run build
```

## Деплой на GitHub Pages

### Вариант 1: автоматический через GitHub Actions

В репозитории уже есть файл `.github/workflows/deploy.yml`. При пуше в ветку `main`/`master` он соберёт сайт и опубликует в ветку `gh-pages`.

Шаги:

1. Создайте репозиторий на GitHub и запушьте код:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Vibe Linux Builder"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
2. В настройках репозитория → Pages → Source: выберите ветку `gh-pages` и папку `/ (root)`.
3. После первого пуша Action соберёт проект. Сайт будет доступен по адресу `https://<username>.github.io/<repo>/`.

Файл workflow автоматически определяет базовый путь (`base`) из названия репозитория.

### Вариант 2: ручной деплой с помощью gh-pages

Для ручной публикации из локальной машины:

```bash
npm install
npm run deploy
```

Скрипт соберёт проект и запушит папку `dist` в ветку `gh-pages`. Убедитесь, что в `vite.config.ts` задан правильный `base`, если деплоите в подкаталог.

Чтобы собрать с корректным base вручную:

```bash
npm run deploy:gh
```

Или добавьте в `package.json`:

```json
"homepage": "https://<username>.github.io/<repo>/"
```

и настройте `base` в `vite.config.ts`:

```ts
export default defineConfig({
  base: '/<repo>/',
  // ...
});
```

### Локальный предпросмотр production-сборки

```bash
npm run build
npm run preview
```

## Структура скрипта

Сгенерированный `build-vibe-linux.sh` делает следующее:

1. Проверяет зависимости (debootstrap/pacstrap/dnf, xorriso, mtools, squashfs-tools).
2. Создаёт рабочую директорию и монтирует базовую систему.
3. Устанавливает ядро, systemd, NetworkManager, PipeWire, Xorg/Wayland, дисплей-менеджер (lightdm) и минимальное окружение (Openbox или GNOME компоненты).
4. Настраивает пользователя, sudo, автологин.
5. Добавляет репозитории (Flathub) и устанавливает Flatpak-приложения: Zed, Cursor, VS Code.
6. Устанавливает менеджеры версий: `fnm` (Node), `pyenv` (Python), `rustup`, а также Go, Bun, Deno.
7. Устанавливает CLI-агентов: `aider-chat`, `gpt-engineer`, настраивает Continue и Cline (расширения VS Code, инструкции).
8. Устанавливает Ollama и подтягивает модель `llama3` (опционально).
9. Копирует wizard (`/usr/local/bin/vibe-wizard`) и сервис systemd для автозапуска.
10. Чистит кэш, создаёт squashfs и собирает загрузочный ISO (BIOS/UEFI) с ISOLINUX/GRUB.

## Кастомизация

Отредактируйте генератор в `src/App.tsx` (функция `generateBuildScript`) если нужно:

- Добавить пакеты в базовый образ
- Изменить список Flatpak ID
- Переключить менеджер дисплея (lightdm → gdm/sddm)
- Добавить собственные dotfiles

## Безопасность

- Скрипт требует root для монтирования chroot и создания образов.
- Проверяйте сгенерированный bash-скрипт перед запуском.
- Образ предназначен для локального использования; не включайте секреты.

## Лицензия

MIT. Используйте свободно, модифицируйте под свои задачи. PR и идеи приветствуются!

## Поддержка

Если что-то не работает:
- Проверьте логи сборки в `workdir/chroot/root/build.log`
- Убедитесь, что все зависимости установлены
- Для Arch используйте хост с `arch-install-scripts`
- Сообщите об ошибках через Issues в репозитории
