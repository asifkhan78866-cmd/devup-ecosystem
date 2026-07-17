"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { api } from "@/lib/api/client";

interface ChatBoxProps {
  contact: {
    id: string; // The user ID of the contact
    name: string;
    avatarUrl?: string;
  };
  onClose: () => void;
}

export default function ChatBox({ contact, onClose }: ChatBoxProps) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!session?.access_token) return;
    try {
      const res = await api.get(`/api/messages/${contact.id}`);
      setMessages(res as any[]);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [contact.id, session]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !session?.access_token) return;
    
    setSending(true);
    try {
      const res = await api.post(`/api/messages/${contact.id}`, {
        content: newMessage
      });
      setMessages((prev) => [...prev, res]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-screen w-full md:w-[400px] bg-[#0a0a0a] border-l border-white/10 z-[100] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-[#111]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center">
              {contact.avatarUrl ? (
                <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#c8f135] font-bold">{contact.name?.[0] || 'U'}</span>
              )}
            </div>
            <div>
              <h3 className="text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>{contact.name}</h3>
              <p className="text-xs text-[#a1a1a1]">Connected Founder</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#a1a1a1] hover:text-white transition-colors rounded-full hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#0a0a0a]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[#a1a1a1]">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-[#a1a1a1]" />
              </div>
              <p className="text-[#a1a1a1] text-sm max-w-[250px]">
                No messages yet. Send a message to start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMine = msg.senderId === session?.user?.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-[15px] ${
                      isMine 
                        ? 'bg-[#c8f135] text-black rounded-tr-sm' 
                        : 'bg-[#1a1a1a] text-white rounded-tl-sm'
                    }`}
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-[#6b6b6b] mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#111] border-t border-white/10 shrink-0">
          <div className="flex gap-2">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Type a message..."
              className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-full px-5 py-3 text-white text-sm outline-none focus:border-[#c8f135]/50 transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="w-12 h-12 shrink-0 bg-[#c8f135] text-black rounded-full flex items-center justify-center hover:bg-[#b0d829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
