"use client";

import { Button } from "@/components/admin/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/admin/ui/dropdown-menu";
import { Maximize2, Settings, Trash2, Download, Share2, X } from "lucide-react";
import type { UseChatbotReturn } from "@/hooks/admin/useChatbot";

interface ChatbotHeaderProps {
  chatbot: UseChatbotReturn
}

export function ChatbotHeader({ chatbot }: ChatbotHeaderProps) {
  const { messages, isFullscreen, setIsFullscreen, handleExportChat, handleClearChat } = chatbot

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0 ${isFullscreen ? "p-6" : ""}`}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">REOVANA Admin AI</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">Ask about listings, feeds, unlocks, and site performance</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="border-primary/30 text-slate-300 hover:bg-primary/10 hover:border-primary">
          {isFullscreen ? <X className="h-4 w-4 " /> : <Maximize2 className="h-4 w-4 " />}
          <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-primary/30 text-slate-300 hover:bg-primary/10 hover:border-primary">
              <Settings className="h-4 w-4 " />
              <span className="hidden sm:inline">Options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExportChat}>
              <Download className="h-4 w-4 " /> Export Chat
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigator.share?.({ title: "REOVANA Admin AI", text: messages.map((m) => m.content).join("\n") }).catch(() => {})
              }
            >
              <Share2 className="h-4 w-4 " /> Share Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearChat} variant="destructive">
              <Trash2 className="h-4 w-4  text-destructive" /> Clear Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
