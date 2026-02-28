import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { keccak256, toBytes } from "viem";

const SYSTEM_PROMPTS: Record<string, string> = {
    General: "You are a helpful AI assistant.",
    Coding: "You are an expert programmer. Provide clean, working code.",
    Writing: "You are a professional writer. Produce clear, engaging content.",
    Analysis: "You are a data analyst. Provide thorough, insightful analysis.",
    Creative: "You are a creative AI. Generate imaginative, original content.",
    Research: "You are a research assistant. Provide well-sourced, accurate information.",
};

export async function POST(req: NextRequest) {
    try {
        const { prompt, category } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GROQ_API_KEY not configured on server" },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey });
        const systemPrompt = SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.General;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
            max_tokens: 1000,
        });

        const result = completion.choices[0].message.content || "";
        const resultHash = keccak256(toBytes(result));

        return NextResponse.json({ result, resultHash });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "AI execution failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
