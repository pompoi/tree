import { z } from "zod";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const DecisionEntrySchema = z.object({
  skillId: z.string(),
  towerLevel: z.number().int().positive(),
  timestamp: z.number(),
});

export const PlayerBuildSchema = z.object({
  slotIndex: z.number().int().min(0),
  name: z.string(),
  unlockedSkillIds: z.array(z.string()),
  decisionLog: z.array(DecisionEntrySchema),
  stats: z.object({
    damage: z.number(),
    movement: z.number(),
    reduction: z.number(),
  }),
  updatedAt: z.number(),
});

export const BuildStoreSchema = z.object({
  activeSlot: z.number().int().min(0),
  builds: z.array(PlayerBuildSchema),
});

// ─── Types derived from schemas ───────────────────────────────────────────────

export type StoredBuildState = z.infer<typeof BuildStoreSchema>;

// ─── Validation helper ────────────────────────────────────────────────────────

/**
 * Validate raw localStorage data against the BuildStoreSchema.
 * Returns the parsed state if valid, null otherwise (triggers graceful reset).
 */
export function validateStoredState(data: unknown): StoredBuildState | null {
  const result = BuildStoreSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}
