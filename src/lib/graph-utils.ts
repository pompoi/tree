import { SKILLS, SKILL_MAP } from "@/data/skills";

/**
 * Check whether a skill can be unlocked given the current set of unlocked skills.
 * A skill can be unlocked if all of its prerequisites are already unlocked.
 */
export function canUnlock(
  skillId: string,
  unlockedSet: Set<string>
): boolean {
  const skill = SKILL_MAP.get(skillId);
  if (!skill) return false;
  return skill.prerequisites.every((prereqId) => unlockedSet.has(prereqId));
}

/**
 * Check whether a skill can be removed from the current build.
 * A skill can be removed if no currently-unlocked skill depends on it as a prerequisite.
 */
export function canRemove(
  skillId: string,
  unlockedSet: Set<string>
): boolean {
  const dependents = getDependents(skillId);
  return !dependents.some((depId) => unlockedSet.has(depId));
}

/**
 * Return the direct prerequisites for a skill.
 */
export function getPrerequisites(skillId: string): string[] {
  return SKILL_MAP.get(skillId)?.prerequisites ?? [];
}

/**
 * Return all skills that list the given skill as a direct prerequisite.
 */
export function getDependents(skillId: string): string[] {
  return SKILLS.filter((s) => s.prerequisites.includes(skillId)).map(
    (s) => s.id
  );
}
