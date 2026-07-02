import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCategoryStore } from '@/store/categoryStore';
import type { CategoryType } from '@/types';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

import { BRICK_DISPLAY_COLOR } from '@/rendering/three/constants';

const PRESET_COLORS = [BRICK_DISPLAY_COLOR, '#1E40AF', '#C2410C', '#15803D', '#7C3AED', '#CA8A04', '#0D9488'];

export default function NewCategoryScreen() {
  const router = useRouter();
  const { add } = useCategoryStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [type, setType] = useState<CategoryType>('standard');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    const cat = await add({ name: name.trim(), defaultColor: color, type });
    setSaving(false);
    router.replace(`/category/${cat.id}`);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Category name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Work, Study, Diet..."
        placeholderTextColor={theme.colors.textMuted}
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.row}>
        {(['standard', 'miniature'] as CategoryType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[styles.typeBtn, type === t && styles.typeBtnActive]}
          >
            <Text style={styles.typeText}>
              {t === 'standard' ? 'Focus timer' : 'Miniature (temptation)'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Brick color</Text>
      <View style={styles.colors}>
        {PRESET_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              color === c && styles.colorSelected,
            ]}
          />
        ))}
      </View>

      <Button title={saving ? 'Creating...' : 'Create Category'} onPress={handleCreate} disabled={saving || !name.trim()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  label: { color: theme.colors.text, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
  },
  row: { gap: theme.spacing.sm },
  typeBtn: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
    marginBottom: theme.spacing.sm,
  },
  typeBtnActive: { borderColor: theme.colors.primary },
  typeText: { color: theme.colors.text },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: theme.colors.primary },
});
