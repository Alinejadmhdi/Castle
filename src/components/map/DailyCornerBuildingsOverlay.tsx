import { Image, StyleSheet, View } from 'react-native';
import { DAILY_CORNER_IMAGES } from '@/constants/dailyCornerAssets';

interface DailyCornerBuildingsOverlayProps {
  todayBrickHours: number;
  dailyGoalHours: number;
}

interface CornerPlacement {
  left: `${number}%`;
  top: `${number}%`;
}

const CORNER_PLACEMENTS: CornerPlacement[] = [
  { left: '4%', top: '5%' },
  { left: '75%', top: '5%' },
  { left: '4%', top: '72%' },
  { left: '75%', top: '72%' },
];

function getUnlockedCornerCount(todayBrickHours: number, dailyGoalHours: number): number {
  if (dailyGoalHours <= 0) return 0;
  const quarter = dailyGoalHours / 4;
  if (quarter <= 0) return 0;
  const unlocked = Math.floor((todayBrickHours + 1e-9) / quarter);
  return Math.max(0, Math.min(4, unlocked));
}

/** Renders up to 4 daily milestone cottages on the map corners. */
export function DailyCornerBuildingsOverlay({
  todayBrickHours,
  dailyGoalHours,
}: DailyCornerBuildingsOverlayProps) {
  const unlockedCount = getUnlockedCornerCount(todayBrickHours, dailyGoalHours);
  if (unlockedCount <= 0) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {CORNER_PLACEMENTS.slice(0, unlockedCount).map((placement, index) => (
        <Image
          key={`daily-corner-${index}`}
          source={DAILY_CORNER_IMAGES[index]}
          resizeMode="contain"
          style={[styles.corner, placement]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
    elevation: 8,
  },
  corner: {
    position: 'absolute',
    width: '21%',
    aspectRatio: 1,
  },
});
