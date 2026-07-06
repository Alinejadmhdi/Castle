interface SettlementControlsProps {
  lookAt: [number, number, number];
}

/** Native Life Map uses a fixed orthographic camera — no orbit controls. */
export function SettlementControls(_props: SettlementControlsProps) {
  return null;
}
