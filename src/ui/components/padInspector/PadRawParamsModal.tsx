import type { Pad } from "../../../core/domain/bitboxPreset";
import PadRawParamsSection from "./PadRawParamsSection";
import DebugModal from "../debug/DebugModal";

type Props = {
  pad: Pad;
  isOpen: boolean;
  onClose: () => void;
};

export default function PadRawParamsModal({ pad, isOpen, onClose }: Props) {
  return (
    <DebugModal title="All params (raw)" isOpen={isOpen} onClose={onClose}>
      <PadRawParamsSection pad={pad} />
    </DebugModal>
  );
}
