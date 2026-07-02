interface BrickCountLabelProps {
  position: [number, number, number];
  label: string;
  sublabel?: string;
  scale?: number;
}

/** Troika text writes to the documents directory on native — skip 3D labels on phone. */
export function BrickCountLabel(_props: BrickCountLabelProps) {
  return null;
}
