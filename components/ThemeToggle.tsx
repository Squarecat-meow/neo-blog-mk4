"use client";

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

// 버튼은 "바꿀 테마"를 보여준다: 라이트일 때 "다크 모드", 다크일 때 "라이트 모드".
// 서버 렌더에서는 테마를 모르므로 두 쪽을 다 그려 두고 CSS(.when-light / .when-dark)가 하나만 보여준다.
// 그래서 첫 화면에서 문구가 깜빡이지 않고, 숨은 쪽(display: none)은 스크린 리더도 읽지 않는다.
export default function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper/88 py-1 pr-3.5 pl-2.5 text-[15px] text-ink hover:border-accent"
    >
      <span className="when-light items-center gap-2">
        <svg
          className="size-[18px]"
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
        다크 모드
      </span>
      <span className="when-dark items-center gap-2">
        <svg
          className="size-[18px]"
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
        라이트 모드
      </span>
    </button>
  );
}
