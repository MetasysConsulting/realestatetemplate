"use client";

import { useEffect } from 'react';
import { usePathname } from "next/navigation";

/**
 * Custom hook to scroll to top when route changes
 * @param {boolean} enabled - Whether to enable scroll to top (default: true)
 * @param {number} top - Scroll position (default: 0)
 * @param {string} behavior - Scroll behavior (default: 'smooth')
 */
const useScrollToTop = (enabled = true, top = 0,) => {
  const pathname = usePathname();

  useEffect(() => {
    if (enabled) {
      window.scrollTo({
        top,
      });
    }
  }, [pathname, enabled, top,]);
};

export default useScrollToTop; 