"use client";

import { useEffect } from "react";
import { Fancybox, type FancyboxOptions } from "@fancyapps/ui";
import type { Message } from "@/lib/admin/chatbot-ai";

/** Fancybox v6: toolbar/thumbs/infinite live under `Carousel`, not top-level. */
const FANCYBOX_CHAT_OPTIONS: Partial<FancyboxOptions> = {
  Carousel: {
    infinite: true,
    Toolbar: {
      display: {
        left: ["infobar"],
        middle: [],
        right: ["iterateZoom", "slideshow", "fullscreen", "download", "thumbs", "close"],
      },
    },
    Thumbs: { showOnStart: true },
  },
  wheel: "slide",
}

/** Binds Fancybox to image attachments when the message list changes. */
export function useFancyboxChatGallery(messages: Message[]) {
  useEffect(() => {
    try {
      Fancybox?.destroy?.()
    } catch {
      /* noop */
    }

    const timer = setTimeout(() => {
      try {
        Fancybox?.bind?.(`[data-fancybox]`, FANCYBOX_CHAT_OPTIONS)
      } catch (error) {
        console.error("Fancybox initialization error:", error)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      try {
        Fancybox?.destroy?.()
      } catch {
        /* noop */
      }
    }
  }, [messages])
}
