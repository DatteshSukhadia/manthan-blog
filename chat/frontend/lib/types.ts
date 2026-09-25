export const LEVELS = ["High school", "University", "Working professional"] as const;
export const INTERESTS = ["Artificial intelligence", "Machine learning", "Data engineering", "Fintech", "Medtech", "Quantum computing"] as const;
export type Level = typeof LEVELS[number];
export type VisualType = "concept-map" | "annotated-diagram" | "comparison" | "step-sequence" | "equation" | "code-block" | "caution";
export type Scene = {
  id: string; title: string; narration: string; durationSec: number;
  visualType: VisualType;
  visual: { heading: string; nodes?: string[]; labels?: string[]; steps?: string[]; left?: string; right?: string; equation?: string; code?: string; note?: string };
};
export type Question = { id: string; question: string; type: "choice" | "explain"; options?: string[]; correct?: number; explanation?: string; keywords?: string[] };
export type LessonJSON = { title: string; level: Level; pillar: string; script: string; scenes: Scene[]; quiz: Question[]; practice?: string[]; sourceNote?: string; localNote?: string };
export type Profile = { id: string; name: string; email: string; role: string; level: Level; interests: string[]; bio: string; onboarded: boolean };
export type AttachmentInfo = { filename: string; kind: "notes" | "assignment"; size: number; text: string };
export type LessonRecord = { id: string; title: string; level: Level; pillar: string; watched: boolean; createdAt: string; generator: string; content: LessonJSON; attachments: {filename: string; kind: string; size: number}[] };
export type PathEntry = { id: string; status: string; latestScore: number | null; completedAt: string | null; lesson: LessonRecord };
export type PathData = { goal: string; status: string; firstTopics: string[]; items: PathEntry[] };
