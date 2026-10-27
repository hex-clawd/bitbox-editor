import { useMemo, useState } from "react";

export type StatusLevel = "error" | "warning" | "info";

export type StatusMessage = {
  level: StatusLevel;
  text: string;
};

type Props = {
  messages: StatusMessage[];
  onClear?: () => void;
};

function levelDotClass(level: StatusLevel): string {
  switch (level) {
    case "error":
      return "bb-dot bb-dot--error";
    case "warning":
      return "bb-dot bb-dot--warning";
    default:
      return "bb-dot bb-dot--info";
  }
}

function levelLabel(level: StatusLevel): string {
  if (level === "error") return "ERROR";
  if (level === "warning") return "WARN";
  return "INFO";
}

export default function StatusBar({ messages, onClear }: Props) {
  const [expanded, setExpanded] = useState(false);

  const last = useMemo(() => (messages.length ? messages[messages.length - 1] : null), [messages]);
  const summary = last ? `${levelLabel(last.level)}: ${last.text}` : "No warnings/errors";

  return (
    <div className="bb-statusbar">
      <button className="bb-statusbarButton" onClick={() => setExpanded((v) => !v)} title={expanded ? "Collapse" : "Expand"}>
        <span className={last ? levelDotClass(last.level) : "bb-dot"} />
        <span className="bb-statusbarText">{summary}</span>
        <span className="bb-statusbarChevron">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded ? (
        <div className="bb-statusbarPanel">
          <div className="bb-statusbarPanelHeader">
            <div className="bb-statusbarPanelCount">
              Messages: <code>{messages.length}</code>
            </div>
            {onClear ? (
              <button className="bb-ghostButton" onClick={onClear}>
                Clear
              </button>
            ) : null}
          </div>

          <div className="bb-statusList">
            {messages.length === 0 ? (
              <div className="bb-empty">(empty)</div>
            ) : (
              <ul className="bb-statusUl">
                {messages
                  .slice()
                  .reverse()
                  .map((m, i) => (
                    <li key={`${m.level}-${m.text}-${i}`} className="bb-statusLi">
                      <span className="bb-statusLevel">{levelLabel(m.level)}</span>
                      <span className="bb-statusMsg">{m.text}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
