import DebugModal from "./DebugModal";

type Props = {
  xmlText: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function XmlPreviewModal({ xmlText, isOpen, onClose }: Props) {
  return (
    <DebugModal title="Preset XML" isOpen={isOpen} onClose={onClose}>
      <textarea
        readOnly
        value={xmlText}
        style={{
          width: "100%",
          minHeight: 400,
          resize: "vertical",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 13,
          lineHeight: 1.35,
          padding: 12,
          background: "rgba(0,0,0,0.25)",
          color: "inherit",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8,
        }}
      />
    </DebugModal>
  );
}
