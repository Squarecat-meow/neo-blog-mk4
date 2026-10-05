"use client";

import { useEffect, useId, useRef, useState } from "react";

// 붓으로 그은 듯한 구분선. 화면에 들어오면 한 번 그어진다 (reduced-motion이면 CSS가 바로 보여준다)
export default function BrushDivider({ seed = 4, d = "M8 13 C120 5 230 21 360 12 S600 6 720 14 S920 19 992 11" }) {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);
  // 한 페이지에 여러 개 있어도 필터 id가 겹치지 않게 한다
  const filterId = `brush-divider-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className="brush-divider mt-[22px] mb-1.5 block h-6 w-full overflow-visible"
      data-in={visible || undefined}
      viewBox="0 0 1000 24"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} filterUnits="userSpaceOnUse" x="-10" y="-20" width="1020" height="64">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.2" numOctaves="2" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <path pathLength={1} d={d} filter={`url(#${filterId})`} />
    </svg>
  );
}
