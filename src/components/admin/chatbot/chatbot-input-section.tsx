"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import ChatLoader from "@/components/admin/ui/chat-loader";
import { PromptInputBox } from "@/components/admin/ui/prompt-input";
import { suggestedPrompts } from "@/lib/admin/chatbot-ai";
import type { UseChatbotReturn } from "@/hooks/admin/useChatbot";

interface ChatbotInputSectionProps {
  chatbot: UseChatbotReturn
}

export function ChatbotInputSection({ chatbot }: ChatbotInputSectionProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    showChatLoader,
    setShowChatLoader,
    inputFocused,
    setInputFocused,
    inputBoxRef,
    handlePromptSelect,
    handleSendMessage,
  } = chatbot

  return (
    <div className={`${messages.length === 0 ? "fixed top-1/2  left-0 right-0" : "fixed bottom-0 left-0 right-0"} p-3 sm:p-6 z-2`}>
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {showChatLoader && messages.length === 0 && !inputFocused && (
            <motion.div
              key="chat-loader"
              initial={{ opacity: 0, y: -30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
              className="mb-6 flex justify-center"
            >
              <div className="mb-20">
                <ChatLoader />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={`input-${inputFocused ? "focused" : "initial"}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: inputFocused ? 0 : 0.2 }}
        >
          <PromptInputBox
            ref={inputBoxRef}
            value={input}
            onChange={setInput}
            onFocus={() => {
              setInputFocused(true)
              setShowChatLoader(false)
            }}
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder="Ask about listings, feeds, or revenue..."
          />
        </motion.div>

        {!input.trim() && messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
            className="mt-4 space-y-2"
          >
            <p className="text-xs text-white/50 text-center mb-3">✨ Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto px-4">
              {suggestedPrompts.map((prompt, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.5 + idx * 0.1 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-full bg-slate-800/60 border-primary/20 text-slate-300 hover:bg-slate-800 hover:border-primary/40 hover:text-white hover:shadow-lg hover:shadow-primary/20"
                    onClick={() => handlePromptSelect(prompt)}
                  >
                    <span className="line-clamp-1">{prompt}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <p className="text-xs text-slate-500 mt-3 text-center px-4">
          <span className="hidden sm:inline">Click + to attach • Use mic for voice • Hover messages to edit/copy</span>
          <span className="sm:hidden">Tap + to attach files</span>
        </p>
      </div>
    </div>
  )
}
