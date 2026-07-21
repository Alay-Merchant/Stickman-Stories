import Anthropic from "@anthropic-ai/sdk";

/** A small provider boundary so routes do not need to know about an LLM SDK. */
export interface LLM {
  generate(system: string, user: string, json?: boolean): Promise<string>;
}

export type LLMProvider = "anthropic" | "stub";

const isTruthyEnv = (value: string | undefined) =>
  value === "1" || value?.toLowerCase() === "true";

const selectedProvider = (): LLMProvider => {
  // SMOKE_STUB intentionally wins over a developer's local provider setting so
  // the acceptance check remains network- and key-free.
  if (isTruthyEnv(process.env.SMOKE_STUB)) return "stub";

  const value = (process.env.LLM_PROVIDER ?? "anthropic").trim().toLowerCase();
  if (value === "" || value === "default" || value === "anthropic") {
    return "anthropic";
  }
  if (value === "stub") return "stub";

  throw new Error(
    `Unsupported LLM_PROVIDER \"${process.env.LLM_PROVIDER}\". Use \"anthropic\" (the default) or \"stub\".`,
  );
};

const jsonOnlyInstruction =
  "Return a single valid JSON value only. Do not include Markdown fences, commentary, or a preamble.";

const textFromResponse = (content: Anthropic.ContentBlock[]): string => {
  const text = content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned no text content.");
  }

  return text;
};

export class AnthropicLLM implements LLM {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(options: { apiKey?: string; model?: string } = {}) {
    const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic. Set LLM_PROVIDER=stub (or SMOKE_STUB=1) for a keyless local smoke run.",
      );
    }

    this.client = new Anthropic({ apiKey });
    this.model = options.model ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  }

  async generate(system: string, user: string, json = false): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4_096,
        system: json ? `${system}\n\n${jsonOnlyInstruction}` : system,
        messages: [{ role: "user", content: user }],
      });

      return textFromResponse(response.content);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Anthropic generation failed: ${detail}`);
    }
  }
}

const briefStub = {
  objective: "Make one helpful habit easier by changing the environment around it.",
  audience: "People who want practical, low-friction habit changes.",
  angle: "Design cues and friction instead of relying on willpower.",
  tone: "direct",
  key_ideas: [
    "Make the cue for a good habit obvious.",
    "Add friction to habits you want to reduce.",
    "Shrink the first step until it is easy to begin.",
  ],
  caveats: ["Environment design supports habits; it does not replace every personal constraint."],
  cta: "Choose one small environmental change to make today.",
};

const scriptStub = {
  sections: [
    {
      purpose: "hook",
      narration: "Your environment quietly chooses many of your next actions before willpower gets a vote.",
    },
    {
      purpose: "explain",
      narration: "Make a good habit obvious. Leave your book open or put your running shoes by the door.",
    },
    {
      purpose: "contrast",
      narration: "For a habit you want less of, add friction. Log out or move the distraction to another room.",
    },
    {
      purpose: "recap",
      narration: "Then make the first step tiny. Change one cue today, and let tomorrow's environment help again.",
    },
  ],
};

const storyboardStub = {
  target: "yt_short",
  style_profile: "whiteboard_v1",
  scenes: [
    {
      scene_id: 1,
      duration_seconds: 3,
      narration: "Your environment quietly chooses many of your next actions before willpower gets a vote.",
      on_screen_text: "Design the next action",
      purpose: "hook",
      characters: ["learner"],
      props: ["phone"],
      background: "desk",
      action: "A learner reaches toward a phone on a desk.",
      transition_in: "cut",
      accent: "red",
      claim_kind: "interpretation",
      source_refs: ["source"],
      review_status: "ok",
    },
    {
      scene_id: 2,
      duration_seconds: 3,
      narration: "Make a good habit obvious. Leave your book open or put your running shoes by the door.",
      on_screen_text: "Make the cue obvious",
      purpose: "explain",
      characters: ["learner"],
      props: ["book", "arrow"],
      background: "blank_board",
      action: "The learner points from an open book to a clear next step.",
      transition_in: "marker_wipe",
      accent: "green",
      claim_kind: "general_advice",
      source_refs: ["source"],
      review_status: "ok",
    },
    {
      scene_id: 3,
      duration_seconds: 3,
      narration: "For a habit you want less of, add friction. Log out or move the distraction to another room.",
      on_screen_text: "Add friction",
      purpose: "contrast",
      characters: ["learner"],
      props: ["phone", "arrow"],
      background: "desk",
      action: "The learner moves a phone away from the desk.",
      transition_in: "slide",
      accent: "red",
      claim_kind: "general_advice",
      source_refs: ["source"],
      review_status: "ok",
    },
    {
      scene_id: 4,
      duration_seconds: 3,
      narration: "Then make the first step tiny. Change one cue today, and let tomorrow's environment help again.",
      on_screen_text: "Start tiny today",
      purpose: "recap",
      characters: ["learner"],
      props: ["checkbox", "lightbulb"],
      background: "blank_board",
      action: "The learner checks one small action and celebrates.",
      transition_in: "zoom",
      accent: "yellow",
      claim_kind: "general_advice",
      source_refs: ["source"],
      review_status: "ok",
    },
  ],
};

const packStub = {
  titles: [
    { text: "Your Room Is Choosing Your Habits", angle: "curiosity gap", score: 0.92 },
    { text: "3 Ways to Make Good Habits Easier", angle: "number/list", score: 0.88 },
    { text: "Stop Relying on Willpower", angle: "contrarian", score: 0.84 },
  ],
  description:
    "Make better habits easier by changing the cues and friction in your environment. Try one tiny setup change today.\n\n#habits #productivity #behavior",
  tags: ["habits", "environment design", "productivity", "behavior change", "willpower"],
  thumbnail_copy: "Make habits easier",
};

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Deterministic responses for the acceptance check and offline development.
 * The generator's prompt names its artifact, so matching that wording keeps
 * this adapter independent from route implementation details.
 */
export class StubLLM implements LLM {
  async generate(system: string, user: string, json = false): Promise<string> {
    const prompt = `${system}\n${user}`.toLowerCase();

    if (prompt.includes("editorial brief")) return JSON.stringify(cloneJson(briefStub));
    if (prompt.includes("growth editor") || prompt.includes("thumbnail_copy")) {
      return JSON.stringify(cloneJson(packStub));
    }
    if (prompt.includes("storyboard")) {
      const target = prompt.match(/(?:target\s*[:=]\s*|"target"\s*:\s*")(yt_long|yt_short|reel|tiktok)/i)?.[1];
      const storyboard = cloneJson(storyboardStub);
      if (target) storyboard.target = target.toLowerCase();
      return JSON.stringify(storyboard);
    }
    // Test this after the pack/storyboard cases: both embed a script JSON that
    // contains `sections` when the route fills its prompt template.
    if (prompt.includes("teaching scripts") || prompt.includes('"sections"')) {
      return JSON.stringify(cloneJson(scriptStub));
    }

    if (json) return JSON.stringify({ ok: true });
    return "Stub response: the environment shapes the easiest next action.";
  }
}

/** Creates the configured adapter. A new instance makes testing and overrides simple. */
export const createLLM = (): LLM => {
  switch (selectedProvider()) {
    case "anthropic":
      return new AnthropicLLM();
    case "stub":
      return new StubLLM();
  }
};

/** Backwards-friendly route-facing name. */
export const getLLM = createLLM;
