import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import {
  BUILDING_PREVIEW_SHEETS,
  BUILDING_STAGE_IMAGES,
} from '@/constants/buildingPreviewAssets';
import { theme } from '@/constants/theme';

const PREVIEW_SHEETS = BUILDING_PREVIEW_SHEETS;
const SHEET_RANGES = ['Stages 0–6', 'Stages 7–13', 'Stages 14–20', 'Stages 21–26'] as const;

export default function BuildingGalleryScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>27 Stage Buildings</Text>
        <Text style={styles.sub}>
          CoC-style art used on the Life Map. Each structure unlocks at the cumulative brick count
          shown. Ring monuments keep earlier stages; the center HQ shows your current stage.
        </Text>

        <Text style={styles.listTitle}>Map sprites (all 27)</Text>
        <View style={styles.stageGrid}>
          {MACRO_BUILDING_STAGES.map((stage) => (
            <View key={stage.key} style={styles.stageCard}>
              <Image
                source={BUILDING_STAGE_IMAGES[stage.index]}
                style={styles.stageImage}
                resizeMode="contain"
              />
              <Text style={styles.stageIndex}>{stage.index}</Text>
              <Text style={styles.stageName} numberOfLines={2}>
                {stage.name}
              </Text>
              <Text style={styles.stageMeta}>{stage.cumulativeBricks} bricks</Text>
            </View>
          ))}
        </View>

        <Text style={styles.listTitle}>Reference sheets</Text>
        {PREVIEW_SHEETS.map((src, i) => (
          <View key={i} style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>{SHEET_RANGES[i]}</Text>
            <Image source={src} style={styles.sheetImage} resizeMode="contain" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 48 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  sub: { color: theme.colors.textMuted, marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  stageCard: {
    width: '30%',
    minWidth: 100,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
    alignItems: 'center',
  },
  stageImage: { width: '100%', height: 72 },
  stageIndex: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
  },
  stageName: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  stageMeta: { color: theme.colors.textMuted, fontSize: 10, marginTop: 2 },
  sheetCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
  },
  sheetTitle: { color: theme.colors.primary, fontWeight: '600', marginBottom: theme.spacing.sm },
  sheetImage: { width: '100%', height: 220, borderRadius: theme.radius.sm },
  listTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
});
