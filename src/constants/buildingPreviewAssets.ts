/** Reference sheets — used by the gallery and the extraction script. */
export const BUILDING_PREVIEW_SHEETS = [
  require('../../assets/building-previews/stages-0-6.png'),
  require('../../assets/building-previews/stages-7-13.png'),
  require('../../assets/building-previews/stages-14-20.png'),
  require('../../assets/building-previews/stages-21-26.png'),
] as const;

/** One CoC-style PNG per macro stage (0–26), cropped from the sheets above. */
export const BUILDING_STAGE_IMAGES = [
  require('../../assets/building-stages/stage-00.png'),
  require('../../assets/building-stages/stage-01.png'),
  require('../../assets/building-stages/stage-02.png'),
  require('../../assets/building-stages/stage-03.png'),
  require('../../assets/building-stages/stage-04.png'),
  require('../../assets/building-stages/stage-05.png'),
  require('../../assets/building-stages/stage-06.png'),
  require('../../assets/building-stages/stage-07.png'),
  require('../../assets/building-stages/stage-08.png'),
  require('../../assets/building-stages/stage-09.png'),
  require('../../assets/building-stages/stage-10.png'),
  require('../../assets/building-stages/stage-11.png'),
  require('../../assets/building-stages/stage-12.png'),
  require('../../assets/building-stages/stage-13.png'),
  require('../../assets/building-stages/stage-14.png'),
  require('../../assets/building-stages/stage-15.png'),
  require('../../assets/building-stages/stage-16.png'),
  require('../../assets/building-stages/stage-17.png'),
  require('../../assets/building-stages/stage-18.png'),
  require('../../assets/building-stages/stage-19.png'),
  require('../../assets/building-stages/stage-20.png'),
  require('../../assets/building-stages/stage-21.png'),
  require('../../assets/building-stages/stage-22.png'),
  require('../../assets/building-stages/stage-23.png'),
  require('../../assets/building-stages/stage-24.png'),
  require('../../assets/building-stages/stage-25.png'),
  require('../../assets/building-stages/stage-26.png'),
] as const;

export const BUILDING_STAGE_COUNT = BUILDING_STAGE_IMAGES.length;

/** Clamp stage index to the 27-stage ladder. */
export function normalizeStageIndex(stageIndex: number): number {
  if (stageIndex < 0) return 0;
  if (stageIndex >= BUILDING_STAGE_COUNT) return BUILDING_STAGE_COUNT - 1;
  return stageIndex;
}
