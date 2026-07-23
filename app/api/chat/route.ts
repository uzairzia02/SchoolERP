import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gemini, GEMINI_MODEL } from "@/lib/gemini";
import { studentTools, executeStudentTool } from "@/features/chatbot/student-tools";
import { teacherTools, executeTeacherTool } from "@/features/chatbot/teacher-tools";
import { superAdminTools, executeSuperAdminTool } from "@/features/chatbot/superadmin-tools";



const TEACHING_ROLES = ["TEACHER", "FACULTY"];

const STUDENT_SYSTEM_INSTRUCTION = `You are a helpful school assistant for a student using ScholarSync, a school management system.
You can answer questions about the student's attendance, grades, assignments, exams, fees, and announcements by calling the provided tools.
Always call a tool to get real data before answering — never guess or make up numbers.
Keep answers concise, friendly, and in the same language style the student uses (English or casual Hinglish/Urdu-English mix are both fine).
If a question is unrelated to school data (e.g. general knowledge), politely say you can only help with school-related questions.`;

const TEACHER_SYSTEM_INSTRUCTION = `You are a helpful school assistant for a teacher using ScholarSync, a school management system.
You can answer questions about the teacher's own timetable, their classes' attendance, their assignments and submissions, and exam results for classes they teach — by calling the provided tools.
Always call a tool to get real data before answering — never guess or make up numbers or student names.
If the teacher asks about a class/section, and you don't already know its exact name, call get_my_classes first to see what they teach.
A teacher can only see data for classes they actually teach — if a tool returns an error saying they don't teach that class, tell them clearly instead of guessing.
For questions about general school policy that aren't covered by any tool (e.g. leave rules, grading rules not in the system), say you don't have that specific info on hand and suggest checking with the school admin — don't invent policy details.
Keep answers concise, professional, and in the same language style the teacher uses (English or casual Hinglish/Urdu-English mix are both fine).
If a question is unrelated to school data (e.g. general knowledge), politely say you can only help with school-related questions.`;

const SUPER_ADMIN_SYSTEM_INSTRUCTION = `You are a helpful school assistant for a super admin using ScholarSync, a school management system.
You have access to the whole school's data: overall stats, student and teacher records, fees, admissions, and pending leave requests — by calling the provided tools.
Always call a tool to get real data before answering — never guess or make up numbers, names, or amounts.
When asked about a specific student or teacher, use the search tools — if multiple people could match, ask which one they mean rather than guessing.
For questions about general school policy that aren't covered by any tool, say you don't have that specific info on hand rather than inventing it.
Keep answers concise and professional, and in the same language style the admin uses (English or casual Hinglish/Urdu-English mix are both fine).
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

  const isTeacher = TEACHING_ROLES.includes(session.user.role);
  const isStudent = session.user.role === "STUDENT";
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isTeacher && !isStudent && !isSuperAdmin) {
    return NextResponse.json(
      { error: "This assistant is currently only available to students, teachers, and admins" },
      { status: 403 }
    );
  }

  const SYSTEM_INSTRUCTION = isSuperAdmin
    ? SUPER_ADMIN_SYSTEM_INSTRUCTION
    : isTeacher
    ? TEACHER_SYSTEM_INSTRUCTION
    : STUDENT_SYSTEM_INSTRUCTION;
  const tools = isSuperAdmin ? superAdminTools : isTeacher ? teacherTools : studentTools;
  const executeTool = isSuperAdmin
    ? (fnName: string, fnArgs: Record<string, unknown>) => executeSuperAdminTool(fnName, fnArgs)
    : isTeacher
    ? (fnName: string, fnArgs: Record<string, unknown>) => executeTeacherTool(fnName, fnArgs)
    : (fnName: string) => executeStudentTool(fnName);

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
        tools,
      },
    });

    // Function-calling loop — Gemini may request multiple tool calls
    // before producing a final text answer.
    let loopGuard = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && loopGuard < 5) {
      loopGuard++;

      const functionCall = response.functionCalls[0];
      const result = await executeTool(functionCall.name ?? "", (functionCall.args ?? {}) as Record<string, unknown>);

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
          tools,
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