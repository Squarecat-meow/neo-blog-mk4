"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");
const THEME_EVENT = "themechange";

// 지금 화면에 적용된 테마. data-theme이 없으면 OS 설정을 따른다
function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return darkQuery().matches ? "dark" : "light";
}

// 테마는 React 바깥(html의 data-theme, OS 설정)에 있어서 외부 저장소처럼 구독한다
function subscribe(onChange: () => void) {
  const mq = darkQuery();
  mq.addEventListener("change", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function toggleTheme() {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // 저장할 수 없는 환경(사생활 보호 모드 등)에서는 이번 방문에만 적용된다
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function ThemeToggle() {
  // 서버 렌더에서는 테마를 모르므로 "light"로 두고 하이드레이션 후에 맞춘다.
  // 아이콘은 CSS가 data-theme과 OS 설정으로 고르기 때문에 깜빡이지 않는다
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as Theme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "dark"}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper/88 py-1 pr-3.5 pl-2.5 text-[15px] text-ink hover:border-accent"
    >
      <svg
        className="theme-icon-moon size-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg
        className="theme-icon-sun size-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      다크 모드
    </button>
  );
}
