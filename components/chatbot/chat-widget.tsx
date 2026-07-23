"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  text: string;
}

interface ChatWidgetProps {
  greeting?: string;
}

export function ChatWidget({ greeting }: ChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text:
        greeting ??
        "Hi! I'm your school assistant. Ask me about your attendance, grades, assignments, exams, or fees.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages, // prior turns, excluding the one just sent (sent separately)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: data.error ?? "Something went wrong." },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Network error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
        aria-label="Toggle chat assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-2.5rem)] h-[500px] max-h-[calc(100vh-8rem)] rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-primary/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">School Assistant</p>
              <p className="text-xs text-muted-foreground">Ask about your school data</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "model" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm max-w-[75%] whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}