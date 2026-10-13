"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  variant?: "up" | "scale" | "left" | "right";
  delay?: number;
  as?: ElementType;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className,
  variant = "up",
  delay = 0,
  as: Tag = "div",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => el.classList.add("reveal-visible"), delay);
          } else {
            el.classList.add("reveal-visible");
          }
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove("reveal-visible");
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, once]);

  const variantClass =
    variant === "scale"
      ? "reveal-scale"
      : variant === "left"
        ? "reveal-left"
        : variant === "right"
          ? "reveal-right"
          : "reveal";

  return (
    <Tag ref={ref} className={cn(variantClass, className)}>
      {children}
    </Tag>
  );
}
