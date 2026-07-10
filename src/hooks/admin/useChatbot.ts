"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Message } from "@/lib/admin/chatbot-ai";
import { simulateAIResponse } from "@/lib/admin/chatbot-ai";

export function useChatbot() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionMenu, setSelectionMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
  } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showChatLoader, setShowChatLoader] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);
  const attachmentBlobUrlsRef = useRef<Set<string>>(new Set());

  const revokeUrlsForMessages = useCallback((msgs: Message[]) => {
    msgs.forEach((m) => {
      m.attachments?.forEach((a) => {
        if (a.url.startsWith("blob:")) {
          URL.revokeObjectURL(a.url);
          attachmentBlobUrlsRef.current.delete(a.url);
        }
      });
    });
  }, []);

  // Revoke only on unmount. Do NOT depend on [messages] — that would run cleanup on every
  // message update and revoke blobs still shown in the list (broken image previews).
  useEffect(() => {
    return () => {
      attachmentBlobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      attachmentBlobUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputFocused && !showChatLoader && inputBoxRef.current) {
      const textarea = inputBoxRef.current.querySelector("textarea");
      if (textarea) {
        setTimeout(() => textarea.focus(), 100);
      }
    }
  }, [inputFocused, showChatLoader]);

  useEffect(() => {
    const storedPrompt = sessionStorage.getItem("chatbotPrompt");
    if (storedPrompt) {
      setInput(storedPrompt);
      sessionStorage.removeItem("chatbotPrompt");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setSelectionMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handlePromptSelect = (prompt: string) => setInput(prompt);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    revokeUrlsForMessages(messages);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hi! I'm the REOVANA Admin AI. Ask about listings, data feeds, unlock revenue, top markets, or scraper health.",
        timestamp: new Date(),
      },
    ]);
  };

  const handleTextSelection = (messageId: string) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectedText(text);
        setSelectionMenu({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          messageId,
        });
      }
    } else {
      setSelectionMenu(null);
    }
  };

  const handleContextMenu = (e: ReactMouseEvent, messageId: string) => {
    e.preventDefault();
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0) {
      setSelectedText(text);
      setSelectionMenu({ x: e.clientX, y: e.clientY, messageId });
    } else {
      const target = e.currentTarget as HTMLElement;
      setSelectedText(target.textContent || "");
      setSelectionMenu({ x: e.clientX, y: e.clientY, messageId });
    }
  };

  const handleReplyToSelection = () => {
    setInput(`Regarding: "${selectedText}"\n\n`);
    setSelectionMenu(null);
  };

  const handleCopySelection = () => {
    navigator.clipboard.writeText(selectedText);
    setSelectionMenu(null);
  };

  const handleRegenerateFromSelection = async () => {
    setSelectionMenu(null);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const aiResponse: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Here's a regenerated response about "${selectedText}":\n\n${simulateAIResponse(selectedText)}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiResponse]);
    setIsLoading(false);
  };

  const handleReadAloud = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(selectedText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
    setSelectionMenu(null);
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) return;
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) return;
    const updatedMessages = messages
      .slice(0, messageIndex + 1)
      .map((msg) =>
        msg.id === messageId ? { ...msg, content: editingContent.trim() } : msg,
      );
    revokeUrlsForMessages(messages.slice(messageIndex + 1));
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditingContent("");
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const aiResponse: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: simulateAIResponse(editingContent.trim()),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiResponse]);
    setIsLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleCopyUserMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMessageClick = (message: Message) => {
    sessionStorage.setItem(
      `chat-message-${message.id}`,
      JSON.stringify(message),
    );
    router.push(`/admin/chatbot/${message.id}`);
  };

  const handleExportChat = () => {
    const chatText = messages
      .map(
        (msg) =>
          `${msg.role === "user" ? "You" : "REOVANA Admin AI"} (${msg.timestamp.toLocaleString()}):\n${msg.content}\n`,
      )
      .join("\n---\n\n");
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = (message: string, files?: File[]) => {
    setShowChatLoader(false);
    setInputFocused(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
      attachments:
        files && files.length > 0
          ? files.map((f) => {
              const url = URL.createObjectURL(f);
              attachmentBlobUrlsRef.current.add(url);
              const isPdf = f.type === "application/pdf";
              return {
                type: isPdf ? ("pdf" as const) : ("image" as const),
                name: f.name,
                url,
                size: (f.size / 1024).toFixed(1) + " KB",
              };
            })
          : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: simulateAIResponse(message),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
      setShowChatLoader(false);
    }, 1500);
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    copiedId,
    setCopiedId,
    isFullscreen,
    setIsFullscreen,
    selectedText,
    selectionMenu,
    editingMessageId,
    editingContent,
    setEditingContent,
    showChatLoader,
    setShowChatLoader,
    inputFocused,
    setInputFocused,
    messagesEndRef,
    inputBoxRef,
    handlePromptSelect,
    handleCopy,
    handleClearChat,
    handleTextSelection,
    handleContextMenu,
    handleReplyToSelection,
    handleCopySelection,
    handleRegenerateFromSelection,
    handleReadAloud,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleCopyUserMessage,
    handleMessageClick,
    handleExportChat,
    handleSendMessage,
  };
}

export type UseChatbotReturn = ReturnType<typeof useChatbot>;
