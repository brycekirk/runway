/**
 * Pre-aggregated peer benchmarks from the Alberta sample (Apr–Jun 2026).
 * Controllable categories only — housing is intentionally omitted (PM review).
 */
export type CohortBenchmark = {
  label: string;
  /** Match recurring expense names (case-insensitive substring). */
  nameHints: string[];
  median: number;
  sampleSize: number;
  region: string;
};

export const COHORT_REGION = "Calgary";

/** Calgary peer medians for controllable recurring spend. */
export const CONTROLLABLE_BENCHMARKS: CohortBenchmark[] = [
  {
    label: "phone plan",
    nameHints: ["phone", "mobile", "cell"],
    median: 64,
    sampleSize: 123,
    region: COHORT_REGION,
  },
  {
    label: "streaming / subscription",
    nameHints: ["stream", "netflix", "spotify", "disney", "crave", "youtube", "subscription"],
    median: 14.99,
    sampleSize: 51,
    region: COHORT_REGION,
  },
];
