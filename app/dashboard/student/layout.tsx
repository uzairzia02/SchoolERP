import { ChatWidget } from "@/components/chatbot/chat-widget";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
