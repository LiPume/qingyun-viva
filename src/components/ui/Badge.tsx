import type { MasteryLevel, Priority, SourceType } from "../../models/dataset";
import { masteryLabel } from "../../lib/training";

const sourceTone: Record<SourceType, string> = {
  "screenshot-verified": "verified",
  "same-school-experience": "experience",
  "official-scope": "official",
  "official-direction": "official",
  "official-current": "official",
  "official-ai-scope": "official",
  "official-style-reference": "reference",
  "predicted-high-probability": "predicted",
  "school-specific": "reference",
  "source-document": "document",
  "web-supplement": "supplement",
  "user-authored": "reference",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge priority priority-${priority.toLowerCase()}`}>{priority} 级</span>;
}

export function SourceBadge({ type, label }: { type: SourceType; label: string }) {
  return <span className={`badge source source-${sourceTone[type]}`}>{label}</span>;
}

export function MasteryBadge({ mastery, due = false }: { mastery: MasteryLevel; due?: boolean }) {
  return <span className={`badge mastery mastery-${mastery}`}>{masteryLabel(mastery)}{due ? " · 到期" : ""}</span>;
}
