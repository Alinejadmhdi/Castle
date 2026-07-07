import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { CelebrationLayer } from '@/components/celebration/CelebrationLayer';
import { allowCelebrationOverlay } from '@/store/celebrationStore';
import { theme } from '@/constants/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(focusedName: IoniconName, outlineName: IoniconName) {
  return ({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }) => <Ionicons name={focused ? focusedName : outlineName} size={size} color={color} />;
}

export default function TabLayout() {
  useEffect(() => {
    const timer = setTimeout(() => allowCelebrationOverlay(), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { color: theme.colors.text },
          tabBarStyle: { backgroundColor: theme.colors.surface },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          sceneStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Life Map',
            tabBarIcon: tabIcon('map', 'map-outline'),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: tabIcon('bar-chart', 'bar-chart-outline'),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: tabIcon('settings', 'settings-outline'),
          }}
        />
      </Tabs>
      <CelebrationLayer />
    </>
  );
}
