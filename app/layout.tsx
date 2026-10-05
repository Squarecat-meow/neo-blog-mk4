import type { Metadata } from "next";
import { Gowun_Batang, Gowun_Dodum } from "next/font/google";
import { site } from "@/site.config";
import "./globals.css";

// 디스플레이 폰트 (블로그 이름, 제목, 소제목). globals.css의 --font-display가 이 변수를 쓴다
const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun-batang",
});

// 본문 폰트 (임시). globals.css의 --font-body가 이 변수를 쓴다
const gowun = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gowun",
});

export const metadata: Metadata = {
  // 하위 페이지는 "소개 | 새론이의 사계절"처럼 뒤에 블로그 이름이 붙는다
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
};

// 사용자가 고른 테마가 있으면 첫 페인트 전에 적용한다 (없으면 CSS가 OS 설정을 따른다)
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // 위 스크립트가 data-theme을 바꾸므로 html 속성 불일치 경고를 끈다
    <html lang="ko" className={`${gowunBatang.variable} ${gowun.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
