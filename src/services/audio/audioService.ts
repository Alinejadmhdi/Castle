/** Ambient loops — wire real files under assets/sounds/ when available. */
export async function startAmbient(_sound: 'rain' | 'fire' | 'wind'): Promise<void> {
  await stopAmbient();
}

export async function stopAmbient(): Promise<void> {
  // no-op until bundled ambient assets are added
}

/** Short completion cue — silent until a real sfx asset is bundled. */
export async function playCompleteSound(): Promise<void> {
  // no-op
}

/** Short unlock cue — silent until a real sfx asset is bundled. */
export async function playUnlockSound(): Promise<void> {
  // no-op
}
