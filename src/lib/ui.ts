import type { Domain, Grade } from "./types";

export const DOMAIN_COLORS: Record<Domain, string> = {
  TECHNICAL: "rgb(var(--domain-technical))",
  CREATIVE: "rgb(var(--domain-creative))",
  ANALYTICAL: "rgb(var(--domain-analytical))",
  SOCIAL: "rgb(var(--domain-social))",
  STRATEGIC: "rgb(var(--domain-strategic))",
};
export function domainColor(domain:Domain,alpha=1):string{return `rgb(var(--domain-${domain.toLowerCase()}) / ${alpha})`;}

export const GRADE_COLORS: Record<Grade, { border: string; text: string }> = {
  Excellent: { border: "var(--grade-excellent)", text: "var(--grade-excellent)" },
  Good: { border: "var(--grade-good)", text: "var(--grade-good)" },
  Basic: { border: "var(--grade-basic)", text: "var(--grade-basic)" },
  Bad: { border: "var(--grade-bad)", text: "var(--grade-bad)" },
  Fail: { border: "var(--grade-fail)", text: "var(--grade-fail)" },
};

/** No underscores visible anywhere in UI. */
export function display(text: string): string {
  return text.replace(/_/g, " ");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
