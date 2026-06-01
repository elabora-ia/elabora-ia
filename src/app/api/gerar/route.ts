import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { system, prompt, maxTokens = 8000 } = await req.json();

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: "claude-opus-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    };
    if (system) params.system = system;

    const message = await client.messages.create(params);
    const text = message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return NextResponse.json({ text });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
