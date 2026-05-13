"use client";

import { useEffect, useRef, useState } from "react";

export function useAutosave<T>(value: T, onSave: (value: T) => Promise<void>, delay = 1200) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setState("saving");
    const timer = window.setTimeout(async () => {
      try {
        await onSave(value);
        setState("saved");
      } catch {
        setState("error");
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [value, onSave, delay]);

  return state;
}
