"use client";

import { Bot, Copy, Check, Paperclip, FileText, X, CornerDownLeft, RefreshCw, Volume2, Edit2, Save } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import AudioLoader from "@/components/admin/ui/audio-loader";
import { ChatMessageContent } from "@/components/admin/chatbot/chat-message-content";
import type { UseChatbotReturn } from "@/hooks/admin/useChatbot";

interface ChatMessagesPanelProps {
  chatbot: UseChatbotReturn
}

export function ChatMessagesPanel({ chatbot }: ChatMessagesPanelProps) {
  const {
    messages,
    isLoading,
    copiedId,
    setCopiedId,
    editingMessageId,
    editingContent,
    setEditingContent,
    selectionMenu,
    messagesEndRef,
    handleTextSelection,
    handleContextMenu,
    handleReplyToSelection,
    handleCopySelection,
    handleRegenerateFromSelection,
    handleReadAloud,
    handleCopy,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleCopyUserMessage,
    handleMessageClick,
  } = chatbot

  return (
    <div className={`flex-1 overflow-y-auto ${chatbot.isFullscreen ? "min-h-0" : ""}`}>
      <div className={`${messages.length === 0 ? "w-full max-w-4xl  px-4" : "flex-1 p-6 sm:pb-36 space-y-4"}`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div
                className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-primary to-sidebar-primary flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleMessageClick(message)}
                title="Click to view full message"
              >
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            )}

            <div
              className={`group relative ${editingMessageId === message.id ? "w-full max-w-[85%] sm:max-w-[75%] md:max-w-[60%]" : "max-w-[85%] sm:max-w-[75%] md:max-w-[60%]"} ${message.role === "user" ? "order-first" : ""}`}
            >
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? editingMessageId === message.id
                      ? "bg-slate-900/50 border border-primary/30"
                      : "bg-primary text-white hover:bg-primary/90 transition-colors"
                    : "bg-slate-800/60 text-slate-200 border border-primary/20 hover:border-primary/40 transition-colors"
                }`}
                onMouseUp={() => message.role === "assistant" && handleTextSelection(message.id)}
                onContextMenu={(e) => message.role === "assistant" && handleContextMenu(e, message.id)}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {message.attachments.some((att) => att.type === "image") && (
                      <div className="grid grid-cols-2 gap-2">
                        {message.attachments
                          .filter((att) => att.type === "image")
                          .slice(0, 3)
                          .map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              data-fancybox={`gallery-${message.id}`}
                              data-caption={att.name}
                              className={`relative group cursor-pointer block overflow-hidden rounded-lg border border-primary/20 hover:border-primary/40 transition-all ${message.attachments?.filter((a) => a.type === "image").length === 1 ? "col-span-2" : ""}`}
                            >
                              <img src={att.url} alt={att.name} className="w-full h-32 object-cover transition-transform duration-300" />
                            </a>
                          ))}

                        {message.attachments.filter((att) => att.type === "image").length > 3 && (
                          <a
                            href={message.attachments.filter((att) => att.type === "image")[3].url}
                            data-fancybox={`gallery-${message.id}`}
                            data-caption={message.attachments.filter((att) => att.type === "image")[3].name}
                            className="relative group cursor-pointer overflow-hidden rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
                          >
                            <img
                              src={message.attachments.filter((att) => att.type === "image")[3].url}
                              alt={message.attachments.filter((att) => att.type === "image")[3].name}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-colors">
                              <span className="text-white text-2xl font-bold">
                                +{message.attachments.filter((att) => att.type === "image").length - 3}
                              </span>
                            </div>
                          </a>
                        )}

                        {message.attachments
                          .filter((att) => att.type === "image")
                          .slice(4)
                          .map((att, idx) => (
                            <a key={`hidden-${idx}`} href={att.url} data-fancybox={`gallery-${message.id}`} data-caption={att.name} className="hidden" />
                          ))}
                      </div>
                    )}

                    {message.attachments
                      .filter((att) => att.type !== "image")
                      .map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-primary/20">
                          {att.type === "pdf" ? <FileText className="h-8 w-8 text-red-400" /> : <Paperclip className="h-8 w-8 text-white/50" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{att.name}</p>
                            <p className="text-xs text-white/50">{att.size}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {editingMessageId === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full min-h-[60px] max-h-[400px] bg-slate-900/50 border border-primary/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary resize-none overflow-y-auto"
                      autoFocus
                      rows={Math.min(Math.max(editingContent.split("\n").length, 3), 15)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7 px-3 text-xs border-primary/30 text-slate-300 hover:bg-slate-800">
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSaveEdit(message.id)} className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-white">
                        <Save className="h-3 w-3 mr-1" /> Save & Resend
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed select-text">
                    <ChatMessageContent
                      messageId={message.id}
                      content={message.content}
                      copiedId={copiedId}
                      setCopiedId={setCopiedId}
                    />
                  </div>
                )}
              </div>

              {message.role === "assistant" && (
                <div className="absolute -right-8 sm:-right-10 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(message.content, message.id)}
                    className="h-6 w-6 sm:h-7 sm:w-7 text-white/50 hover:text-primary hover:bg-primary/10"
                  >
                    {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}

              {message.role === "user" && editingMessageId !== message.id && (
                <div className="absolute -left-12 sm:-left-16 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditMessage(message.id, message.content)}
                    className="h-6 w-6 sm:h-7 sm:w-7 text-white/50 hover:text-primary hover:bg-primary/10"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopyUserMessage(message.content, message.id)}
                    className="h-6 w-6 sm:h-7 sm:w-7 text-white/50 hover:text-primary hover:bg-primary/10"
                  >
                    {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {selectionMenu && (
          <div
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{ left: `${selectionMenu.x}px`, top: `${selectionMenu.y}px`, transform: "translate(-50%, -8px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900/95 backdrop-blur-sm border border-primary/30 rounded-lg shadow-2xl p-1 flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleReplyToSelection} className="h-8 px-3 text-xs text-slate-300 hover:text-white hover:bg-primary/20">
                <CornerDownLeft className="h-3 w-3 mr-1.5" /> Reply
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCopySelection} className="h-8 px-3 text-xs text-slate-300 hover:text-white hover:bg-primary/20">
                <Copy className="h-3 w-3 mr-1.5" /> Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRegenerateFromSelection} className="h-8 px-3 text-xs text-slate-300 hover:text-white hover:bg-primary/20">
                <RefreshCw className="h-3 w-3 mr-1.5" /> Regenerate
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReadAloud} className="h-8 px-3 text-xs text-slate-300 hover:text-white hover:bg-primary/20">
                <Volume2 className="h-3 w-3 mr-1.5" /> Read
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <AudioLoader />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
