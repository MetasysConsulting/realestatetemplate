"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, StopCircle, X, Globe, Sparkles, Code2, Image as ImageIcon, FileText, File, Plus, Trash2 } from "lucide-react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import Voice from "./voice";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ")

// Custom Divider with gradient effect
const CustomDivider: React.FC = () => (
  <div className="relative h-6 w-[1.5px] mx-1">
    <div className="absolute inset-0 rounded-full"
      style={{
        background: "linear-gradient(to top, transparent, #7126DD 50%, transparent)",
        clipPath: "polygon(0% 0%, 100% 0%, 100% 40%, 140% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -40% 50%, 0% 40%)",
        opacity: 0.7
      }}
    />
  </div>
)

// Voice Recording Modal Component
interface VoiceRecordingModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (transcript: string) => void
}

const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [recordingTime, setRecordingTime] = React.useState(0)
  const [transcript, setTranscript] = React.useState("")
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setRecordingTime(0)
      setTranscript("")
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Simulate transcription after 2 seconds
      setTimeout(() => {
        setTranscript("This is a voice transcription example...")
      }, 2000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isOpen])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSend = () => {
    if (transcript.trim()) {
      onSend(transcript)
      onClose()
    }
  }

  const handleDelete = () => {
    setTranscript("")
    setRecordingTime(0)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full p-0 overflow-hidden ">
        <DialogTitle className="sr-only">Voice Recording</DialogTitle>

        <div className="flex flex-col items-center justify-center  space-y-8 ">
          <div className="relative w-full h-[360px] flex items-center justify-center">
            <Voice />
          </div>
          {/* Timer */}
          <div className="text-center space-y-2 mt-8">
            <div className="flex items-center justify-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-3xl font-mono font-bold text-white">
                {formatTime(recordingTime)}
              </span>
            </div>
            <p className="text-slate-400 text-sm">Recording in progress...</p>
          </div>


          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <Button onClick={handleDelete} variant="destructive" size="lg" className="rounded-full">
              <Trash2 className="h-5 w-5" /> Delete
            </Button>

            <Button onClick={onClose} variant="outline" size="lg" className="rounded-full" >
              <StopCircle className="h-5 w-5" /> Stop
            </Button>

            {transcript && (
              <Button onClick={handleSend} size="lg" className="rounded-full bg-linear-to-br from-primary to-sidebar-primary hover:from-primary/90 hover:to-sidebar-primary/90 text-white">
                <Send className="h-5 w-5" /> Send
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Mode Toggle Button Component
interface ModeToggleProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
  color: string
}

const ModeToggle: React.FC<ModeToggleProps> = ({
  icon,
  label,
  isActive,
  onClick,
  color,
}) => (
  <button type="button" onClick={onClick}
    className={cn(
      "rounded-full transition-all flex items-center gap-1.5 px-2.5 py-1.5 border h-8",
      isActive
        ? ""
        : "bg-transparent border-transparent text-white/50 hover:text-slate-300 hover:bg-slate-800/50"
    )}
    style={
      isActive
        ? {
          backgroundColor: `${color}20`,
          borderColor: color,
          color: color,
        }
        : undefined
    }
  >
    <div className="w-5 h-5 flex items-center justify-center shrink-0">
      <motion.div animate={{ rotate: isActive ? 360 : 0, scale: isActive ? 1.1 : 1 }}
        whileHover={{
          rotate: isActive ? 360 : 15,
          scale: 1.1,
          transition: { type: "spring", stiffness: 300, damping: 10 },
        }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
      >
        {icon}
      </motion.div>
    </div>
    <AnimatePresence>
      {isActive && (
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs overflow-hidden whitespace-nowrap shrink-0"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
)

// Main PromptInputBox Component
interface PromptInputBoxProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string, files?: File[]) => void
  onFocus?: () => void
  isLoading?: boolean
  placeholder?: string
  className?: string
}

export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>(
  ({ value, onChange, onSend, onFocus, isLoading = false, placeholder = "Ask anything...", className }, ref) => {
    const [files, setFiles] = useState<File[]>([])
    const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({})
    const [showVoiceModal, setShowVoiceModal] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showThink, setShowThink] = useState(false)
    const [showCode, setShowCode] = useState(false)

    const imageInputRef = useRef<HTMLInputElement>(null)
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
      }
    }, [])

    React.useEffect(() => {
      adjustTextareaHeight()
    }, [value, adjustTextareaHeight])

    const isImageFile = (file: File) => file.type.startsWith("image/")
    const isPdfFile = (file: File) => file.type === "application/pdf"

    const processFile = (file: File, fileType?: "image" | "pdf" | "file") => {
      // Validate file type if specified
      if (fileType === "image" && !isImageFile(file)) {
        return
      }
      if (fileType === "pdf" && !isPdfFile(file)) {
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        return
      }

      // Add file to existing files instead of replacing
      setFiles(prev => [...prev, file])

      // Only create preview for images
      if (isImageFile(file)) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreviews(prev => ({
            ...prev,
            [file.name]: e.target?.result as string
          }))
        }
        reader.readAsDataURL(file)
      }
    }

    const processMultipleFiles = (fileList: File[], fileType?: "image" | "pdf" | "file") => {
      fileList.forEach(file => processFile(file, fileType))
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        processMultipleFiles(droppedFiles)
      }
    }, [])

    // Detect if pasted text is code
    const detectCodeLanguage = (text: string): string | null => {
      // Check for common code patterns
      const patterns = {
        javascript: /\b(const|let|var|function|=>|console\.log|import|export|class)\b/,
        typescript: /\b(interface|type|enum|namespace|as\s+\w+|:\s*\w+\s*[=;])\b/,
        python: /\b(def|class|import|from|print|if __name__|self\.)\b/,
        java: /\b(public|private|protected|class|void|static|new\s+\w+\()\b/,
        cpp: /\b(#include|std::|cout|cin|namespace|template<)\b/,
        csharp: /\b(using|namespace|public|private|class|void|var\s+\w+\s*=)\b/,
        html: /<\/?[a-z][\s\S]*>/i,
        css: /\{[\s\S]*:[^:]+;[\s\S]*\}/,
        sql: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|JOIN)\b/i,
        json: /^\s*[\[{][\s\S]*[}\]]\s*$/,
        jsx: /<[A-Z]\w*[\s\S]*>[\s\S]*<\/[A-Z]\w*>/,
        php: /<\?php|function\s+\w+\s*\(|\$\w+\s*=/,
        ruby: /\b(def|class|module|require|puts|end)\b/,
        go: /\b(func|package|import|type|struct|interface)\b/,
        rust: /\b(fn|let|mut|impl|struct|enum|use)\b/,
        swift: /\b(func|var|let|class|struct|enum|import)\b/,
      }

      // Check if text has multiple lines and code-like structure
      const lines = text.split('\n')
      const hasMultipleLines = lines.length > 2
      const hasIndentation = lines.some(line => line.startsWith('  ') || line.startsWith('\t'))
      const hasBraces = /[{}\[\]()]/.test(text)
      const hasSemicolons = text.includes(';')

      // If it looks like code structure
      if (hasMultipleLines && (hasIndentation || hasBraces || hasSemicolons)) {
        // Try to detect language
        for (const [lang, pattern] of Object.entries(patterns)) {
          if (pattern.test(text)) {
            return lang
          }
        }
        // Default to javascript if no specific language detected but looks like code
        return 'javascript'
      }

      return null
    }

    // Handle paste from clipboard
    const handlePaste = useCallback((e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []
      let pastedText = ''

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            imageFiles.push(file)
          }
        } else if (items[i].type === 'text/plain') {
          items[i].getAsString((text) => {
            pastedText = text
          })
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault()
        processMultipleFiles(imageFiles, "image")
        return
      }

      // Check if pasted text is code
      setTimeout(() => {
        if (pastedText) {
          const detectedLanguage = detectCodeLanguage(pastedText)

          if (detectedLanguage) {
            e.preventDefault()

            // Wrap in code block
            const codeBlock = `\`\`\`${detectedLanguage}\n${pastedText}\n\`\`\``

            // Insert at cursor position
            const textarea = textareaRef.current
            if (textarea) {
              const start = textarea.selectionStart
              const end = textarea.selectionEnd
              const currentValue = value
              const newValue = currentValue.substring(0, start) + codeBlock + currentValue.substring(end)
              onChange(newValue)

              // Set cursor position after code block
              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + codeBlock.length
                textarea.focus()
              }, 0)
            } else {
              // If no textarea ref, just append
              onChange(value + (value ? '\n\n' : '') + codeBlock)
            }
          }
        }
      }, 0)
    }, [value, onChange])

    // Add paste event listener (DOM API expects Event; narrow to ClipboardEvent inside)
    React.useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const onPasteEvent = (event: Event) => {
        if (event instanceof ClipboardEvent) {
          handlePaste(event)
        }
      }

      container.addEventListener("paste", onPasteEvent)
      return () => {
        container.removeEventListener("paste", onPasteEvent)
      }
    }, [handlePaste])

    const handleRemoveFile = (index: number) => {
      const fileToRemove = files[index]
      setFiles(prev => prev.filter((_, i) => i !== index))

      if (fileToRemove && filePreviews[fileToRemove.name]) {
        setFilePreviews(prev => {
          const newPreviews = { ...prev }
          delete newPreviews[fileToRemove.name]
          return newPreviews
        })
      }
    }

    const handleSubmit = () => {
      if ((value.trim() || files.length > 0) && !isLoading) {
        let messagePrefix = ""
        if (showSearch) messagePrefix = "[Search] "
        else if (showThink) messagePrefix = "[Think] "
        else if (showCode) messagePrefix = "[Code] "

        const formattedInput = messagePrefix + value
        onSend(formattedInput, files)
        onChange("")
        setFiles([])
        setFilePreviews({})
        setShowSearch(false)
        setShowThink(false)
        setShowCode(false)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    }

    const hasContent = value.trim() !== "" || files.length > 0

    const handleVoiceSend = (transcript: string) => {
      onChange(transcript)
      // Auto-send after a short delay
      setTimeout(() => {
        if (transcript.trim()) {
          onSend(transcript, files)
          onChange("")
          setFiles([])
          setFilePreviews({})
        }
      }, 100)
    }

    return (
      <>
        <VoiceRecordingModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} onSend={handleVoiceSend}/>

        <div
          ref={(node) => {
            containerRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          className={cn(
            "rounded-3xl border transition-all duration-300 cursor-text",
            "border-primary/30 bg-slate-800/40 backdrop-blur-xl hover:border-primary/50 shadow-[0_8px_30px_rgba(113,38,221,0.15)]",
            className
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={(e) => {
            // Focus textarea when container is clicked (but not when clicking buttons)
            const target = e.target as HTMLElement
            if (!target.closest('button') && !target.closest('[role="button"]')) {
              textareaRef.current?.focus()
            }
          }}
          tabIndex={0}
        >
          {/* File Preview */}
          {files.length > 0 && (
            <div className="p-3 border-b border-primary/20">
              <div className="flex gap-2">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    {/* Image Preview */}
                    {file.type.startsWith("image/") && filePreviews[file.name] ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-colors">
                        <img src={filePreviews[file.name]} alt={file.name} className="h-full w-full object-cover"/>
                        <button onClick={() => handleRemoveFile(index)} className="absolute -top-1 -right-1 rounded-full bg-linear-to-br from-red-500 to-red-600 p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      /* PDF/File Preview */
                      <div className="flex items-center gap-2 p-2 pr-8 rounded-lg bg-slate-900/50 border border-primary/20 hover:border-primary/40 transition-colors">
                        {file.type === "application/pdf" ? (
                          <FileText className="h-5 w-5 text-sidebar-primary" />
                        ) : (
                          <File className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <p className="text-xs font-medium text-slate-300 max-w-[100px] truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => handleRemoveFile(index)} className="absolute top-1 right-1 rounded-full bg-linear-to-br from-red-500 to-red-600 p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex flex-col px-3 py-2.5">
            <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} onFocus={onFocus}
              placeholder={
                showSearch
                  ? "Search the web..."
                  : showThink
                    ? "Think deeply..."
                    : showCode
                      ? "Write code..."
                      : placeholder
              }
              disabled={isLoading}
              className={cn(
                "w-full bg-transparent border-0 outline-none text-slate-200 placeholder:text-white/40 text-base resize-none",
                "scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
              )}
              rows={1}
              style={{ maxHeight: "200px" }}
            />

            {/* Actions Row */}
            <div className="flex items-center justify-between gap-2 pt-2">
              {/* Left Actions */}
              <div className="flex items-center gap-1">
                {/* Upload Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-8 w-8 text-white/50 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-primary/10 hover:text-primary hover:scale-110">
                      <Plus className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 ">
                    <DropdownMenuItem onClick={() => imageInputRef.current?.click()} className="hover:bg-primary/10 focus:bg-primary/10">
                      <ImageIcon className="h-4 w-4  text-primary" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-200">Upload Image</span>
                        <span className="text-xs text-white/50">PNG, JPG, GIF</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => pdfInputRef.current?.click()} className="hover:bg-sidebar-primary/10 focus:bg-sidebar-primary/10">
                      <FileText className="h-4 w-4  text-sidebar-primary" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-200">Upload PDF</span>
                        <span className="text-xs text-white/50">Document files</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="hover:bg-primary/10 focus:bg-primary/10">
                      <File className="h-4 w-4  text-primary/70" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-200">Upload File</span>
                        <span className="text-xs text-white/50">Any file type</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                

                {/* Hidden File Inputs */}
                <input ref={imageInputRef} type="file" multiple className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processMultipleFiles(Array.from(e.target.files), "image")
                    }
                    if (e.target) e.target.value = ""
                  }}
                  accept="image/*"
                />
                <input ref={pdfInputRef} type="file" multiple className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processMultipleFiles(Array.from(e.target.files), "pdf")
                    }
                    if (e.target) e.target.value = ""
                  }}
                  accept="application/pdf"
                />
                <input ref={fileInputRef} type="file" multiple className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processMultipleFiles(Array.from(e.target.files), "file")
                    }
                    if (e.target) e.target.value = ""
                  }}
                  accept="*"
                />
                <CustomDivider />

                {/* Mode Toggles */}
                <div className="flex items-center">
                  <ModeToggle icon={<Globe className="w-4 h-4" />} label="Search" isActive={showSearch}
                    onClick={() => {
                      setShowSearch(!showSearch)
                      setShowThink(false)
                      setShowCode(false)
                    }}
                    color="#7126DD"
                  />

                  <CustomDivider />

                  <ModeToggle icon={<Sparkles className="w-4 h-4" />} label="Think" isActive={showThink}
                    onClick={() => {
                      setShowThink(!showThink)
                      setShowSearch(false)
                      setShowCode(false)
                    }}
                    color="#C425E4"
                  />

                  <CustomDivider />

                  <ModeToggle icon={<Code2 className="w-4 h-4" />} label="Code" isActive={showCode}
                    onClick={() => {
                      setShowCode(!showCode)
                      setShowSearch(false)
                      setShowThink(false)
                    }}
                    color="#7126DD"
                  />
                </div>
              </div>

              {/* Right Actions - Send/Voice Button */}
              <Button variant="default" size="icon"
                className={cn(
                  "h-9 w-9 rounded-full transition-all duration-200",
                  hasContent
                    ? "bg-linear-to-br from-primary to-sidebar-primary hover:from-primary/90 hover:to-sidebar-primary/90 text-white shadow-[0_4px_20px_rgba(113,38,221,0.4)] hover:scale-110"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                )}
                onClick={() => {
                  if (hasContent) {
                    handleSubmit()
                  } else {
                    setShowVoiceModal(true)
                  }
                }}
                disabled={isLoading && !hasContent}
              >
                {hasContent ? (
                  <Send className="h-4 w-4" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }
)

PromptInputBox.displayName = "PromptInputBox";
