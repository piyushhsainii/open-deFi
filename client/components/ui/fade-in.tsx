"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { JSX } from "react";

type FadeInProps = {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: JSX.ReactNode;
  delay?: number;
};

export function FadeIn({
  as = "div",
  className,
  children,
  delay = 0,
}: FadeInProps) {
  const Comp = as as any;
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const timer = setTimeout(() => setVisible(true), delay);
            observer.unobserve(el);
            return () => clearTimeout(timer);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Comp
      ref={ref}
      className={cn(
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
    >
      {children}
    </Comp>
  );
}
