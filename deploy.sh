#!/usr/bin/env bash
set -euo pipefail

# Скрипт для ручного деплоя на GitHub Pages
# Требования: git, npm, наличие remote origin

REPO_URL=$(git config --get remote.origin.url || true)
if [[ -z "$REPO_URL" ]]; then
  echo "Ошибка: нет remote origin. Добавьте его:"
  echo "  git remote add origin https://github.com/<user>/<repo>.git"
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Текущая ветка: $BRANCH"

# Определяем имя репозитория из URL
REPO_NAME=$(basename -s .git "$REPO_URL")
echo "Репозиторий: $REPO_NAME"

# Устанавливаем зависимости
if [[ ! -d node_modules ]]; then
  echo "Установка зависимостей..."
  npm install
fi

# Собираем с правильным base
echo "Сборка с base=/$REPO_NAME/ ..."
npx vite build --base="/$REPO_NAME/"

# Публикуем через gh-pages
echo "Публикация в ветку gh-pages..."
npx gh-pages -d dist -m "Deploy $(date -u +"%Y-%m-%d %H:%M:%S UTC")"

echo "Готово! Сайт будет доступен по адресу:"
# Попытка определить GitHub Pages URL
if [[ "$REPO_URL" =~ github.com[:/]([^/]+)/([^/.]+) ]]; then
  USER="${BASH_REMATCH[1]}"
  echo "  https://$USER.github.io/$REPO_NAME/"
else
  echo "  (определите URL в настройках репозитория → Pages)"
fi
