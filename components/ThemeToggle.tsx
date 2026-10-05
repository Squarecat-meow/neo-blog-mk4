"use client";

import { Moon, Sun } from "lucide-react";

// 지금 화면에 적용된 테마. data-theme이 없으면 OS 설정을 따른다
function currentTheme(): "light" | "dark" {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // 저장할 수 없는 환경(사생활 보호 모드 등)에서는 이번 방문에만 적용된다
  }
}

// 버튼은 "바꿀 테마"의 아이콘만 보여준다: 라이트일 때 달, 다크일 때 해.
// 서버 렌더에서는 테마를 모르므로 두 쪽을 다 그려 두고 CSS(.when-light / .when-dark)가 하나만 보여준다.
// 그래서 첫 화면에서 깜빡이지 않고, 숨은 쪽(display: none)은 스크린 리더도 읽지 않는다.
// 아이콘 둘레의 배경색 번짐(.theme-toggle)은 히어로의 짙은 나무 기둥 위에서도 아이콘이 보이게 한다.
export default function ThemeToggle() {
  return (
    <button type="button" onClick={toggleTheme} className="theme-toggle">
      <span className="when-light">
        <Moon size={24} strokeWidth={1.8} aria-hidden="true" />
        <span className="sr-only">다크 모드로 바꾸기</span>
      </span>
      <span className="when-dark">
        <Sun size={24} strokeWidth={1.8} aria-hidden="true" />
        <span className="sr-only">라이트 모드로 바꾸기</span>
      </span>
    </button>
  );
}
