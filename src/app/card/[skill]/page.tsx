import { SKILLS, SKILL_MAP } from "@/data/skills";
import { HEX_PATTERN_MAP } from "@/data/hex-patterns";
import { HexCardFull } from "@/components/hex-card/HexCardFull";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface CardPageProps {
  params: Promise<{ skill: string }>;
}

export default async function CardPage({ params }: CardPageProps) {
  const { skill: skillId } = await params;
  const skill = SKILL_MAP.get(skillId);
  const pattern = HEX_PATTERN_MAP.get(skillId);

  if (!skill || !pattern) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-gray-950 flex flex-col items-center justify-center p-4 overflow-auto">
      <nav className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          &larr; Back to Tree
        </Link>
      </nav>
      <HexCardFull skill={skill} pattern={pattern} animate />
      <p className="mt-4 text-[10px] text-white/30 text-center">
        {skill.name} &middot; {skill.branch.toUpperCase()} &middot; Tier{" "}
        {skill.tier}
      </p>
    </main>
  );
}

export async function generateMetadata({
  params,
}: CardPageProps): Promise<Metadata> {
  const { skill: skillId } = await params;
  const skill = SKILL_MAP.get(skillId);
  return {
    title: skill
      ? `${skill.name} — Yomi Tower`
      : "Skill Card — Yomi Tower",
  };
}

export function generateStaticParams() {
  return SKILLS.map((s) => ({ skill: s.id }));
}
