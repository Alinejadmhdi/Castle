import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { BUILDING_PREVIEW_SHEETS } from '@/constants/buildingPreviewAssets';
import { theme } from '@/constants/theme';

const PREVIEW_SHEETS = BUILDING_PREVIEW_SHEETS;

const SHEET_RANGES = ['Stages 0–6', 'Stages 7–13', 'Stages 14–20', 'Stages 21–26'] as const;

export default function BuildingGalleryScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>27 Stage Buildings</Text>
        <Text style={styles.sub}>
          Each structure unlocks at the cumulative brick count shown. Daily builds no longer
          stay on the map — only these macro stages persist.
        </Text>

        {PREVIEW_SHEETS.map((src, i) => (
          <View key={i} style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>{SHEET_RANGES[i]}</Text>
            <Image source={src} style={styles.sheetImage} resizeMode="contain" />
          </View>
        ))}

        <Text style={styles.listTitle}>All stages</Text>
        {MACRO_BUILDING_STAGES.map((stage) => (
          <View key={stage.key} style={styles.row}>
            <Text style={styles.rowName}>{stage.name}</Text>
            <Text style={styles.rowMeta}>
              {stage.cumulativeBricks} bricks · +{stage.stageBrickCount} per tier
            </Text>
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
  row: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceElevated,
  },
  rowName: { color: theme.colors.text, fontWeight: '500' },
  rowMeta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
});
