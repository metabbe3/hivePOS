"use client";

import { useEffect, useRef, useState } from "react";

/**
 * IntersectionObserver hook that returns `[ref, isVisible]`.
 *
 * - `isVisible` becomes `true` once the observed element enters the viewport
 *   and stays `true` (no re-hide on scroll up).
 * - Respects `prefers-reduced-motion`: reports visible immediately so
 *   content is never stuck at `opacity:0`.
 *
 * Usage:
 *   const [ref, visible] = useScrollReveal();
 *   <div ref={ref} className={visible ? "is-visible" : ""} />
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect reduced-motion: skip observer, show immediately.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
        ...options,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isVisible] as const;
}
