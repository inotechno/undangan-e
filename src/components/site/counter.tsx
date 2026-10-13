"use client";

import { useEffect, useRef, useState } from "react";

interface CounterProps {
  value: string;
  className?: string;
}

export function Counter({ value, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(el);

        const match = value.match(/([\d.,]+)/);
        if (!match) {
          setDisplay(value);
          return;
        }

        const raw = match[1];
        const isDecimal = raw.includes(",");
        const target = parseFloat(
          isDecimal ? raw.replace(",", ".") : raw.replace(/\./g, ""),
        );
        if (Number.isNaN(target)) {
          setDisplay(value);
          return;
        }

        const prefix = value.slice(0, value.indexOf(raw));
        const suffix = value.slice(value.indexOf(raw) + raw.length);
        const duration = 1400;
        const start = performance.now();

        function tick(now: number) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;

          if (isDecimal) {
            setDisplay(
              `${prefix}${current.toFixed(1).replace(".", ",")}${suffix}`,
            );
          } else if (target >= 1000) {
            setDisplay(
              `${prefix}${Math.floor(current).toLocaleString("id-ID")}${suffix}`,
            );
          } else {
            setDisplay(`${prefix}${Math.floor(current)}${suffix}`);
          }

          if (progress < 1) raf = requestAnimationFrame(tick);
        }

        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
