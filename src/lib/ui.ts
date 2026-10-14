import type { Domain, Grade } from "./types";

export const DOMAIN_COLORS: Record<Domain, string> = {
  TECHNICAL: "#534AB7",
  CREATIVE: "#C85A3A",
  ANALYTICAL: "#3A7BC8",
  SOCIAL: "#1D9E75",
  STRATEGIC: "#C87D2F",
};

export const GRADE_COLORS: Record<Grade, { border: string; text: string }> = {
  Excellent: { border: "#C87D2F", text: "#FFD700" },
  Good: { border: "#1D9E75", text: "#1D9E75" },
  Basic: { border: "#8888A0", text: "#8888A0" },
  Bad: { border: "#C86A2F", text: "#C86A2F" },
  Fail: { border: "#7A2525", text: "#C83A3A" },
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
