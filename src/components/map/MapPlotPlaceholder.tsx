import { View, StyleSheet } from 'react-native';
import { MAP_SKY_COLOR } from '@/rendering/three/constants';

interface MapPlotPlaceholderProps {
  height?: number;
  /** Match native SettlementPlot square crop. */
  square?: boolean;
}

/** Static placeholder while the GL canvas is unmounted (e.g. another tab is active). */
export function MapPlotPlaceholder({ height = 420, square = false }: MapPlotPlaceholderProps) {
  return (
    <View style={[styles.placeholder, square ? styles.square : { height }]} />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: MAP_SKY_COLOR,
  },
  square: {
    aspectRatio: 1,
  },
});
