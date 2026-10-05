"use client";

import { useEffect, useRef } from "react";

// 홈 히어로: 숲 그림 위에 캐릭터를 올리고, 처음 들어올 때 붓으로 칠하듯 드러낸 뒤 캐릭터만 손그림처럼 떨리게 한다.
// 값은 AGENTS.md 7장(확정 값)을 따른다. 모바일은 세로 구도 그림(forest-mobile.webp)을 쓴다.

type Strokes = { rows: number[]; x0: number; x1: number; start: number; step: number; dur: number; tilt: number };

type Variant = {
  media: string;
  viewBox: string;
  forest: { href: string; width: number; height: number };
  char: { x: number; y: number; size: number };
  // 일렁임: 표시 폭 557px에서 고른 값을 캐릭터 폭(viewBox 단위)에 맞게 환산한 값
  // scale = 0.0081 × 폭, baseFrequency = (4.46, 5.57) / 폭
  wobble: { baseFrequency: string; scale: number };
  forestStrokes: Strokes & { width: number; region: [number, number, number, number] };
  charStrokes: Strokes & { width: number; region: [number, number, number, number] };
};

const CHAR_HREF = "/character.webp";

const VARIANTS = {
  desktop: {
    media: "(width >= 40rem)",
    viewBox: "0 0 1920 1010",
    forest: { href: "/forest.webp", width: 1920, height: 1076 },
    char: { x: 650, y: 389, size: 620 },
    wobble: { baseFrequency: "0.00719 0.00898", scale: 5 },
    forestStrokes: {
      rows: [100, 280, 460, 640, 820, 1000],
      x0: -150, x1: 2070, start: 0.1, step: 0.2, dur: 0.75, tilt: 16,
      width: 250, region: [-300, -100, 2520, 1250],
    },
    charStrokes: {
      rows: [440, 600, 760, 920],
      x0: 560, x1: 1360, start: 1.5, step: 0.16, dur: 0.6, tilt: 12,
      width: 220, region: [500, 300, 900, 800],
    },
  },
  mobile: {
    media: "(width < 40rem)",
    viewBox: "0 0 816 1400",
    forest: { href: "/forest-mobile.webp", width: 816, height: 1456 },
    char: { x: 188, y: 933, size: 440 },
    wobble: { baseFrequency: "0.01014 0.01266", scale: 3.56 },
    forestStrokes: {
      rows: [60, 260, 460, 660, 860, 1060, 1260, 1430],
      x0: -120, x1: 936, start: 0.1, step: 0.16, dur: 0.6, tilt: 16,
      width: 250, region: [-300, -100, 1416, 1700],
    },
    charStrokes: {
      rows: [980, 1100, 1220, 1340],
      x0: 150, x1: 666, start: 1.6, step: 0.16, dur: 0.5, tilt: 10,
      width: 220, region: [100, 880, 620, 600],
    },
  },
} satisfies Record<string, Variant>;

// 좌우로 번갈아 긋는 붓 스트로크. 마지막 스트로크가 끝나는 시각(초)도 돌려준다
function brushStrokes({ rows, x0, x1, start, step, dur, tilt }: Strokes) {
  const paths = rows.map((y, i) => {
    const ltr = i % 2 === 0;
    return {
      d: `M${ltr ? x0 : x1} ${y} L${ltr ? x1 : x0} ${y + (ltr ? tilt : -tilt)}`,
      delay: start + i * step,
    };
  });
  return { paths, end: start + (rows.length - 1) * step + dur };
}

const SAFETY_MS = 7000; // 어떤 이유로든 이 시간 뒤에는 그림이 반드시 보이게 한다
const IMAGE_WAIT_MS = 1200; // 이미지가 늦게 오면 기다리지 않고 칠하기 시작한다
const WOBBLE_FPS_CAP = 15; // 필터 갱신 상한
const WOBBLE_FPS = 9; // 손그림 떨림 속도 (seed가 바뀌는 횟수)
const HEADING_LEAD = 0.3; // 숲 칠하기가 끝나기 이 시간(초) 전에 제목이 나타나기 시작한다

function HeroScene({ name }: { name: keyof typeof VARIANTS }) {
  const v: Variant = VARIANTS[name];
  const forest = brushStrokes(v.forestStrokes);
  const char = brushStrokes(v.charStrokes);
  const id = (s: string) => `hero-${name}-${s}`; // 두 SVG가 한 문서에 있어서 id에 접두사를 붙인다

  const svgRef = useRef<SVGSVGElement>(null);
  const forestImg = useRef<SVGImageElement>(null);
  const charImg = useRef<SVGImageElement>(null);
  const forestGroup = useRef<SVGGElement>(null);
  const charGroup = useRef<SVGGElement>(null);
  const turbulence = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    const svg = svgRef.current!;
    const media = window.matchMedia(v.media);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const unmask = (g: SVGGElement | null) => g?.removeAttribute("mask");
    // 히어로 위 제목/부제목을 나타나게 한다 (효과는 globals.css의 .hero[data-heading-in])
    const showHeading = () => svg.parentElement?.setAttribute("data-heading-in", "");

    // ----- 일렁임 루프: 이 그림이 보이는 중이고, 화면 안에 있고, 탭이 보일 때만 돈다 -----
    let started = false;
    let inView = true;
    let raf = 0;
    let lastFrame = 0;
    let seed = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - lastFrame < 1000 / WOBBLE_FPS_CAP - 1) return;
      lastFrame = t;
      const next = (Math.floor((t / 1000) * WOBBLE_FPS) % 24) + 1;
      if (next !== seed) {
        seed = next;
        turbulence.current?.setAttribute("seed", String(next));
      }
    };
    const syncLoop = () => {
      const want = started && !reduce && media.matches && inView && !document.hidden;
      if (want && !raf) raf = requestAnimationFrame(tick);
      else if (!want && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    // ----- 이미지 불러오기 + 붓 등장 -----
    const start = (animate: boolean) => {
      started = true;
      const imgs = [forestImg.current!, charImg.current!];
      const loaded = Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
        ),
      );
      forestImg.current!.setAttribute("href", v.forest.href);
      charImg.current!.setAttribute("href", CHAR_HREF);

      if (reduce) {
        // 움직임을 줄이는 설정이면 붓 등장도 일렁임도 없이 원본 그림을 그대로 보여준다
        unmask(forestGroup.current);
        unmask(charGroup.current);
        charImg.current!.removeAttribute("filter");
        showHeading();
        return;
      }
      if (!animate) {
        // 처음에 숨어 있던 그림(창 크기를 바꿔서 보이게 된 경우)은 붓 등장 없이 바로 보여준다
        unmask(forestGroup.current);
        unmask(charGroup.current);
        showHeading();
        syncLoop();
        return;
      }
      Promise.race([loaded, new Promise((r) => setTimeout(r, IMAGE_WAIT_MS))]).then(() => {
        requestAnimationFrame(() => svg.setAttribute("data-playing", ""));
        later(() => unmask(forestGroup.current), (forest.end + 0.2) * 1000);
        later(() => unmask(charGroup.current), (char.end + 0.2) * 1000);
        // 숲 칠하기가 거의 끝날 때 제목이 번지듯 나타난다 (캐릭터와 비슷한 때)
        later(showHeading, (forest.end - HEADING_LEAD) * 1000);
      });
      later(() => {
        unmask(forestGroup.current);
        unmask(charGroup.current);
        showHeading();
      }, SAFETY_MS);
      syncLoop();
    };

    const onMediaChange = () => {
      if (media.matches && !started) start(false);
      syncLoop();
    };
    if (media.matches) start(true);
    media.addEventListener("change", onMediaChange);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncLoop();
    });
    io.observe(svg);
    document.addEventListener("visibilitychange", syncLoop);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      media.removeEventListener("change", onMediaChange);
      io.disconnect();
      document.removeEventListener("visibilitychange", syncLoop);
    };
    // 그림 설정은 모듈 상수라서 바뀌지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strokeGroup = (paths: typeof forest.paths, dur: number) =>
    paths.map((p) => (
      <path
        key={p.d}
        className="brush-stroke"
        d={p.d}
        pathLength={1}
        style={{ "--delay": `${p.delay.toFixed(2)}s`, "--dur": `${dur}s` } as React.CSSProperties}
      />
    ));

  const [fx, fy, fw, fh] = v.forestStrokes.region;
  const [cx, cy, cw, ch] = v.charStrokes.region;

  return (
    <svg
      ref={svgRef}
      className="hero-scene"
      data-variant={name}
      viewBox={v.viewBox}
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label="단풍 든 숲길 한가운데에 앉아 노트북으로 작업하는 사람 일러스트"
    >
      <defs>
        <filter id={id("wobble")} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence
            ref={turbulence}
            type="fractalNoise"
            baseFrequency={v.wobble.baseFrequency}
            numOctaves={4}
            seed={3}
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={v.wobble.scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* 붓 스트로크 가장자리를 거칠게 만드는 필터 */}
        <filter id={id("rough-forest")} filterUnits="userSpaceOnUse" x={fx} y={fy} width={fw} height={fh}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={3} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={44} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={id("rough-char")} filterUnits="userSpaceOnUse" x={cx} y={cy} width={cw} height={ch}>
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves={3} seed={11} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={30} xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <mask id={id("mask-forest")} maskUnits="userSpaceOnUse" x={fx} y={fy} width={fw} height={fh}>
          <g fill="none" stroke="#fff" strokeWidth={v.forestStrokes.width} strokeLinecap="round" filter={`url(#${id("rough-forest")})`}>
            {strokeGroup(forest.paths, v.forestStrokes.dur)}
          </g>
        </mask>
        <mask id={id("mask-char")} maskUnits="userSpaceOnUse" x={cx} y={cy} width={cw} height={ch}>
          <g fill="none" stroke="#fff" strokeWidth={v.charStrokes.width} strokeLinecap="round" filter={`url(#${id("rough-char")})`}>
            {strokeGroup(char.paths, v.charStrokes.dur)}
          </g>
        </mask>
      </defs>

      {/* href는 JS가 이 그림이 보일 때만 넣는다 (안 보이는 쪽 그림을 내려받지 않게) */}
      <g ref={forestGroup} mask={`url(#${id("mask-forest")})`}>
        <image ref={forestImg} x={0} y={0} width={v.forest.width} height={v.forest.height} />
      </g>
      <g ref={charGroup} mask={`url(#${id("mask-char")})`}>
        <image
          ref={charImg}
          x={v.char.x}
          y={v.char.y}
          width={v.char.size}
          height={v.char.size}
          filter={`url(#${id("wobble")})`}
        />
      </g>
    </svg>
  );
}

// children(블로그 제목과 부제목)은 그림 위, 캐릭터 머리 위쪽 빈 하늘에 겹쳐 놓는다 (위치는 globals.css의 .hero-heading)
export default function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <div className="hero">
      <HeroScene name="desktop" />
      <HeroScene name="mobile" />
      {children}
    </div>
  );
}
