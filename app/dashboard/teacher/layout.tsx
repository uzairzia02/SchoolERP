import { ChatWidget } from "@/components/chatbot/chat-widget";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget greeting="Hi! I'm your school assistant. Ask me about your classes, attendance, assignments, submissions, or exam results." />
    </>
  );
}