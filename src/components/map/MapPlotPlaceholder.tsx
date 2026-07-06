import { View, StyleSheet } from 'react-native';
import { MapBackgroundImage } from './MapBackgroundImage';

interface MapPlotPlaceholderProps {
  height?: number;
  /** Match native SettlementPlot square crop. */
  square?: boolean;
}

/** Static map preview while the GL canvas is unmounted. */
export function MapPlotPlaceholder({ height = 420, square = false }: MapPlotPlaceholderProps) {
  return (
    <View style={[styles.placeholder, square ? styles.square : { height }]}>
      <MapBackgroundImage />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#4a9238',
  },
  square: {
    aspectRatio: 1,
  },
});
