import type { ListedFile } from "../../services/fs/tauriFs";

type Props = {
  onPickFolder: () => void;
  isBusy?: boolean;

  presets: ListedFile[];
  selectedFile: ListedFile | null;
  onSelectPreset: (file: ListedFile) => void;

  onShowXml: () => void;
  canShowXml: boolean;
};

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6.5C3 5.12 4.12 4 5.5 4H10L12 6H18.5C19.88 6 21 7.12 21 8.5V17.5C21 18.88 19.88 20 18.5 20H5.5C4.12 20 3 18.88 3 17.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopToolbar({
  onPickFolder,
  isBusy,
  presets,
  selectedFile,
  onSelectPreset,
  onShowXml,
  canShowXml,
}: Props) {
  const selectedKey = selectedFile ? selectedFile.path : "";

  return (
    <div className="bb-toolbar">
      <button
        className="bb-iconButton"
        onClick={onPickFolder}
        disabled={!!isBusy}
        title="Choose folder"
        aria-label="Choose folder"
      >
        <FolderIcon />
      </button>

      <select
        className="bb-select bb-select--toolbar"
        disabled={presets.length === 0 || !!isBusy}
        value={selectedKey}
        onChange={(e) => {
          const f = presets.find((x) => x.path === e.target.value);
          if (f) onSelectPreset(f);
        }}
      >
        {presets.length === 0 ? (
          <option value="">{isBusy ? "(loading…)" : "(pick a folder)"}</option>
        ) : (
          presets.map((p) => (
            <option key={p.path} value={p.path}>
              {p.name}
            </option>
          ))
        )}
      </select>

      <div className="bb-toolbarSpacer" />

      {canShowXml ? (
        <button
          className="bb-iconButton"
          onClick={onShowXml}
          title="Show preset XML"
        >
          XML…
        </button>
      ) : null}

      {isBusy ? <span className="bb-pill">Working…</span> : null}
    </div>
  );
}
