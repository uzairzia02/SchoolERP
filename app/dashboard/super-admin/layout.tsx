import { ChatWidget } from "@/components/chatbot/chat-widget";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget greeting="Hi! I'm your school assistant. Ask me about school-wide stats, students, teachers, fees, admissions, or pending leave requests." />
    </>
  );
}