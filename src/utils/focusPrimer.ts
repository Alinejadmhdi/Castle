import { Alert, Linking, Platform } from 'react-native';

let shownThisLaunch = false;

/** One-time-per-launch primer before the first focus session. */
export function showFocusPrimerIfNeeded(onContinue: () => void): void {
  if (shownThisLaunch) {
    onContinue();
    return;
  }
  shownThisLaunch = true;

  const message =
    'Your timer keeps running when the screen locks or you switch apps (soft mode).\n\n' +
    'Strict mode cancels the session if you leave the app.\n\n' +
    (Platform.OS === 'android'
      ? 'For reliable timing, disable battery optimization for Life\'s Castle in system settings.'
      : 'Keep the app installed; timing resumes when you return.');

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
    onContinue();
    return;
  }

  Alert.alert('Before you focus', message, [
    ...(Platform.OS === 'android'
      ? [
          {
            text: 'Battery settings',
            onPress: () => {
              void Linking.openSettings();
              onContinue();
            },
          },
        ]
      : []),
    { text: 'Start focusing', onPress: onContinue },
  ]);
}
