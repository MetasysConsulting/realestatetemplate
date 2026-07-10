"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageContentProps {
  /** Stable id for React keys (message id) — avoids duplicate keys across messages */
  messageId: string
  content: string
  copiedId: string | null
  setCopiedId: Dispatch<SetStateAction<string | null>>
}

/** Renders assistant/user message body: inline code, links, and fenced code blocks. */
export function ChatMessageContent({ messageId, content, copiedId, setCopiedId }: ChatMessageContentProps) {
  /** Monotonic per-render counter so keys never rely on loop indices alone. */
  let keySeq = 0
  const nextKey = (hint: string) => `${messageId}-k${keySeq++}-${hint}`

  const renderInlineCode = (text: string) => {
    const inlineCodeRegex = /`([^`]+)`/g
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts: ReactNode[] = []

    const codeMatches: Array<{ start: number; end: number; text: string }> = []
    let codeMatch: RegExpExecArray | null
    while ((codeMatch = inlineCodeRegex.exec(text)) !== null) {
      codeMatches.push({
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length,
        text: codeMatch[1],
      })
    }

    inlineCodeRegex.lastIndex = 0
    let currentIndex = 0
    const allMatches: Array<{ type: "code" | "link"; start: number; end: number; text: string; url?: string }> = []

    codeMatches.forEach((match) => allMatches.push({ type: "code", ...match }))

    let urlMatch: RegExpExecArray | null
    while ((urlMatch = urlRegex.exec(text)) !== null) {
      const urlStart = urlMatch.index
      const urlEnd = urlMatch.index + urlMatch[0].length
      const isInsideCode = codeMatches.some((code) => urlStart >= code.start && urlEnd <= code.end)
      if (!isInsideCode) {
        allMatches.push({ type: "link", start: urlStart, end: urlEnd, text: urlMatch[1], url: urlMatch[1] })
      }
    }

    allMatches.sort((a, b) => a.start - b.start)
    allMatches.forEach((match) => {
      if (match.start > currentIndex) parts.push(text.substring(currentIndex, match.start))
      if (match.type === "code") {
        parts.push(
          <code
            key={nextKey(`inline-${match.start}-${match.end}`)}
            className="px-1.5 py-0.5 rounded bg-slate-900/60 border border-primary/20 text-primary font-mono text-xs"
          >
            {match.text}
          </code>
        )
      } else if (match.type === "link") {
        parts.push(
          <a
            key={nextKey(`link-${match.start}-${match.end}`)}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {match.text}
          </a>
        )
      }
      currentIndex = match.end
    })

    if (currentIndex < text.length) parts.push(text.substring(currentIndex))
    return parts.length > 0 ? parts : text
  }

  const codeBlockRegex = /```(\w+)?\s*\n?([\s\S]*?)```/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const currentMatch = match
    if (currentMatch.index > lastIndex) {
      parts.push(
        <span key={nextKey(`text-${lastIndex}-${currentMatch.index}`)} className="whitespace-pre-wrap">
          {renderInlineCode(content.substring(lastIndex, currentMatch.index))}
        </span>
      )
    }
    const language = currentMatch[1] || "javascript"
    const code = currentMatch[2].trim()
    const matchIndex = currentMatch.index
    const codeBlockKey = nextKey(`code-${matchIndex}-${language}`)
    parts.push(
      <div key={codeBlockKey} className="my-3 rounded-lg overflow-hidden border border-primary/20">
        <div className="flex items-center justify-between bg-slate-900/80 px-4 py-2 border-b border-primary/20">
          <span className="text-xs text-white/50 font-mono uppercase">{language}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              void navigator.clipboard.writeText(code)
              setCopiedId(`${codeBlockKey}-copy`)
              setTimeout(() => setCopiedId(null), 2000)
            }}
            className="h-6 px-2 text-xs text-white/50 hover:text-white hover:bg-primary/20"
          >
            {copiedId === `${codeBlockKey}-copy` ? (
              <>
                <Check className="h-3 w-3 mr-1" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </>
            )}
          </Button>
        </div>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "rgba(15, 23, 42, 0.6)",
            fontSize: "0.875rem",
            maxHeight: "400px",
            overflowY: "auto",
          }}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    )
    lastIndex = currentMatch.index + currentMatch[0].length
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={nextKey(`text-tail-${lastIndex}`)} className="whitespace-pre-wrap">
        {renderInlineCode(content.substring(lastIndex))}
      </span>
    )
  }

  return parts.length > 0 ? (
    <>{parts}</>
  ) : (
    <span className="whitespace-pre-wrap">{renderInlineCode(content)}</span>
  )
}
