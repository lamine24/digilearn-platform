import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      if (data.needsHuman) {
        setMessages(prev => [...prev, { role: "system", content: "Un conseiller humain a été notifié. Il vous contactera bientôt." }]);
      }
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    const userMsg = message.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setMessage("");
    sendMutation.mutate({ sessionId, message: userMsg, userId: user?.id });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
          <Card className="shadow-2xl border-border/50">
            <CardHeader className="pb-3 bg-primary text-primary-foreground rounded-t-lg">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5" /> Assistant DigiLearn
              </CardTitle>
              <p className="text-xs text-primary-foreground/70">Posez vos questions sur nos formations</p>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80 p-4" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <Bot className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                    <p>Bonjour ! Comment puis-je vous aider ?</p>
                    <div className="mt-4 space-y-2">
                      {["Quelles formations proposez-vous ?", "Comment s'inscrire ?", "Quels sont les moyens de paiement ?"].map(q => (
                        <button
                          key={q}
                          onClick={() => { setMessage(q); }}
                          className="block w-full text-left text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role !== "user" && (
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.role === "system"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-muted"
                      }`}>
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {sendMutation.isPending && (
                    <div className="flex gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground animate-pulse">
                        En train de réfléchir...
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="text-sm"
                  disabled={sendMutation.isPending}
                />
                <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
