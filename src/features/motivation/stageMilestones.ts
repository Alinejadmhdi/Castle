import type { CategoryTheme } from './categoryTheme';

/** Real-world meaning for cumulative brick-hour thresholds (1 brick ≈ 1 hour). */
const MILESTONES: { minHours: number; messages: Record<CategoryTheme, string> }[] = [
  {
    minHours: 1,
    messages: {
      resist: 'One resist logged — you chose intention over impulse.',
      study: '1 hour of focus — enough to learn a core concept well.',
      career: '1 hour of deep work — one real task moved forward.',
      fitness: '1 hour of effort — your body remembers every rep.',
      creative: '1 hour creating — more than most people attempt in a week.',
      general: '1 hour invested — your future self noticed.',
    },
  },
  {
    minHours: 4,
    messages: {
      resist: '4 resists — a full foundation of self-control.',
      study: '4 hours: roughly one solid study session; basics start to stick.',
      career: '4 hours: a half-day of focused output most teams rarely get.',
      fitness: '4 hours: enough training to feel measurable progress.',
      creative: '4 hours: a short creative sprint — drafts become real.',
      general: '4 hours: habit loop engaged; keep stacking.',
    },
  },
  {
    minHours: 12,
    messages: {
      resist: '12 resists — temptation loses its grip when you keep showing up.',
      study: '12 hours: about two weeks of daily study — chapter-level mastery.',
      career: '12 hours: junior-level familiarity with a new tool or skill.',
      fitness: '12 hours: consistent movers outperform sporadic bursts.',
      creative: '12 hours: enough to finish a small portfolio piece.',
      general: '12 hours: compounding is now on your side.',
    },
  },
  {
    minHours: 40,
    messages: {
      resist: '40 resists — discipline is becoming your default.',
      study: '40 hours: one university course unit of depth in many subjects.',
      career: '40 hours: employable baseline for many freelance skills.',
      fitness: '40 hours: visible strength and endurance gains are likely.',
      creative: '40 hours: enough for a body of work you can show proudly.',
      general: '40 hours: you are in the top few percent of consistency.',
    },
  },
  {
    minHours: 100,
    messages: {
      resist: '100 resists — you rewired a habit others struggle with for years.',
      study: '100 hours: strong intermediate knowledge; exams feel manageable.',
      career: '100 hours: specialist-level competence — clients pay for this depth.',
      fitness: '100 hours: transformation territory — others will ask what changed.',
      creative: '100 hours: professional craft threshold for many disciplines.',
      general: '100 hours: serious life change from steady effort alone.',
    },
  },
  {
    minHours: 270,
    messages: {
      resist: '270 resists — your willpower built a hut. Shelter from old habits.',
      study: '270 hours: near-expert grasp — you could teach this subject.',
      career: '270 hours: senior practitioner range — income follows mastery.',
      fitness: '270 hours: athletic identity — training is who you are now.',
      creative: '270 hours: publish-ready work lives here.',
      general: '270 hours: a monument to patience — Hut unlocked.',
    },
  },
  {
    minHours: 1000,
    messages: {
      resist: '1,000 resists — a fortress of discipline. Distractions bounce off.',
      study: '1,000 hours: expert territory — research-level understanding.',
      career: '1,000 hours: top-tier professional — premium rates are justified.',
      fitness: '1,000 hours: elite consistency — longevity and performance compound.',
      creative: '1,000 hours: mastery path — your voice is unmistakable.',
      general: '1,000 hours: legendary persistence. Your castle proves it.',
    },
  },
];

export function getMilestoneMessage(theme: CategoryTheme, totalHours: number): string {
  let best = MILESTONES[0].messages[theme];
  for (const row of MILESTONES) {
    if (totalHours >= row.minHours) best = row.messages[theme];
  }
  return best;
}

export function getNextMilestoneHours(totalHours: number): number | null {
  for (const row of MILESTONES) {
    if (totalHours < row.minHours) return row.minHours;
  }
  return null;
}
