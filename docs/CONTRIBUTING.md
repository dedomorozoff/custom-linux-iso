# Руководство по контрибьюции

Спасибо за интерес к проекту! Здесь описано, как внести вклад: добавить поддержку новой базы, новый редактор или AI-агента, улучшить wizard.

## Разработка локально

```bash
git clone https://github.com/<user>/vibe-linux-builder.git
cd vibe-linux-builder
npm install
npm run dev
```

Приложение откроется на http://localhost:5173

## Структура проекта

- `src/App.tsx` — основной UI, генератор скрипта, демо wizard
- `src/utils/cn.ts` — утилита для классов Tailwind
- `src/index.css` — глобальные стили
- `docs/` — документация по сборке
- `.github/workflows/deploy.yml` — CI для GitHub Pages

## Как добавить новый редактор

1. В `src/App.tsx` найдите массив `editors` (состояние компонента).
2. Добавьте объект:

```ts
{
  id: 'sublime',
  name: 'Sublime Text',
  desc: 'Лёгкий редактор, AI через плагины',
  selected: false
}
```

3. В функции `generateBuildScript` добавьте установку. Пример для Flatpak:

```bash
flatpak install -y flathub com.sublimetext.four
```

Или через .deb/.rpm.

4. Обновите wizard: в массив `wizardSteps` добавьте пункт, если нужен выбор.

## Как добавить новый AI-агент

Аналогично редакторам, но в массиве `agents`. Для CLI-инструментов добавьте установку через pip/pipx/npm.

Пример:

```ts
{
  id: 'opencode',
  name: 'OpenCode',
  desc: 'AI-агент для генерации проектов',
  selected: true
}
```

В скрипте:

```bash
pipx install opencode-ai
```

## Поддержка новой базы

Добавьте вариант в `baseOptions`:

```ts
{ id: 'alpine', name: 'Alpine 3.20', desc: 'Минималистичный, musl', selected: false }
```

Затем в `generateBuildScript` добавьте блок установки через `apk`.

Убедитесь, что:
- устанавливается ядро и bootloader
- есть NetworkManager или аналог
- работает systemd или OpenRC (адаптируйте wizard)

## Изменение wizard

Wizard описан как массив `wizardSteps`. Каждый шаг — объект с `title`, `desc` и опционально `options`.

Чтобы добавить реальную логику, отредактируйте строки, где генерируется `/usr/local/bin/vibe-wizard` в `generateBuildScript`. Там используется `whiptail` для TUI.

Пример добавления пункта:

```bash
whiptail --title "Доп. инструменты" --checklist "Выберите:" 20 70 6 \\
  "lazygit" "TUI для git" ON \\
  "btop" "Монитор ресурсов" ON 2> /tmp/choice
```

## Стиль кода

- TypeScript строгий, без any
- Компоненты функциональные, хуки
- Tailwind для стилей, без inline-стилей
- Доступность: семантические теги, фокус-стили

## Тестирование скрипта

Перед PR протестируйте генерацию:

1. Выберите параметры в UI
2. Скачайте скрипт
3. Просмотрите его вручную
4. (Опционально) запустите в VM или Docker

Не коммитьте сгенерированные ISO.

## Отправка PR

1. Форкните репозиторий
2. Создайте ветку: `git checkout -b feature/add-helix`
3. Внесите изменения, проверьте локально
4. Убедитесь, что `npm run build` проходит без ошибок
5. Закоммитьте с понятным сообщением
6. Откройте PR с описанием

## Сообщение о багах

Откройте Issue с:

- Описанием проблемы
- Шагами воспроизведения
- Ожидаемым и фактическим результатом
- Скриншотом (если UI)
- Версией Node/npm

## Предложения

Идеи для развития:

- Поддержка ARM64
- Интеграция с Nix
- Пресеты (frontend, data-science, embedded)
- Экспорт конфигурации в JSON/YAML
- Проверка скрипта shellcheck

Спасибо за вклад!
