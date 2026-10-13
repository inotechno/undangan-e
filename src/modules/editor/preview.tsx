"use client";

import { useEffect, useRef, useState } from "react";
import {
  InvitationRenderer,
  resolveTheme,
  type InvitationConfig,
  type SectionId,
  type SectionLabels,
  type ThemeTokens,
} from "@/modules/invitation";

const PHONE_WIDTH = 390;

export function PhonePreview({
  config,
  layout,
  defaultTheme,
  defaultSections,
  labels,
}: {
  config: InvitationConfig;
  layout: "full_bleed" | "curtain" | "frame_device" | "slider";
  defaultTheme?: Partial<ThemeTokens>;
  defaultSections?: Partial<Record<SectionId, boolean>>;
  labels?: SectionLabels | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / PHONE_WIDTH));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const theme = resolveTheme(defaultTheme, config.theme);
  const sections = { ...defaultSections, ...config.sections };

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div
        className="relative mx-auto"
        style={{
          width: PHONE_WIDTH * scale,
          height: 720 * scale,
        }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left overflow-hidden rounded-[28px] border-[5px] border-[#111] bg-white shadow-2xl"
          style={{
            width: PHONE_WIDTH,
            height: 720,
            transform: `scale(${scale})`,
          }}
        >
          <div className="h-full w-full overflow-y-auto overscroll-contain">
            <InvitationRenderer
              config={config}
              theme={theme}
              layout={layout}
              sections={sections}
              guest={null}
              wishes={[]}
              mode="preview"
              labels={labels}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
