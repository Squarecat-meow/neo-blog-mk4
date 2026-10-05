import Link from "next/link";
import { site } from "@/site.config";
import ThemeToggle from "./ThemeToggle";

// 홈에서는 히어로 위에 겹치고 다크 모드 토글만 보인다 (블로그 이름은 히어로 아래에 크게 나온다).
// 다른 페이지에서는 일반 헤더로 돌아와 블로그 이름 링크가 보인다.
export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={`mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3.5 ${
        overlay ? "absolute inset-x-0 top-0 z-10" : ""
      }`}
    >
      {overlay ? (
        <span />
      ) : (
        <Link href="/" className="font-display text-[26px] leading-none no-underline">
          {site.name}
        </Link>
      )}
      <ThemeToggle />
    </header>
  );
}
