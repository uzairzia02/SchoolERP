import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gemini, GEMINI_MODEL } from "@/lib/gemini";
import { studentTools, executeStudentTool } from "@/features/chatbot/student-tools";

const SYSTEM_INSTRUCTION = `You are a helpful school assistant for a student using ScholarSync, a school management system.
You can answer questions about the student's attendance, grades, assignments, exams, fees, and announcements by calling the provided tools.
Always call a tool to get real data before answering — never guess or make up numbers.
Keep answers concise, friendly, and in the same language style the student uses (English or casual Hinglish/Urdu-English mix are both fine).
If a question is unrelated to school data (e.g. general knowledge), politely say you can only help with school-related questions.`;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "This assistant is currently only available to students" },
      { status: 403 }
    );
  }

  const { message, history } = (await req.json()) as {
    message: string;
    history: ChatMessage[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Build conversation contents from prior turns + new user message
  const contents = [
    ...history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  try {
    let response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: studentTools,
      },
    });

    // Function-calling loop — Gemini may request multiple tool calls
    // before producing a final text answer.
    let loopGuard = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && loopGuard < 5) {
      loopGuard++;

      const functionCall = response.functionCalls[0];
      const result = await executeStudentTool(functionCall.name ?? "");

      // Append the model's function-call turn and our function-response turn
      contents.push({
        role: "model",
        parts: [{ functionCall: { name: functionCall.name, args: functionCall.args } }],
      } as any);
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response: { result },
            },
          },
        ],
      } as any);

      response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: studentTools,
        },
      });
    }

    const reply = response.text ?? "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
