import { env } from "./env";

export const OPENROUTER_MODELS = {
  default: env.OPENROUTER_DEFAULT_MODEL,
  fast: env.OPENROUTER_FAST_MODEL,
  vision: env.OPENROUTER_VISION_MODEL,
};
