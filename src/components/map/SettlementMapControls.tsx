import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

export type MapPanDirection = 'up' | 'down' | 'left' | 'right';

interface SettlementMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: (direction: MapPanDirection) => void;
}

function ControlButton({
  label,
  onPress,
  accessibilityLabel,
  compact,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  compact?: boolean;
}) {
  return (
    <Pressable
      style={[styles.btn, compact && styles.btnCompact]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.btnText, compact && styles.btnTextCompact]}>{label}</Text>
    </Pressable>
  );
}

export function SettlementMapControls({
  onZoomIn,
  onZoomOut,
  onPan,
}: SettlementMapControlsProps) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.dpad}>
        <ControlButton label="↑" onPress={() => onPan('up')} accessibilityLabel="Pan up" compact />
        <View style={styles.dpadRow}>
          <ControlButton
            label="←"
            onPress={() => onPan('left')}
            accessibilityLabel="Pan left"
            compact
          />
          <ControlButton
            label="↓"
            onPress={() => onPan('down')}
            accessibilityLabel="Pan down"
            compact
          />
          <ControlButton
            label="→"
            onPress={() => onPan('right')}
            accessibilityLabel="Pan right"
            compact
          />
        </View>
      </View>
      <View style={styles.zoom}>
        <ControlButton label="+" onPress={onZoomIn} accessibilityLabel="Zoom in" />
        <ControlButton label="−" onPress={onZoomOut} accessibilityLabel="Zoom out" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dpad: {
    alignItems: 'center',
    gap: 4,
  },
  dpadRow: {
    flexDirection: 'row',
    gap: 4,
  },
  zoom: {
    gap: 6,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 20, 16, 0.82)',
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    width: 32,
    height: 32,
  },
  btnText: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  btnTextCompact: {
    fontSize: 18,
    lineHeight: 20,
  },
});
