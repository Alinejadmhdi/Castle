import { Billboard, Text } from '@react-three/drei';

interface BrickCountLabelProps {
  position: [number, number, number];
  label: string;
  sublabel?: string;
  scale?: number;
}

export function BrickCountLabel({ position, label, sublabel, scale = 1 }: BrickCountLabelProps) {
  return (
    <Billboard position={position} follow>
      <Text
        fontSize={0.22 * scale}
        color="#fffbe8"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02 * scale}
        outlineColor="#2a1810"
      >
        {sublabel ? `${label}\n${sublabel}` : label}
      </Text>
    </Billboard>
  );
}
