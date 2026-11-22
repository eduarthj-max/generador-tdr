import Anthropic from "@anthropic-ai/sdk";

// Lee ANTHROPIC_API_KEY del entorno.
export const anthropic = new Anthropic();

export const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";

const ESFUERZOS = ["low", "medium", "high", "xhigh", "max"] as const;
type Esfuerzo = (typeof ESFUERZOS)[number];
export const ESFUERZO: Esfuerzo = (ESFUERZOS as readonly string[]).includes(process.env.CLAUDE_EFFORT || "")
  ? (process.env.CLAUDE_EFFORT as Esfuerzo)
  : "high";
