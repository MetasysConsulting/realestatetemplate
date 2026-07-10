"use client";

import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { useChatbot } from "@/hooks/admin/useChatbot";
import { useFancyboxChatGallery } from "@/hooks/admin/useFancyboxChatGallery";
import { ChatbotHeader } from "@/components/admin/chatbot/chatbot-header";
import { ChatMessagesPanel } from "@/components/admin/chatbot/chat-messages-panel";
import { ChatbotInputSection } from "@/components/admin/chatbot/chatbot-input-section";

const Chatbot = () => {
  const chatbot = useChatbot()
  useFancyboxChatGallery(chatbot.messages)

  return (
    <div className={`flex flex-col ${chatbot.isFullscreen ? "fixed inset-0 z-50 bg-slate-950 min-h-screen overflow-hidden" : ""}`}>
      <ChatbotHeader chatbot={chatbot} />
      <ChatMessagesPanel chatbot={chatbot} />
      <ChatbotInputSection chatbot={chatbot} />
      <div className="fixed bottom-0 left-0 right-0 h-30 z-1 bg-slate-900/5 backdrop-blur-3xl" />
    </div>
  )
}

export default Chatbot
