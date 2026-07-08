import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, FileDown } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { FaCode, FaGitAlt, FaRobot, FaUserGear, FaWindows } from "react-icons/fa6";
import {
  SiAnthropic,
  SiBun,
  SiClaude,
  SiClaudecode,
  SiDocker,
  SiGithub,
  SiGitlab,
  SiNodedotjs,
  SiPnpm,
  SiPython,
  SiUv,
  SiVercel
} from "react-icons/si";
import {
  PACKAGES,
  autoAdded,
  buildScript,
  fileName,
  resolveSelection,
  supportsOs,
  visibleResolved
} from "./builder.js";

const DEFAULT_SETTINGS = {
  gitName: "Claude Code",
  gitEmail: "noreply@anthropic.com",
  otelEndpoint: "http://localhost:4317",
  otelProtocol: "grpc",
  otelHeaderName: "",
  otelHeaderValue: "",
  otelEnvironment: "dev",
  otelResourceAttributes: "",
  otelMetricInterval: "60000",
  otelLogsInterval: "5000",
  claudeMetricsExporter: "otlp",
  claudeLogsExporter: "otlp",
  claudeTracesExporter: "none",
  claudeLogUserPrompts: false,
  claudeLogAssistantResponses: false,
  claudeLogToolDetails: false,
  claudeLogToolContent: false,
  claudeRawApiBodiesMode: "off",
  claudeRawApiBodiesDir: "",
  codexLogExporter: "otlp",
  codexTraceExporter: "none",
  codexMetricsExporter: "none",
  codexLogUserPrompt: false
};

const OTEL_PROTOCOL_OPTIONS = [
  ["grpc", "gRPC"],
  ["http/protobuf", "HTTP/protobuf"],
  ["http/json", "HTTP/json"]
];

const CLAUDE_METRICS_OPTIONS = [
  ["otlp", "OTLP"],
  ["console", "Console"],
  ["prometheus", "Prometheus"],
  ["none", "None"]
];

const CLAUDE_LOG_OPTIONS = [
  ["otlp", "OTLP"],
  ["console", "Console"],
  ["none", "None"]
];

const CLAUDE_TRACE_OPTIONS = [
  ["none", "None"],
  ["otlp", "OTLP"],
  ["console", "Console"]
];

const CODEX_EXPORTER_OPTIONS = [
  ["otlp", "OTLP"],
  ["none", "None"]
];

const CODEX_METRICS_OPTIONS = [
  ["none", "None"],
  ["otlp", "OTLP"],
  ["statsig", "Statsig"]
];

const RAW_BODY_OPTIONS = [
  ["off", "Off"],
  ["inline", "Inline"],
  ["file", "File reference"]
];

const STATUS_TEXT = {
  ready: "준비됨",
  noTools: "선택된 도구 없음",
  copied: "복사 완료",
  copyFailed: "복사 실패"
};

const GROUP_LABELS = {
  Core: "기본 도구",
  Editor: "에디터",
  "AI tools": "AI 도구",
  "Web deploy": "웹 배포",
  "Source control": "소스 관리",
  Advanced: "고급 설정"
};

const PACKAGE_TEXT = {
  git: { note: "버전 관리와 터미널 연동에 필요합니다." },
  node: { note: "JavaScript 실행 환경입니다. npm 기반 CLI 설치에 필요합니다." },
  pnpm: { note: "JavaScript 패키지 관리자입니다. Corepack을 우선 사용합니다." },
  python: { note: "Python 실행 환경과 패키지 도구를 설치합니다." },
  uv: { note: "Python 프로젝트와 패키지 관리를 위한 도구입니다." },
  bun: { note: "선택 사항인 JavaScript 런타임과 패키지 관리자입니다." },
  docker: { note: "컨테이너 실행 환경입니다. 설치 후 처음 실행이나 재시작이 필요할 수 있습니다." },
  wsl2: { note: "Windows 전용 Linux 환경입니다. 관리자 권한과 재시작이 필요할 수 있습니다." },
  vscode: { note: "코드 편집기와 code 명령을 설치합니다." },
  "claude-desktop": { note: "Claude 데스크톱 앱입니다." },
  "claude-code": { note: "Claude Code 명령줄 도구입니다. 공식 설치 방식을 우선 사용합니다." },
  "claude-code-telemetry": { label: "Claude Code 관측 로그", note: "Claude Code 실행 로그 설정을 추가합니다. 프롬프트 본문은 기록하지 않습니다." },
  "claude-extension": { label: "Claude Code VS Code 확장", note: "VS Code에서 Claude Code를 쓰기 위한 확장입니다." },
  codex: { note: "@openai/codex 명령줄 도구를 npm으로 설치합니다." },
  "codex-telemetry": { label: "Codex 관측 로그", note: "Codex 실행 로그 설정을 추가합니다. 프롬프트 본문은 기록하지 않습니다." },
  vercel: { note: "Vercel 배포용 명령줄 도구를 설치합니다." },
  gh: { note: "GitHub 작업용 gh 명령을 설치합니다." },
  "github-auth": { label: "GitHub CLI 로그인", note: "GitHub CLI 로그인 상태를 확인하고 필요한 명령을 안내합니다." },
  glab: { note: "GitLab 작업용 glab 명령을 설치합니다." },
  "git-config": { label: "Git 사용자 정보 기본값", note: "Git 이름과 이메일이 없을 때만 기본값을 설정합니다." }
};

const PACKAGE_ICONS = {
  git: [FaGitAlt, "git"],
  node: [SiNodedotjs, "node"],
  pnpm: [SiPnpm, "pnpm"],
  python: [SiPython, "python"],
  uv: [SiUv, "uv"],
  bun: [SiBun, "bun"],
  docker: [SiDocker, "docker"],
  wsl2: [FaWindows, "windows"],
  vscode: [FaCode, "vscode"],
  "claude-desktop": [SiClaude, "claude"],
  "claude-code": [SiClaudecode, "claude"],
  "claude-code-telemetry": [SiClaudecode, "claude"],
  "claude-extension": [SiAnthropic, "claude"],
  codex: [FaRobot, "openai"],
  "codex-telemetry": [FaRobot, "openai"],
  vercel: [SiVercel, "vercel"],
  gh: [SiGithub, "github"],
  "github-auth": [SiGithub, "github"],
  glab: [SiGitlab, "gitlab"],
  "git-config": [FaUserGear, "settings"]
};

const ADVANCED_PACKAGE_IDS = new Set(["claude-code-telemetry", "codex-telemetry"]);

const PERMISSION_HELP = {
  mac: [
    {
      title: "터미널에서 바로 실행",
      body: "다운로드한 파일이 바로 실행되지 않으면 이 명령어로 실행하세요.",
      command: "bash setup-mac.command"
    },
    {
      title: "더블클릭 실행 허용",
      body: "Finder에서 더블클릭하려면 먼저 실행 권한을 부여하세요.",
      command: "chmod +x setup-mac.command"
    },
    {
      title: "macOS 차단 해제",
      body: "파일을 오른쪽 클릭한 뒤 열기, 다시 열기를 선택하세요."
    },
    {
      title: "격리 속성 제거",
      body: "계속 막히면 다운로드 격리 속성을 제거하세요.",
      command: "xattr -d com.apple.quarantine setup-mac.command"
    }
  ],
  win: [
    {
      title: "차단 해제",
      body: "Windows가 파일을 차단하면 파일 속성에서 차단 해제를 선택하세요."
    },
    {
      title: "관리자 권한 실행",
      body: "설치가 실패하면 파일을 오른쪽 클릭해 관리자 권한으로 실행하세요.",
      command: "setup-windows.bat"
    },
    {
      title: "SmartScreen 통과",
      body: "SmartScreen이 나오면 추가 정보, 실행을 선택하세요."
    },
    {
      title: "PowerShell 정책",
      body: "정책 우회는 이 설치 스크립트를 실행하는 동안에만 적용됩니다."
    }
  ]
};

function packageLabel(item) {
  return PACKAGE_TEXT[item.id]?.label || item.label;
}

function packageNote(item) {
  return PACKAGE_TEXT[item.id]?.note || item.note;
}

function groupKey(item) {
  return ADVANCED_PACKAGE_IDS.has(item.id) ? "Advanced" : item.group;
}

function packageIcon(id) {
  const icon = PACKAGE_ICONS[id];
  if (!icon) {
    return null;
  }
  const [Icon, tone] = icon;
  return (
    <span className={`tool-icon-wrap ${tone}`} aria-hidden="true">
      <Icon className="tool-icon" />
    </span>
  );
}

function SettingSelect({ label, value, options, onChange }) {
  return (
    <label className="setting-field">
      <span>{label}</span>
      <select className="select-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function SettingToggle({ label, checked, onChange }) {
  return (
    <label className="toggle-line">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function allSelection() {
  return new Set(PACKAGES.map((item) => item.id));
}

function groupDomId(group) {
  return `group-${group.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function copyFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) {
    throw new Error("Copy failed");
  }
}

function App() {
  const [os, setOs] = useState("mac");
  const [selected, setSelected] = useState(() => allSelection());
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [status, setStatus] = useState(STATUS_TEXT.ready);
  const [lastAction, setLastAction] = useState("");
  const [copiedCommand, setCopiedCommand] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const statusTimer = useRef();
  const commandTimer = useRef();

  const packages = useMemo(() => PACKAGES.filter((item) => supportsOs(item, os)), [os]);
  const groups = useMemo(() => [...new Set(packages.map((item) => groupKey(item)))], [packages]);
  const selectedCount = useMemo(() => packages.filter((item) => selected.has(item.id)).length, [packages, selected]);
  const selectedRatio = packages.length ? Math.round((selectedCount / packages.length) * 100) : 0;
  const resolved = useMemo(() => resolveSelection(selected, os), [selected, os]);
  const script = useMemo(() => buildScript(selected, os, settings), [selected, os, settings]);
  const added = useMemo(() => autoAdded(selected, resolved), [selected, resolved]);
  const tools = visibleResolved(resolved);
  const currentFileName = fileName(os);
  const showGitDefaults = resolved.has("git-config");
  const showTelemetryDefaults = resolved.has("claude-code-telemetry") || resolved.has("codex-telemetry");

  function showStatus(text, action = "") {
    setStatus(text);
    setLastAction(action);
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => {
      setStatus(tools.length ? STATUS_TEXT.ready : STATUS_TEXT.noTools);
      setLastAction("");
    }, 1600);
  }

  function setTarget(nextOs) {
    setOs(nextOs);
    setStatus(STATUS_TEXT.ready);
    setLastAction("");
  }

  function togglePackage(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function toggleGroup(group) {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }

  async function copyText(text, successText, action = "") {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        copyFallback(text);
      }
      showStatus(successText, action);
    } catch {
      setStatus(STATUS_TEXT.copyFailed);
      setLastAction("");
    }
  }

  async function copyCurrentScript() {
    await copyText(script, STATUS_TEXT.copied, "copy");
  }

  async function copyCommand(command) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
      } else {
        copyFallback(command);
      }
      setCopiedCommand(command);
      window.clearTimeout(commandTimer.current);
      commandTimer.current = window.setTimeout(() => setCopiedCommand(""), 1600);
    } catch {
      setStatus(STATUS_TEXT.copyFailed);
    }
  }

  function downloadCurrentScript() {
    const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentFileName;
    link.click();
    URL.revokeObjectURL(url);
    showStatus(`다운로드 완료: ${currentFileName}`, "download");
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <h1>개발 환경 설치 도우미</h1>
          <p>필요한 도구를 선택하면 macOS 또는 Windows 설치 스크립트를 만듭니다.</p>
        </div>
        <div className="actions">
          <Button
            className="action-button"
            label={lastAction === "copy" ? "복사됨" : "복사"}
            icon={lastAction === "copy" ? <Check size={17} /> : <Copy size={17} />}
            onClick={copyCurrentScript}
            variant="secondary"
          />
          <Button
            className="action-button"
            label={lastAction === "download" ? "다운로드됨" : "다운로드"}
            icon={lastAction === "download" ? <Check size={17} /> : <Download size={17} />}
            onClick={downloadCurrentScript}
            variant="primary"
          />
        </div>
      </header>

      <div className="builder">
        <section className="panel controls" aria-label="설치 항목 선택">
          <div className="section compact">
            <div className="section-title">
              <h2>운영체제</h2>
            </div>
            <SegmentedControl value={os} onChange={setTarget} label="설치할 운영체제" layout="fill">
              <SegmentedControlItem value="mac" label="macOS" />
              <SegmentedControlItem value="win" label="Windows" />
            </SegmentedControl>
          </div>

          <div className="section compact">
            <div className="section-title">
              <h2>선택</h2>
            </div>
            <div className="selection-summary">
              <div>
                <strong>{selectedCount}개 선택됨</strong>
                <span>선택한 항목만 설치 스크립트에 포함됩니다.</span>
              </div>
              <div className="selection-meter" aria-hidden="true">
                <span style={{ width: `${selectedRatio}%` }} />
              </div>
            </div>
            <div className="selection-row">
              <Button label="전체 선택" onClick={() => setSelected(allSelection())} size="sm" variant="secondary" />
              <Button label="전체 해제" onClick={() => setSelected(new Set())} size="sm" variant="secondary" />
            </div>
          </div>

          <div className="package-list" aria-label="설치할 도구">
            {groups.map((group) => {
              const groupPackages = packages.filter((item) => groupKey(item) === group);
              const groupSelected = groupPackages.filter((item) => selected.has(item.id)).length;
              const isCollapsed = collapsedGroups.has(group);
              return (
                <div className="group" key={group}>
                  <button
                    type="button"
                    className="group-head"
                    aria-expanded={!isCollapsed}
                    aria-controls={groupDomId(group)}
                    aria-label={`${GROUP_LABELS[group] || group} 카테고리 ${isCollapsed ? "펼치기" : "접기"}`}
                    onClick={() => toggleGroup(group)}
                  >
                    <h3>{GROUP_LABELS[group] || group}</h3>
                    <span className="group-head-meta">
                      <span>{groupSelected}/{groupPackages.length}</span>
                      <ChevronDown className="group-chevron" size={15} aria-hidden="true" />
                    </span>
                  </button>
                  <div
                    id={groupDomId(group)}
                    className="group-body"
                    data-collapsed={isCollapsed ? "true" : "false"}
                    aria-hidden={isCollapsed}
                    inert={isCollapsed ? true : undefined}
                  >
                    <div className="group-body-inner">
                      {groupPackages.map((item) => (
                        <CheckboxInput
                          className={`package ${ADVANCED_PACKAGE_IDS.has(item.id) ? "package-advanced" : ""}`}
                          key={item.id}
                          label={packageLabel(item)}
                          labelIcon={packageIcon(item.id)}
                          description={packageNote(item)}
                          value={selected.has(item.id)}
                          onChange={() => togglePackage(item.id)}
                          width="100%"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showGitDefaults ? (
            <div className="section">
              <div className="section-title">
                <h2>Git 기본값</h2>
              </div>
              <div className="settings">
                <TextInput
                  htmlName="gitName"
                  label="이름"
                  value={settings.gitName}
                  onChange={(gitName) => setSettings({ ...settings, gitName })}
                  width="100%"
                />
                <TextInput
                  htmlName="gitEmail"
                  label="이메일"
                  value={settings.gitEmail}
                  onChange={(gitEmail) => setSettings({ ...settings, gitEmail })}
                  type="email"
                  width="100%"
                />
              </div>
            </div>
          ) : null}

          {showTelemetryDefaults ? (
            <div className="section config-section">
              <div className="section-title">
                <h2>관측 로그 설정</h2>
                <span className="section-badge">고급</span>
              </div>
              <p className="section-help">
                Claude Code 또는 Codex 관측 로그를 선택한 경우에만 적용됩니다. 프롬프트 본문은 기록하지 않습니다.
              </p>
              <div className="settings">
                <TextInput
                  htmlName="otelEndpoint"
                  label="수집 서버 주소"
                  value={settings.otelEndpoint}
                  onChange={(otelEndpoint) => updateSetting("otelEndpoint", otelEndpoint)}
                  width="100%"
                />
                <div className="settings-grid">
                  <SettingSelect
                    label="전송 프로토콜"
                    value={settings.otelProtocol}
                    options={OTEL_PROTOCOL_OPTIONS}
                    onChange={(value) => updateSetting("otelProtocol", value)}
                  />
                  <TextInput
                    htmlName="otelEnvironment"
                    label="환경"
                    value={settings.otelEnvironment}
                    onChange={(value) => updateSetting("otelEnvironment", value)}
                    width="100%"
                  />
                  <TextInput
                    htmlName="otelHeaderName"
                    label="헤더 이름"
                    value={settings.otelHeaderName}
                    onChange={(value) => updateSetting("otelHeaderName", value)}
                    width="100%"
                  />
                  <TextInput
                    htmlName="otelHeaderValue"
                    label="헤더 값"
                    value={settings.otelHeaderValue}
                    onChange={(value) => updateSetting("otelHeaderValue", value)}
                    width="100%"
                  />
                  <TextInput
                    htmlName="otelMetricInterval"
                    label="Metrics 주기(ms)"
                    value={settings.otelMetricInterval}
                    onChange={(value) => updateSetting("otelMetricInterval", value)}
                    type="number"
                    width="100%"
                  />
                  <TextInput
                    htmlName="otelLogsInterval"
                    label="Logs 주기(ms)"
                    value={settings.otelLogsInterval}
                    onChange={(value) => updateSetting("otelLogsInterval", value)}
                    type="number"
                    width="100%"
                  />
                </div>
                <TextInput
                  htmlName="otelResourceAttributes"
                  label="리소스 속성"
                  value={settings.otelResourceAttributes}
                  onChange={(value) => updateSetting("otelResourceAttributes", value)}
                  placeholder="team=platform,service.namespace=local"
                  width="100%"
                />
                {resolved.has("claude-code-telemetry") ? (
                  <div className="telemetry-card">
                    <h3>Claude Code</h3>
                    <div className="settings-grid">
                      <SettingSelect label="Metrics" value={settings.claudeMetricsExporter} options={CLAUDE_METRICS_OPTIONS} onChange={(value) => updateSetting("claudeMetricsExporter", value)} />
                      <SettingSelect label="Logs" value={settings.claudeLogsExporter} options={CLAUDE_LOG_OPTIONS} onChange={(value) => updateSetting("claudeLogsExporter", value)} />
                      <SettingSelect label="Traces" value={settings.claudeTracesExporter} options={CLAUDE_TRACE_OPTIONS} onChange={(value) => updateSetting("claudeTracesExporter", value)} />
                      <SettingSelect label="Raw API body" value={settings.claudeRawApiBodiesMode} options={RAW_BODY_OPTIONS} onChange={(value) => updateSetting("claudeRawApiBodiesMode", value)} />
                    </div>
                    {settings.claudeRawApiBodiesMode === "file" ? (
                      <TextInput
                        htmlName="claudeRawApiBodiesDir"
                        label="Raw body 저장 경로"
                        value={settings.claudeRawApiBodiesDir}
                        onChange={(value) => updateSetting("claudeRawApiBodiesDir", value)}
                        width="100%"
                      />
                    ) : null}
                    <div className="toggle-grid">
                      <SettingToggle label="프롬프트 본문 수집" checked={settings.claudeLogUserPrompts} onChange={(value) => updateSetting("claudeLogUserPrompts", value)} />
                      <SettingToggle label="Assistant 응답 수집" checked={settings.claudeLogAssistantResponses} onChange={(value) => updateSetting("claudeLogAssistantResponses", value)} />
                      <SettingToggle label="Tool 상세 수집" checked={settings.claudeLogToolDetails} onChange={(value) => updateSetting("claudeLogToolDetails", value)} />
                      <SettingToggle label="Tool 입출력 내용 수집" checked={settings.claudeLogToolContent} onChange={(value) => updateSetting("claudeLogToolContent", value)} />
                    </div>
                  </div>
                ) : null}
                {resolved.has("codex-telemetry") ? (
                  <div className="telemetry-card">
                    <h3>Codex</h3>
                    <div className="settings-grid">
                      <SettingSelect label="Logs" value={settings.codexLogExporter} options={CODEX_EXPORTER_OPTIONS} onChange={(value) => updateSetting("codexLogExporter", value)} />
                      <SettingSelect label="Traces" value={settings.codexTraceExporter} options={CODEX_EXPORTER_OPTIONS} onChange={(value) => updateSetting("codexTraceExporter", value)} />
                      <SettingSelect label="Metrics" value={settings.codexMetricsExporter} options={CODEX_METRICS_OPTIONS} onChange={(value) => updateSetting("codexMetricsExporter", value)} />
                    </div>
                    <div className="toggle-grid">
                      <SettingToggle label="프롬프트 본문 수집" checked={settings.codexLogUserPrompt} onChange={(value) => updateSetting("codexLogUserPrompt", value)} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="section compact">
            <div className="section-title">
              <h2>실행 권한 안내</h2>
            </div>
            <ol className="help-list">
              {PERMISSION_HELP[os].map((item, index) => (
                <li className="help-item" key={item.title}>
                  <span className="help-step">{index + 1}</span>
                  <span className="help-copy">
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                    {item.command ? (
                      <button
                        type="button"
                        className="command-copy"
                        aria-label={`${item.title} 명령어 복사`}
                        onClick={() => copyCommand(item.command)}
                      >
                        <code>{item.command}</code>
                        <span>
                          {copiedCommand === item.command ? <Check size={13} /> : <Copy size={13} />}
                          {copiedCommand === item.command ? "복사됨" : "복사"}
                        </span>
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="panel preview" aria-label="생성된 설치 스크립트 미리보기">
          <div className="preview-head">
            <div className="preview-title">
              <FileDown size={18} />
              <h2>{currentFileName}</h2>
            </div>
            <div className="script-stats" aria-label="스크립트 요약">
              <span>
                <strong>{tools.length}</strong>
                <small>도구</small>
              </span>
              <span>
                <strong>{script.split(/\r?\n/).length}</strong>
                <small>줄</small>
              </span>
            </div>
          </div>
          <TextArea
            className="script-textarea"
            label="생성된 설치 스크립트"
            isLabelHidden
            value={script}
            onChange={() => {}}
            rows={24}
            hasSpellCheck={false}
            width="100%"
          />
          <div className="status">
            <span className={tools.length ? "" : "warning"}>{tools.length ? status : STATUS_TEXT.noTools}</span>
            <span>{added.length ? `자동 추가: ${added.join(", ")}` : ""}</span>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
