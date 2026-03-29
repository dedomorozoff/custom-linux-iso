import { useMemo, useState, useEffect, useRef } from "react";

type DistroBase = "ubuntu-24.04" | "debian-12" | "arch" | "fedora-41";
type EditorOption = "zed" | "cursor" | "vscode" | "neovim" | "helix";
type AIAgent = "continue" | "aider" | "gpt-engineer" | "opencode" | "cline";
type LangRuntime = "node-lts" | "python-3.12" | "go-1.22" | "rust-stable" | "bun" | "deno";
type Tool = "git" | "gh" | "docker" | "podman" | "tmux" | "jq" | "fzf" | "ripgrep";
type Theme = "dark" | "light";
type Lang = "ru" | "en";

const translations: Record<Lang, Record<string, string>> = {
  ru: {
    title: "Vibe Linux Builder",
    subtitle: "ISO для вайб-кодинга с AI",
    heroTitle: "Дистрибутив Linux для вайб-кодинга",
    heroDesc: "Генерируйте скрипт сборки ISO на базе Ubuntu/Debian/Arch/Fedora с современным стеком: Zed, Cursor, VS Code, Neovim, Docker, Ollama, Node, Python, Rust и AI-агентами (Continue, Aider, Cline и др.). В комплекте — графический мастер пост-установки для выбора ПО.",
    openWizard: "Открыть мастер установки",
    viewScript: "Посмотреть скрипт",
    feature1: "Автологин в live-сессию",
    feature2: "Wayland по умолчанию",
    feature3: "Nix/Devbox (опционально)",
    configTitle: "Конфигуратор сборки",
    configDesc: "Выберите базу и компоненты. Скрипт обновится автоматически.",
    distroLabel: "Базовый дистрибутив",
    userLabel: "Пользователь и система",
    userName: "Имя пользователя",
    hostname: "Hostname",
    nvidia: "Драйверы NVIDIA",
    nvidiaHint: "Проприетарные, для CUDA и игр",
    flatpak: "Flatpak + Flathub",
    flatpakHint: "Контейнеризованные приложения",
    ollama: "Ollama (LLM локально)",
    ollamaHint: "llama.cpp, модели on-device",
    editors: "Редакторы",
    agents: "AI-агенты и ассистенты",
    runtimes: "Среды выполнения и языки",
    scriptTitle: "Сгенерированный скрипт",
    copy: "Скопировать",
    copied: "Скопировано ✓",
    download: "Скачать .sh",
    scriptNote: "Скрипт создаёт загрузочный ISO с предустановленным стеком для разработки. Требуются права root и ~25–40 ГБ места.",
    defaultTitle: "Что входит по умолчанию",
    wizardTitle: "Мастер пост-установки",
    wizardDesc: "Графический wizard при первом запуске Live-сессии позволяет выбрать редакторы, AI-агентов, языки и ключи API. Конфиги сохраняются в persistent overlay.",
    openDemo: "Открыть демо мастера",
    catalogTitle: "Каталог AI-инструментов",
    quickStart: "Быстрый старт",
    step1: "Скачайте скрипт и запустите на совместимом хосте (Ubuntu/Debian/Arch/Fedora).",
    step2: "Скрипт скачает базовый ISO, распакует squashfs, добавит пакеты и wizard.",
    step3: "Соберите финальный ISO и запишите на USB через balenaEtcher или dd.",
    step4: "Загрузитесь в Live-режим, мастер предложит выбрать компоненты.",
    step5: "Установите систему или используйте persistent USB.",
    warning: "Внимание: сборка ISO требует ~20–30 ГБ и может занять 30–90 минут в зависимости от скорости сети и CPU.",
    footer: "Сделано для разработчиков, которые любят вайб-кодинг с AI",
    noTrack: "Не требует регистрации. Никаких трекеров. MIT License.",
  },
  en: {
    title: "Vibe Linux Builder",
    subtitle: "AI-powered coding ISO",
    heroTitle: "Linux distro for vibe coding",
    heroDesc: "Generate ISO build scripts based on Ubuntu/Debian/Arch/Fedora with modern stack: Zed, Cursor, VS Code, Neovim, Docker, Ollama, Node, Python, Rust and AI agents (Continue, Aider, Cline etc.). Includes graphical post-install wizard.",
    openWizard: "Open Setup Wizard",
    viewScript: "View Script",
    feature1: "Auto-login live session",
    feature2: "Wayland by default",
    feature3: "Nix/Devbox (optional)",
    configTitle: "Build Configurator",
    configDesc: "Select base and components. Script updates automatically.",
    distroLabel: "Base Distribution",
    userLabel: "User & System",
    userName: "Username",
    hostname: "Hostname",
    nvidia: "NVIDIA Drivers",
    nvidiaHint: "Proprietary, for CUDA and gaming",
    flatpak: "Flatpak + Flathub",
    flatpakHint: "Containerized applications",
    ollama: "Ollama (Local LLM)",
    ollamaHint: "llama.cpp, on-device models",
    editors: "Editors",
    agents: "AI Agents & Assistants",
    runtimes: "Runtimes & Languages",
    scriptTitle: "Generated Script",
    copy: "Copy",
    copied: "Copied ✓",
    download: "Download .sh",
    scriptNote: "Script creates bootable ISO with pre-installed dev stack. Requires root and ~25-40GB space.",
    defaultTitle: "What's Included",
    wizardTitle: "Post-Install Wizard",
    wizardDesc: "Graphical wizard on first Live session boot lets you select editors, AI agents, languages and API keys. Configs saved to persistent overlay.",
    openDemo: "Open Demo Wizard",
    catalogTitle: "AI Tools Catalog",
    quickStart: "Quick Start",
    step1: "Download script and run on compatible host (Ubuntu/Debian/Arch/Fedora).",
    step2: "Script downloads base ISO, unpacks squashfs, adds packages and wizard.",
    step3: "Build final ISO and write to USB via balenaEtcher or dd.",
    step4: "Boot to Live mode, wizard offers component selection.",
    step5: "Install system or use persistent USB.",
    warning: "Warning: ISO build requires ~20-30GB and takes 30-90 min depending on network and CPU speed.",
    footer: "Made for developers who love vibe coding with AI",
    noTrack: "No registration required. No trackers. MIT License.",
  },
};

const distroInfo: Record<DistroBase, { label: string; isoBase: string; pkg: string; desc: string }> = {
  "ubuntu-24.04": {
    label: "Ubuntu 24.04 LTS",
    isoBase: "https://releases.ubuntu.com/noble/",
    pkg: "apt",
    desc: "Stable LTS base, excellent driver support and snap/flatpak",
  },
  "debian-12": {
    label: "Debian 12 Bookworm",
    isoBase: "https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/",
    pkg: "apt",
    desc: "Minimalism and stability, ideal for clean image builds",
  },
  arch: {
    label: "Arch (rolling)",
    isoBase: "https://archlinux.org/releng/releases/",
    pkg: "pacman",
    desc: "Fresh packages, AUR, flexible customization for advanced users",
  },
  "fedora-41": {
    label: "Fedora 41 Workstation",
    isoBase: "https://fedoraproject.org/workstation/download/",
    pkg: "dnf",
    desc: "Modern stack, Wayland by default, fresh kernels",
  },
};

const editorCatalog: Record<EditorOption, { name: string; desc: string; gui: boolean; ai: string }> = {
  zed: { name: "Zed", desc: "GPU-accelerated editor, collaboration, LSP out of box", gui: true, ai: "Built-in chat, inline-assist" },
  cursor: { name: "Cursor", desc: "VS Code fork with native AI pair programmer", gui: true, ai: "Copilot++ and agent mode" },
  vscode: { name: "VS Code", desc: "De-facto standard, extensions for any language", gui: true, ai: "GitHub Copilot, Continue, Cody" },
  neovim: { name: "Neovim", desc: "Terminal editor, blazing fast and extensible", gui: false, ai: "Copilot.lua, Codeium, Avante" },
  helix: { name: "Helix", desc: "Modal editor in Rust, built-in LSP and treesitter", gui: false, ai: "LSP-based AI support" },
};

const agentCatalog: Record<AIAgent, { name: string; desc: string; key: string }> = {
  continue: { name: "Continue", desc: "Open-source AI assistant in IDE, RAG on your codebase", key: "CONTINUE_API_KEY" },
  aider: { name: "Aider", desc: "Terminal agent for git edits with LLM, great context", key: "OPENAI_API_KEY" },
  "gpt-engineer": { name: "GPT-Engineer", desc: "Generate and refactor projects by prompt", key: "OPENAI_API_KEY" },
  opencode: { name: "OpenCode", desc: "Local agent, supports ollama and open endpoints", key: "OPENAI_BASE_URL" },
  cline: { name: "Cline (former)", desc: "Agent mode in editor, plan-act-verify", key: "ANTHROPIC_API_KEY" },
};

const runtimeCatalog: Record<LangRuntime, { name: string; install: string }> = {
  "node-lts": { name: "Node.js LTS", install: "fnm" },
  bun: { name: "Bun", install: "install script" },
  deno: { name: "Deno", install: "install script" },
  "python-3.12": { name: "Python 3.12", install: "pyenv" },
  "go-1.22": { name: "Go 1.22", install: "tarball" },
  "rust-stable": { name: "Rust stable", install: "rustup" },
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("ru");
  const [distro, setDistro] = useState<DistroBase>("ubuntu-24.04");
  const [editors, setEditors] = useState<EditorOption[]>(["zed", "cursor", "vscode", "neovim"]);
  const [agents, setAgents] = useState<AIAgent[]>(["continue", "aider", "cline"]);
  const [runtimes, setRuntimes] = useState<LangRuntime[]>(["node-lts", "python-3.12", "rust-stable", "bun"]);
  const [tools, setTools] = useState<Tool[]>(["git", "gh", "docker", "tmux", "fzf", "ripgrep", "jq"]);
  const [userName, setUserName] = useState("vibe");
  const [hostName, setHostName] = useState("vibecode");
  const [includeNvidia, setIncludeNvidia] = useState(true);
  const [enableFlatpak, setEnableFlatpak] = useState(true);
  const [installOllama, setInstallOllama] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const t = translations[lang];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme(mq.matches ? "dark" : "light");
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleInArray = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const script = useMemo(() => buildScript({
    distro,
    editors,
    agents,
    runtimes,
    tools,
    userName,
    hostName,
    includeNvidia,
    enableFlatpak,
    installOllama,
  }), [distro, editors, agents, runtimes, tools, userName, hostName, includeNvidia, enableFlatpak, installOllama]);

  function copyScript() {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function downloadScript() {
    const blob = new Blob([script], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-vibecode-iso-${distro}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const wizardSteps = [
    { title: lang === "ru" ? "Приветствие" : "Welcome", desc: lang === "ru" ? "Настроим вашу систему для вайб-кодинга с AI" : "Set up your AI-powered coding system" },
    { title: lang === "ru" ? "База" : "Base", desc: lang === "ru" ? "Выбор дистрибутива и параметров системы" : "Choose distro and system settings" },
    { title: lang === "ru" ? "Редакторы" : "Editors", desc: lang === "ru" ? "Zed, Cursor, VS Code, Neovim, Helix" : "Zed, Cursor, VS Code, Neovim, Helix" },
    { title: lang === "ru" ? "AI-агенты" : "AI Agents", desc: lang === "ru" ? "Continue, Aider, OpenCode, Cline" : "Continue, Aider, OpenCode, Cline" },
    { title: lang === "ru" ? "Языки" : "Languages", desc: lang === "ru" ? "Node, Python, Rust, Go, Bun, Deno" : "Node, Python, Rust, Go, Bun, Deno" },
    { title: lang === "ru" ? "Финал" : "Finish", desc: lang === "ru" ? "Сгенерировать скрипт и образ" : "Generate script and ISO" },
  ];

  return (
    <div className={classNames(
      "min-h-screen w-full antialiased transition-colors",
      theme === "dark" ? "bg-[#0b0c10] text-zinc-100" : "bg-[#f7f7fb] text-zinc-900"
    )}>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className={classNames(
            "absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full blur-[120px] opacity-70",
            theme === "dark" ? "bg-indigo-600/30" : "bg-indigo-300/50"
          )} />
          <div className={classNames(
            "absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full blur-[120px] opacity-70",
            theme === "dark" ? "bg-fuchsia-600/25" : "bg-fuchsia-300/50"
          )} />
        </div>

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
              <div className="absolute inset-0 grid place-items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M4 7h16M4 12h10M4 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">{t.title}</div>
              <div className="text-xs opacity-70 -mt-1">{t.subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "ru" ? "en" : "ru")}
              className={classNames(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                theme === "dark"
                  ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                  : "bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm"
              )}
              title="Switch language"
            >
              {lang === "ru" ? "RU" : "EN"}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={classNames(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                theme === "dark"
                  ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                  : "bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm"
              )}
              title={lang === "ru" ? "Переключить тему" : "Toggle theme"}
            >
              {theme === "dark" ? "☾ Dark" : "☀ Light"}
            </button>
            <a
              href="#builder"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:translate-y-[-1px]"
            >
              {lang === "ru" ? "Собрать ISO" : "Build ISO"}
            </a>
          </div>
        </header>

        <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-6 md:grid-cols-2 md:pt-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              {lang === "ru" ? "Новинка: мастер пост-установки c AI-агентами" : "New: Post-install wizard with AI agents"}
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              {lang === "ru" ? (
                <>Дистрибутив Linux для <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">вайб-кодинга</span></>
              ) : (
                <>Linux distro for <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">vibe coding</span></>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed opacity-80">
              {t.heroDesc}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setWizardOpen(true)}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/15"
              >
                {t.openWizard}
              </button>
              <a
                href="#script"
                className="rounded-2xl border border-zinc-700 bg-zinc-900/40 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-zinc-900/60"
              >
                {t.viewScript}
              </a>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs opacity-70">
              <div className="flex items-center gap-2">
                <CheckIco /> {t.feature1}
              </div>
              <div className="flex items-center gap-2">
                <CheckIco /> {t.feature2}
              </div>
              <div className="flex items-center gap-2">
                <CheckIco /> {t.feature3}
              </div>
            </div>
          </div>
          <div className="relative">
            <div className={classNames(
              "relative overflow-hidden rounded-[28px] border shadow-2xl",
              theme === "dark" ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-white"
            )}>
              <div className="flex items-center gap-1 border-b px-4 py-3" style={{ borderColor: theme === "dark" ? "#27272a" : "#e4e4e7" }}>
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs opacity-60">wizard / post-install</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  {(lang === "ru" ? ["База", "Редакторы", "AI-агенты"] : ["Base", "Editors", "AI Agents"]).map((item, i) => (
                    <div key={item} className={classNames(
                      "rounded-2xl p-4",
                      theme === "dark" ? "bg-zinc-800/70 border border-zinc-800" : "bg-zinc-50 border border-zinc-200"
                    )}>
                      <div className="text-[11px] uppercase tracking-widest opacity-60">{lang === "ru" ? "Шаг" : "Step"} {i + 1}</div>
                      <div className="mt-1 font-semibold">{item}</div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-700/40">
                        <div className="h-full w-2/3 bg-gradient-to-r from-violet-500 to-indigo-500" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: "Zed", sub: lang === "ru" ? "gpu, collab, chat" : "gpu, collab, chat" },
                    { label: "Cursor", sub: lang === "ru" ? "agent mode, copilot++" : "agent mode, copilot++" },
                    { label: "Continue", sub: lang === "ru" ? "RAG по проекту" : "RAG on codebase" },
                    { label: "Ollama", sub: lang === "ru" ? "локальные модели" : "local models" },
                  ].map((c) => (
                    <div key={c.label} className={classNames(
                      "rounded-2xl p-4",
                      theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"
                    )}>
                      <div className="text-sm font-semibold">{c.label}</div>
                      <div className="text-xs opacity-70">{c.sub}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">{lang === "ru" ? "выбрано" : "selected"}</span>
                        <span className="text-[11px] opacity-60">{lang === "ru" ? "рекомендовано" : "recommended"}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="text-xs opacity-70">{lang === "ru" ? "Предпросмотр конфигурации" : "Configuration preview"}</div>
                  <button
                    onClick={() => setWizardOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30"
                  >
                    {lang === "ru" ? "Настроить" : "Configure"}
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -top-6 hidden rotate-12 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300 backdrop-blur md:block">
              + live USB
            </div>
          </div>
        </section>
      </div>

      <main id="builder" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className={classNames(
              "rounded-[28px] border p-6 shadow-xl",
              theme === "dark" ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-white"
            )}>
              <h2 className="text-xl font-semibold">{t.configTitle}</h2>
              <p className="mt-1 text-sm opacity-70">{t.configDesc}</p>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label={t.distroLabel}>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(distroInfo).map(([k, v]) => {
                      const key = k as DistroBase;
                      const active = distro === key;
                      return (
                        <button
                          key={k}
                          onClick={() => setDistro(key)}
                          className={classNames(
                            "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                            active
                              ? theme === "dark"
                                ? "border-indigo-500/50 bg-indigo-500/10"
                                : "border-indigo-500/50 bg-indigo-50"
                              : theme === "dark"
                              ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-900/80"
                              : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                          )}
                        >
                          <div className={classNames(
                            "mt-0.5 h-5 w-5 rounded-full border-2 grid place-items-center",
                            active ? "border-indigo-400" : "border-zinc-500"
                          )}>
                            {active && <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />}
                          </div>
                          <div>
                            <div className="font-semibold">{v.label}</div>
                            <div className="text-xs opacity-70">{v.desc}</div>
                            <div className="mt-1 text-[11px] opacity-60">{lang === "ru" ? "Пакетный менеджер:" : "Package manager:"} {v.pkg}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label={t.userLabel}>
                  <div className="space-y-3">
                    <TextInput label={t.userName} value={userName} onChange={setUserName} placeholder="vibe" theme={theme} />
                    <TextInput label={t.hostname} value={hostName} onChange={setHostName} placeholder="vibecode" theme={theme} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Toggle checked={includeNvidia} onChange={setIncludeNvidia} label={t.nvidia} hint={t.nvidiaHint} theme={theme} />
                      <Toggle checked={enableFlatpak} onChange={setEnableFlatpak} label={t.flatpak} hint={t.flatpakHint} theme={theme} />
                      <Toggle checked={installOllama} onChange={setInstallOllama} label={t.ollama} hint={t.ollamaHint} theme={theme} />
                    </div>
                  </div>
                </Field>

                <Field label={t.editors}>
                  <Chips options={Object.entries(editorCatalog).map(([k, v]) => ({ id: k as EditorOption, title: v.name, sub: v.desc }))}
                         selected={editors} onToggle={(id) => setEditors((s) => toggleInArray(s, id))} theme={theme}/>
                </Field>

                <Field label={t.agents}>
                  <Chips options={Object.entries(agentCatalog).map(([k, v]) => ({ id: k as AIAgent, title: v.name, sub: v.desc }))}
                         selected={agents} onToggle={(id) => setAgents((s) => toggleInArray(s, id))} theme={theme} />
                </Field>

                <Field label={t.runtimes} full>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Chips options={Object.entries(runtimeCatalog).map(([k, v]) => ({ id: k as LangRuntime, title: v.name, sub: `${lang === "ru" ? "Установка через" : "Install via"} ${v.install}` }))}
                           selected={runtimes} onToggle={(id) => setRuntimes((s) => toggleInArray(s, id))} theme={theme}/>
                    <Chips options={[
                      { id: "git" as Tool, title: "Git", sub: lang === "ru" ? "контроль версий" : "version control" },
                      { id: "gh" as Tool, title: "GitHub CLI", sub: lang === "ru" ? "PR/Issue из терминала" : "PR/Issue from terminal" },
                      { id: "docker" as Tool, title: "Docker", sub: lang === "ru" ? "контейнеры" : "containers" },
                      { id: "podman" as Tool, title: "Podman", sub: lang === "ru" ? "rootless контейнеры" : "rootless containers" },
                      { id: "tmux" as Tool, title: "tmux", sub: lang === "ru" ? "сессии терминала" : "terminal sessions" },
                      { id: "fzf" as Tool, title: "fzf", sub: lang === "ru" ? "поиск" : "search" },
                      { id: "ripgrep" as Tool, title: "ripgrep", sub: lang === "ru" ? "grep на стероидах" : "grep on steroids" },
                      { id: "jq" as Tool, title: "jq", sub: lang === "ru" ? "JSON в терминале" : "JSON in terminal" },
                    ]} selected={tools} onToggle={(id) => setTools((s) => toggleInArray(s, id))} theme={theme}/>
                  </div>
                </Field>
              </div>

              <div id="script" className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t.scriptTitle}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyScript}
                      className={classNames(
                        "rounded-xl px-3 py-2 text-sm font-medium transition",
                        theme === "dark"
                          ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                          : "bg-zinc-100 hover:bg-zinc-200 border border-zinc-200"
                      )}
                    >
                      {copied ? t.copied : t.copy}
                    </button>
                    <button
                      onClick={downloadScript}
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30"
                    >
                      {t.download}
                    </button>
                  </div>
                </div>
                <div className={classNames(
                  "mt-3 overflow-hidden rounded-2xl border",
                  theme === "dark" ? "border-zinc-800 bg-[#0a0b0f]" : "border-zinc-200 bg-[#0a0b0f]"
                )}>
                  <div className="flex items-center justify-between border-b border-zinc-800 bg-[#0b0c10] px-4 py-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                      <span className="ml-2 font-mono">build-vibecode-iso.sh</span>
                    </div>
                    <div className="hidden md:block opacity-70">bash • {lang === "ru" ? "автогенерация" : "auto-generated"}</div>
                  </div>
                  <pre ref={codeRef} className="max-h-[520px] overflow-auto p-4 text-[12.5px] leading-6 text-zinc-200">
                    <code>{script}</code>
                  </pre>
                </div>
                <p className="mt-2 text-xs opacity-60">
                  {t.scriptNote}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className={classNames(
              "rounded-[28px] border p-6",
              theme === "dark" ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-white"
            )}>
              <h3 className="text-lg font-semibold">{t.defaultTitle}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckIco /> Wayland, PipeWire, {lang === "ru" ? "шрифты и темы" : "fonts and themes"}</li>
                <li className="flex items-start gap-2"><CheckIco /> Fastfetch, starship prompt, zsh + oh-my-zsh</li>
                <li className="flex items-start gap-2"><CheckIco /> Flatpak (Flathub) — Zed, Cursor, VS Code</li>
                <li className="flex items-start gap-2"><CheckIco /> {lang === "ru" ? "Локальный LLM рантайм (Ollama) + модель по умолчанию" : "Local LLM runtime (Ollama) + default model"}</li>
                <li className="flex items-start gap-2"><CheckIco /> {lang === "ru" ? "Докер/Podman, dev-контейнеры" : "Docker/Podman, dev containers"}</li>
                <li className="flex items-start gap-2"><CheckIco /> {lang === "ru" ? "Менеджеры версий: fnm, pyenv, rustup" : "Version managers: fnm, pyenv, rustup"}</li>
              </ul>
              <div className="mt-5 rounded-2xl bg-gradient-to-r from-violet-600/15 to-indigo-600/15 p-4 text-sm">
                <div className="font-semibold">{t.wizardTitle}</div>
                <p className="mt-1 opacity-80">{t.wizardDesc}</p>
                <button
                  onClick={() => setWizardOpen(true)}
                  className="mt-3 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  {t.openDemo}
                </button>
              </div>
            </div>

            <div className={classNames(
              "rounded-[28px] border p-6",
              theme === "dark" ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-white"
            )}>
              <h3 className="text-lg font-semibold">{t.catalogTitle}</h3>
              <div className="mt-3 grid grid-cols-1 gap-3">
                {Object.entries(editorCatalog).map(([k, v]) => (
                  <div key={k} className={classNames(
                    "rounded-2xl border p-4",
                    theme === "dark" ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{v.name}</div>
                      <span className={classNames(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        v.gui ? "bg-indigo-500/15 text-indigo-300" : "bg-zinc-500/15 text-zinc-300"
                      )}>{v.gui ? "GUI" : "TUI"}</span>
                    </div>
                    <div className="mt-1 text-xs opacity-70">{v.desc}</div>
                    <div className="mt-2 text-[11px] opacity-60">AI: {v.ai}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={classNames(
              "rounded-[28px] border p-6",
              theme === "dark" ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-white"
            )}>
              <h3 className="text-lg font-semibold">{t.quickStart}</h3>
              <ol className="mt-3 list-decimal pl-5 text-sm space-y-2 opacity-90">
                <li>{t.step1}</li>
                <li>{t.step2}</li>
                <li>{t.step3}</li>
                <li>{t.step4}</li>
                <li>{t.step5}</li>
              </ol>
              <div className="mt-4 text-xs opacity-60">
                {t.warning}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {wizardOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className={classNames(
            "relative w-full max-w-4xl overflow-hidden rounded-[32px] border shadow-2xl",
            theme === "dark" ? "border-zinc-800 bg-[#0b0c10]" : "border-zinc-200 bg-white"
          )}>
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: theme === "dark" ? "#27272a" : "#e4e4e7" }}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 grid place-items-center text-white shadow-lg shadow-indigo-500/30">
                  <WizIco />
                </div>
                <div>
                  <div className="font-semibold">{t.wizardTitle}</div>
                  <div className="text-xs opacity-60">{lang === "ru" ? "Графический wizard для Live-сессии" : "Graphical wizard for Live session"}</div>
                </div>
              </div>
              <button onClick={() => setWizardOpen(false)} className={classNames(
                "rounded-xl px-3 py-2 text-sm",
                theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" : "bg-zinc-100 hover:bg-zinc-200 border border-zinc-200"
              )}>{lang === "ru" ? "Закрыть" : "Close"}</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
              <div className={classNames(
                "border-r p-4",
                theme === "dark" ? "border-zinc-800 bg-[#0a0b0f]" : "border-zinc-200 bg-zinc-50"
              )}>
                <ol className="space-y-2">
                  {wizardSteps.map((s, i) => (
                    <li key={s.title}>
                      <button
                        onClick={() => setWizardStep(i)}
                        className={classNames(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                          wizardStep === i
                            ? theme === "dark" ? "bg-indigo-500/15 border border-indigo-500/30" : "bg-indigo-50 border border-indigo-200"
                            : theme === "dark" ? "hover:bg-zinc-900 border border-transparent" : "hover:bg-white border border-transparent"
                        )}>
                        <div className={classNames(
                          "grid h-8 w-8 place-items-center rounded-xl text-sm font-semibold",
                          wizardStep === i ? "bg-indigo-600 text-white" : theme === "dark" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-800"
                        )}>{i + 1}</div>
                        <div>
                          <div className="text-sm font-semibold">{s.title}</div>
                          <div className="text-[11px] opacity-60">{s.desc}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-6">
                {wizardStep === 0 && (
                  <StepCard title="Добро пожаловать!" desc="Этот мастер поможет установить стек для вайб-кодинга. Вы сможете выбрать редакторы, AI-агентов и среды выполнения.">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InfoTile title="Live-сессия" text="Автологин пользователя, Wayland, предустановленные шрифты и темы." />
                      <InfoTile title="Persistent overlay" text="Ваши изменения сохраняются между перезагрузками USB." />
                      <InfoTile title="Ключи API" text="Можно сохранить локально в ~/.config/vibe/agents.env (не в образ)." />
                      <InfoTile title="Локальные модели" text="Ollama скачает совместимую модель (~4–7 ГБ) при первом запуске." />
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button onClick={() => setWizardStep(1)} className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30">Далее</button>
                    </div>
                  </StepCard>
                )}

                {wizardStep === 1 && (
                  <StepCard title="База и система" desc="Выберите основу и параметры.">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Дистрибутив">
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(distroInfo).map(([k, v]) => {
                            const key = k as DistroBase;
                            const active = distro === key;
                            return (
                              <button key={k} onClick={() => setDistro(key)}
                                className={classNames("rounded-2xl border p-3 text-left",
                                  active ? "border-indigo-500/50 bg-indigo-500/10" : theme === "dark" ? "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900" : "border-zinc-200 bg-white hover:bg-zinc-50"
                                )}>
                                <div className="font-semibold">{v.label}</div>
                                <div className="text-xs opacity-70">{v.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </Field>
                      <Field label="Параметры">
                        <div className="space-y-3">
                          <TextInput label="Пользователь" value={userName} onChange={setUserName} theme={theme} />
                          <TextInput label="Hostname" value={hostName} onChange={setHostName} theme={theme} />
                          <Toggle checked={includeNvidia} onChange={setIncludeNvidia} label="NVIDIA драйверы" theme={theme} />
                          <Toggle checked={enableFlatpak} onChange={setEnableFlatpak} label="Flatpak + Flathub" theme={theme} />
                          <Toggle checked={installOllama} onChange={setInstallOllama} label="Ollama" theme={theme} />
                        </div>
                      </Field>
                    </div>
                    <NavButtons onBack={() => setWizardStep(0)} onNext={() => setWizardStep(2)} lang={lang} />
                  </StepCard>
                )}

                {wizardStep === 2 && (
                  <StepCard title="Редакторы" desc="Выберите редакторы для установки. Flatpak для GUI, tarball для терминальных.">
                    <Chips options={Object.entries(editorCatalog).map(([k, v]) => ({ id: k as EditorOption, title: v.name, sub: v.desc }))}
                           selected={editors} onToggle={(id) => setEditors((s) => toggleInArray(s, id))} theme={theme}/>
                    <NavButtons onBack={() => setWizardStep(1)} onNext={() => setWizardStep(3)} />
                  </StepCard>
                )}

                {wizardStep === 3 && (
                  <StepCard title="AI-агенты" desc="Подключите ассистентов. Ключи можно задать позже.">
                    <Chips options={Object.entries(agentCatalog).map(([k, v]) => ({ id: k as AIAgent, title: v.name, sub: v.desc }))}
                           selected={agents} onToggle={(id) => setAgents((s) => toggleInArray(s, id))} theme={theme}/>
                    <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                      <div className="font-semibold">Ключи API</div>
                      <p className="opacity-80">Для работы агентов задайте переменные: {agents.map(a => agentCatalog[a].key).join(", ")} в ~/.config/vibe/agents.env</p>
                    </div>
                    <NavButtons onBack={() => setWizardStep(2)} onNext={() => setWizardStep(4)} />
                  </StepCard>
                )}

                {wizardStep === 4 && (
                  <StepCard title="Языки и инструменты" desc="Выберите рантаймы и утилиты.">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Chips options={Object.entries(runtimeCatalog).map(([k, v]) => ({ id: k as LangRuntime, title: v.name, sub: `Установка через ${v.install}` }))}
                             selected={runtimes} onToggle={(id) => setRuntimes((s) => toggleInArray(s, id))} theme={theme}/>
                      <Chips options={[
                        { id: "git" as Tool, title: "Git", sub: "контроль версий" },
                        { id: "gh" as Tool, title: "GitHub CLI", sub: "PR/Issue" },
                        { id: "docker" as Tool, title: "Docker", sub: "контейнеры" },
                        { id: "podman" as Tool, title: "Podman", sub: "rootless" },
                        { id: "tmux" as Tool, title: "tmux", sub: "сессии" },
                        { id: "fzf" as Tool, title: "fzf", sub: "поиск" },
                        { id: "ripgrep" as Tool, title: "ripgrep", sub: "grep" },
                        { id: "jq" as Tool, title: "jq", sub: "JSON" },
                      ]} selected={tools} onToggle={(id) => setTools((s) => toggleInArray(s, id))} theme={theme}/>
                    </div>
                    <NavButtons onBack={() => setWizardStep(3)} onNext={() => setWizardStep(5)} />
                  </StepCard>
                )}

                {wizardStep === 5 && (
                  <StepCard title="Готово!" desc="Сгенерируйте скрипт и соберите ISO. Ниже — краткая сводка.">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SummaryCard title="Система" items={[
                        `Дистрибутив: ${distroInfo[distro].label}`,
                        `Пользователь: ${userName}`,
                        `Hostname: ${hostName}`,
                        `NVIDIA: ${includeNvidia ? "да" : "нет"}`,
                        `Flatpak: ${enableFlatpak ? "да" : "нет"}`,
                        `Ollama: ${installOllama ? "да" : "нет"}`,
                      ]} />
                      <SummaryCard title="Редакторы" items={editors.map(e => editorCatalog[e].name)} />
                      <SummaryCard title="AI-агенты" items={agents.map(a => agentCatalog[a].name)} />
                      <SummaryCard title="Языки/инструменты" items={[...runtimes.map(r => runtimeCatalog[r].name), ...tools]} />
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <button onClick={() => setWizardStep(0)} className={classNames(
                        "rounded-2xl px-4 py-3 text-sm font-medium",
                        theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" : "bg-zinc-100 hover:bg-zinc-200 border border-zinc-200"
                      )}>В начало</button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {navigator.clipboard.writeText(script)}} className={classNames(
                          "rounded-2xl px-4 py-3 text-sm font-medium",
                          theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" : "bg-zinc-100 hover:bg-zinc-200 border border-zinc-200"
                        )}>Скопировать скрипт</button>
                        <button onClick={downloadScript} className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30">
                          Скачать скрипт
                        </button>
                      </div>
                    </div>
                  </StepCard>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mx-auto max-w-6xl px-6 pb-16 pt-6 text-center text-xs opacity-60">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-3">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="underline hover:opacity-80">GitHub</a>
          <span>•</span>
          <a href="#builder" className="underline hover:opacity-80">{lang === "ru" ? "Документация" : "Documentation"}</a>
          <span>•</span>
          <span>{t.footer}</span>
        </div>
        <div>{t.noTrack}</div>
      </footer>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="mb-3 text-sm font-semibold tracking-wide opacity-80">{label}</div>
      {children}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, theme }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; theme: Theme }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs opacity-70">{label}</div>
      <input
        className={classNames(
          "w-full rounded-2xl px-4 py-3 text-sm outline-none ring-1 transition",
          theme === "dark"
            ? "bg-zinc-950/60 ring-zinc-800 focus:ring-indigo-500/50"
            : "bg-white ring-zinc-200 focus:ring-indigo-500/50"
        )}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Toggle({ checked, onChange, label, hint, theme }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; theme: Theme }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={classNames(
        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
        theme === "dark" ? "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
      )}
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {hint && <div className="text-[11px] opacity-60">{hint}</div>}
      </div>
      <div className={classNames(
        "relative h-6 w-11 rounded-full transition",
        checked ? "bg-indigo-600" : theme === "dark" ? "bg-zinc-700" : "bg-zinc-300"
      )}>
        <div className={classNames(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
          checked ? "right-0.5" : "left-0.5"
        )} />
      </div>
    </button>
  );
}

function Chips<T extends string>({ options, selected, onToggle, theme }: { options: { id: T; title: string; sub?: string }[]; selected: T[]; onToggle: (id: T) => void; theme: Theme }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map((o) => {
        const active = selected.includes(o.id);
        return (
          <button
            key={o.id}
            onClick={() => onToggle(o.id)}
            className={classNames(
              "flex w-full items-start justify-between rounded-2xl border p-4 text-left transition",
              active
                ? theme === "dark"
                  ? "border-indigo-500/50 bg-indigo-500/10"
                  : "border-indigo-400/60 bg-indigo-50"
                : theme === "dark"
                ? "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900"
                : "border-zinc-200 bg-white hover:bg-zinc-50"
            )}
          >
            <div>
              <div className="font-semibold">{o.title}</div>
              {o.sub && <div className="mt-0.5 text-xs opacity-70">{o.sub}</div>}
            </div>
            <div className={classNames(
              "mt-1 rounded-full px-2 py-1 text-[10px] font-bold",
              active ? "bg-indigo-600 text-white" : theme === "dark" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
            )}>
              {active ? "выбрано" : "добавить"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CheckIco() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WizIco() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
      <path d="M12 2l2.09 6.26H20l-5 3.64 1.91 5.88L12 14.1l-4.91 3.68L9 11.9l-5-3.64h5.91L12 2z" fill="currentColor" />
    </svg>
  );
}

function StepCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight">{title}</div>
      <div className="mt-1 text-sm opacity-70">{desc}</div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function NavButtons({ onBack, onNext, lang }: { onBack: () => void; onNext: () => void; lang: Lang }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button onClick={onBack} className="rounded-2xl border border-zinc-700 bg-zinc-900/40 px-5 py-3 text-sm font-medium hover:bg-zinc-900/60">{lang === "ru" ? "Назад" : "Back"}</button>
      <button onClick={onNext} className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30">{lang === "ru" ? "Далее" : "Next"}</button>
    </div>
  );
}

function InfoTile({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs opacity-70">{text}</div>
    </div>
  );
}

function SummaryCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-2 list-disc pl-5 text-xs opacity-80">
        {items.length ? items.map((i) => <li key={i}>{i}</li>) : <li className="opacity-60">ничего не выбрано</li>}
      </ul>
    </div>
  );
}

function buildScript(cfg: {
  distro: DistroBase;
  editors: EditorOption[];
  agents: AIAgent[];
  runtimes: LangRuntime[];
  tools: Tool[];
  userName: string;
  hostName: string;
  includeNvidia: boolean;
  enableFlatpak: boolean;
  installOllama: boolean;
}) {
  const { distro, editors, agents, runtimes, tools, userName, hostName, includeNvidia, enableFlatpak, installOllama } = cfg;

  const flatpaks: string[] = [];
  if (enableFlatpak) {
    if (editors.includes("zed")) flatpaks.push("dev.zed.Zed");
    // VS Code installed via .deb repository instead of Flatpak for faster install
  }

  const header = `#!/usr/bin/env bash
# Vibe Linux ISO builder
# Distro: ${distroInfo[distro].label}
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
set -euo pipefail

need_root() { if [[ $EUID -ne 0 ]]; then echo "Run as root"; exit 1; fi; }
need_root

WORKDIR="\${WORKDIR:-/srv/vibe-iso}"
OUTDIR="\${OUTDIR:-$PWD/out}"
USERNAME=${JSON.stringify(userName)}
HOSTNAME=${JSON.stringify(hostName)}
DISTRO=${JSON.stringify(distro)}

log() { printf "\\033[1;34m[vibe]\\033[0m %s\\n" "$*"; }
warn() { printf "\\033[1;33m[!]\\033[0m %s\\n" "$*"; }
err() { printf "\\033[1;31m[err]\\033[0m %s\\n" "$*" >&2; }

mkdir -p "$WORKDIR" "$OUTDIR"
cd "$WORKDIR"

# 1) Host deps
log "Installing build dependencies..."

# Check /dev/null first
if [[ ! -c /dev/null ]]; then
  err "/dev/null is not a character device!"
  err "Fix with: sudo mknod -m 666 /dev/null c 1 3"
  exit 1
fi

case "$DISTRO" in
  ubuntu-24.04|debian-12)
    apt update || {
      warn "apt update failed, trying to continue..."
    }
    DEBIAN_FRONTEND=noninteractive apt install -y --fix-broken \
      debootstrap squashfs-tools xorriso grub-pc-bin grub-efi-amd64-bin mtools \
      dosfstools unzip curl wget git rsync python3 python3-pip
    ;;
  arch)
    pacman -Sy --noconfirm archiso squashfs-tools xorriso grub dosfstools mtools wget curl git rsync python
    ;;
  fedora-41)
    dnf -y install livecd-tools spin-kickstarts squashfs-tools xorriso grub2-efi-x64 grub2-pc dosfstools mtools wget curl git rsync python3
    ;;
  *) err "Unsupported distro"; exit 1;;
esac

# 2) Bootstrap rootfs
log "Preparing base system..."
ROOTFS="$WORKDIR/rootfs"

# Cleanup previous run - unmount first if needed
if mountpoint -q "$ROOTFS/sys" 2>/dev/null; then
  umount -l "$ROOTFS/sys" "$ROOTFS/proc" "$ROOTFS/dev" 2>/dev/null || true
fi

# Skip bootstrap if rootfs already exists (cached)
if [[ -d "$ROOTFS/usr/bin" ]]; then
  log "Using cached rootfs (skip bootstrap)..."
else
  rm -rf "$ROOTFS"
  mkdir -p "$ROOTFS"

bootstrap_debian() {
  if [[ "$DISTRO" == "ubuntu-24.04" ]]; then
    debootstrap --arch=amd64 noble "$ROOTFS" http://archive.ubuntu.com/ubuntu/ || true
  else
    debootstrap --arch=amd64 bookworm "$ROOTFS" http://deb.debian.org/debian/ || true
  fi

  # Mount filesystems for chroot
  mount --bind /dev "$ROOTFS/dev"
  mount -t devpts devpts "$ROOTFS/dev/pts"
  mount -t tmpfs tmpfs "$ROOTFS/dev/shm"
  mount -t proc /proc "$ROOTFS/proc"
  mount -t sysfs /sys "$ROOTFS/sys"
  # Mount /dev/random and /dev/urandom for entropy
  mount --bind /dev/random "$ROOTFS/dev/random"
  mount --bind /dev/urandom "$ROOTFS/dev/urandom"
  cp /etc/resolv.conf "$ROOTFS/etc/resolv.conf" || true

  # Update and install packages using apt
  chroot "$ROOTFS" apt update
  chroot "$ROOTFS" apt install -y --fix-broken linux-image-generic zsh curl wget git sudo locales

  # Unmount
  umount -l "$ROOTFS/dev/random" "$ROOTFS/dev/urandom" "$ROOTFS/dev/pts" "$ROOTFS/dev/shm" "$ROOTFS/dev" "$ROOTFS/proc" "$ROOTFS/sys" 2>/dev/null || true
}
bootstrap_arch() {
  mkdir -p "$ROOTFS"
  pacstrap -c "$ROOTFS" base linux linux-firmware zsh sudo curl wget git
}
bootstrap_fedora() {
  dnf --releasever=41 --setopt=install_weak_deps=False --installroot="$ROOTFS" -y install @core kernel zsh sudo curl wget git
}
case "$DISTRO" in
  ubuntu-24.04|debian-12) bootstrap_debian ;;
  arch) bootstrap_arch ;;
  fedora-41) bootstrap_fedora ;;
esac
fi

# 3) Chroot customization
log "Customizing system in chroot..."
cat > "$ROOTFS/tmp/customize.sh" << 'EOS'
set -e
export DEBIAN_FRONTEND=noninteractive
USERNAME="__USER__"
HOSTNAME="__HOST__"

id "$USERNAME" &>/dev/null || useradd -m -s /usr/bin/zsh "$USERNAME"
echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/90_vibe

echo "$HOSTNAME" > /etc/hostname
echo "127.0.0.1 localhost $HOSTNAME" > /etc/hosts

locale-gen en_US.UTF-8 || true
update-locale LANG=en_US.UTF-8 || true

if command -v apt >/dev/null 2>&1; then
  # Enable universe/multiverse repositories for Ubuntu
  sed -i 's/main$/main universe multiverse restricted/' /etc/apt/sources.list || true
  apt update
  apt install -y \
    pipewire wireplumber pipewire-audio \
    network-manager \
    flatpak xdg-desktop-portal xdg-desktop-portal-gtk \
    fonts-firacode fonts-noto-core fonts-noto-color-emoji \
    udev systemd-timesyncd zsh git curl wget unzip jq fzf ripgrep tmux build-essential pkg-config \
    python3 python3-venv python3-pip \
    docker.io
  
  # Install VS Code via official Microsoft repository
  curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/microsoft.gpg
  echo "deb [arch=amd64] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list
  apt update
  apt install -y code
  
  systemctl enable NetworkManager || true
  systemctl enable docker || true
elif command -v pacman >/dev/null 2>&1; then
  pacman -Sy --noconfirm pipewire wireplumber networkmanager iwd flatpak xdg-desktop-portal \
    ttf-fira-code noto-fonts noto-fonts-emoji base-devel git curl wget unzip jq fzf ripgrep tmux python python-pip docker
  systemctl enable NetworkManager
  systemctl enable docker
elif command -v dnf >/dev/null 2>&1; then
  dnf -y install pipewire wireplumber NetworkManager iwd flatpak xdg-desktop-portal \
    fira-code-fonts google-noto* git curl wget unzip jq fzf ripgrep tmux python3 python3-pip docker
  systemctl enable NetworkManager
  systemctl enable docker
fi

if command -v flatpak >/dev/null 2>&1; then
  flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
  FLATPAKS=(__FLATPAKS__)
  if [ ${"$"}{#FLATPAKS[@]} -gt 0 ]; then
    flatpak install -y flathub "${"$"}{FLATPAKS[@]}" || true
  fi
fi

chsh -s /usr/bin/zsh "$USERNAME" || true
rm -rf /home/$USERNAME/.oh-my-zsh || true
runuser -u "$USERNAME" -- bash -lc 'curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh | bash -s -- --unattended || true'
runuser -u "$USERNAME" -- bash -lc 'curl -sS https://starship.rs/install.sh | sh -s -- -y || true'
runuser -u "$USERNAME" -- bash -lc 'mkdir -p ~/.config && echo "eval $(starship init zsh)" >> ~/.zshrc'

if [[ "__HAS_NODE__" == "1" ]]; then
  runuser -u "$USERNAME" -- bash -lc 'curl -fsSL https://fnm.vercel.app/install | bash'
  runuser -u "$USERNAME" -- bash -lc 'export PATH="$HOME/.local/share/fnm:$PATH"; eval "$(fnm env)"; fnm install --lts; fnm default lts-latest'
fi
if [[ "__HAS_BUN__" == "1" ]]; then
  runuser -u "$USERNAME" -- bash -c 'if [ ! -f "$HOME/.bun/bin/bun" ]; then curl -fsSL https://bun.sh/install | bash; fi'
  echo 'export PATH="$HOME/.bun/bin:$PATH"' >> /home/$USERNAME/.zshrc
fi
if [[ "__HAS_DENO__" == "1" ]]; then
  runuser -u "$USERNAME" -- bash -c 'if [ ! -d "$HOME/.deno" ]; then curl -fsSL https://deno.land/install.sh | sh; fi'
  echo 'export PATH="$HOME/.deno/bin:$PATH"' >> /home/$USERNAME/.zshrc
fi
if [[ "__HAS_PY__" == "1" ]]; then
  runuser -u "$USERNAME" -- bash -lc 'curl https://pyenv.run | bash'
  runuser -u "$USERNAME" -- bash -lc 'export PATH="$HOME/.pyenv/bin:$PATH"; eval "$(pyenv init -)"; pyenv install 3.12.4; pyenv global 3.12.4'
fi
if [[ "__HAS_RUST__" == "1" ]]; then
  runuser -u "$USERNAME" -- bash -lc 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'
fi
if [[ "__HAS_GO__" == "1" ]]; then
  curl -fsSL https://go.dev/dl/go1.22.5.linux-amd64.tar.gz -o /tmp/go.tgz
  tar -C /usr/local -xzf /tmp/go.tgz
  echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> /home/$USERNAME/.zshrc
fi

if [[ "__HAS_NEOVIM__" == "1" ]]; then
  if command -v apt >/dev/null 2>&1; then apt install -y neovim; fi
  if command -v pacman >/dev/null 2>&1; then pacman -Sy --noconfirm neovim; fi
  if command -v dnf >/dev/null 2>&1; then dnf -y install neovim; fi
fi
if [[ "__HAS_HELIX__" == "1" ]]; then
  if command -v cargo >/dev/null 2>&1; then runuser -u "$USERNAME" -- bash -lc 'cargo install --locked helix'; fi
fi

if [[ "__HAS_AIDER__" == "1" ]]; then
  pip3 install --break-system-packages aider-chat || pip3 install aider-chat
fi
if [[ "__HAS_GPT_ENG__" == "1" ]]; then
  pip3 install --break-system-packages gpt-engineer || pip3 install gpt-engineer
fi
if [[ "__HAS_OLLAMA__" == "1" ]]; then
  curl -fsSL https://ollama.com/install.sh | sh
  systemctl enable ollama || true
fi

if [[ "__NVIDIA__" == "1" ]]; then
  if command -v apt >/dev/null 2>&1; then
    apt install -y ubuntu-drivers-common
    ubuntu-drivers autoinstall || true
  elif command -v pacman >/dev/null 2>&1; then
    pacman -Sy --noconfirm nvidia nvidia-utils
  elif command -v dnf >/dev/null 2>&1; then
    dnf -y install akmod-nvidia
  fi
fi

mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf << CONF
[Service]
ExecStart=
ExecStart=-/usr/bin/agetty --autologin $USERNAME --noclear %I $TERM
CONF

mkdir -p /usr/local/bin
cat > /usr/local/bin/vibe-wizard << 'WIZ'
#!/usr/bin/env bash
set -e
CONFIG=/etc/vibe/config.json
echo "Vibe post-install wizard"
echo "Config: $CONFIG"
if command -v whiptail >/dev/null 2>&1; then
  SEL=$(whiptail --title "Vibe Wizard" --checklist "Выберите компоненты" 20 78 8 \
    "zed" "Zed editor" ON \
    "cursor" "Cursor editor" ON \
    "vscode" "VS Code" ON \
    "neovim" "Neovim" ON \
    "continue" "Continue AI" ON \
    "aider" "Aider agent" ON \
    "ollama" "Ollama local LLM" ON \
    "docker" "Docker" ON 3>&1 1>&2 2>&3) || true
  echo "Selected: $SEL" > /tmp/vibe-wizard.log
fi
echo "Готово. При желании установите выбранные компоненты вручную или через скрипт."
WIZ
chmod +x /usr/local/bin/vibe-wizard

echo "Custom chroot done."
EOS

# apply replacements
sed -i "s/__USER__/${userName}/g; s/__HOST__/${hostName}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__NVIDIA__/${includeNvidia ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__FLATPAKS__/${flatpaks.map(s => `"${s}"`).join(" ")}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_NODE__/${runtimes.includes("node-lts") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_BUN__/${runtimes.includes("bun") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_DENO__/${runtimes.includes("deno") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_PY__/${runtimes.includes("python-3.12") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_RUST__/${runtimes.includes("rust-stable") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_GO__/${runtimes.includes("go-1.22") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_NEOVIM__/${editors.includes("neovim") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_HELIX__/${editors.includes("helix") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_AIDER__/${agents.includes("aider") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_GPT_ENG__/${agents.includes("gpt-engineer") ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"
sed -i "s/__HAS_OLLAMA__/${installOllama ? 1 : 0}/g" "$ROOTFS/tmp/customize.sh"

mkdir -p "$ROOTFS/etc/vibe"
cat > "$ROOTFS/etc/vibe/config.json" << JSON
{
  "distro": "${distro}",
  "editors": [${editors.map(e => `"${e}"`).join(", ")}],
  "agents": [${agents.map(a => `"${a}"`).join(", ")}],
  "runtimes": [${runtimes.map(r => `"${r}"`).join(", ")}],
  "tools": [${tools.map(t => `"${t}"`).join(", ")}],
  "flatpak": ${enableFlatpak},
  "nvidia": ${includeNvidia},
  "ollama": ${installOllama},
  "user": "${userName}",
  "hostname": "${hostName}"
}
JSON

log "Running chroot customization..."
# Mount filesystems for chroot
mount --bind /dev "$ROOTFS/dev"
mount -t devpts devpts "$ROOTFS/dev/pts"
mount -t tmpfs tmpfs "$ROOTFS/dev/shm"
mount -t proc /proc "$ROOTFS/proc"
mount -t sysfs /sys "$ROOTFS/sys"
cp /etc/resolv.conf "$ROOTFS/etc/resolv.conf" || true

chroot "$ROOTFS" bash /tmp/customize.sh

umount -l "$ROOTFS/dev/pts" "$ROOTFS/dev/shm" "$ROOTFS/dev" "$ROOTFS/proc" "$ROOTFS/sys" 2>/dev/null || true

# 4) Build squashfs and ISO
log "Building squashfs..."
mkdir -p "$WORKDIR/iso-root"
mksquashfs "$ROOTFS" "$WORKDIR/iso-root/filesystem.squashfs" -comp zstd -Xcompression-level 19 -noappend

mkdir -p "$WORKDIR/iso/boot/grub"
cp -f "$ROOTFS/boot/vmlinuz"* "$WORKDIR/iso/boot/vmlinuz" 2>/dev/null || true
cp -f "$ROOTFS/boot/initrd"* "$WORKDIR/iso/boot/initrd.img" 2>/dev/null || true

cat > "$WORKDIR/iso/boot/grub/grub.cfg" << 'GRUB'
set default=0
set timeout=5
menuentry "Vibe Linux Live" {
  linux /boot/vmlinuz boot=live quiet splash
  initrd /boot/initrd.img
}
GRUB

mkdir -p "$WORKDIR/iso/live"
cp "$WORKDIR/iso-root/filesystem.squashfs" "$WORKDIR/iso/live/filesystem.squashfs"

log "Creating ISO..."
OUT="$OUTDIR/vibe-linux-${distro}-$(date +%Y%m%d).iso"
xorriso -as mkisofs \
  -r -V "VIBE_LINUX" \
  -o "$OUT" \
  -J -joliet-long -l \
  "$WORKDIR/iso" || {
  warn "xorriso failed, check logs"
  exit 1
}

log "Done! ISO at: $OUT"
`;
  return header.trim();
}
