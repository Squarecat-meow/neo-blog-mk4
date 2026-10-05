import type { Metadata } from "next";
import { site } from "@/site.config";

// 링크 미리보기 이미지 (app/og.png, app/[year]/[slug]/og.png 라우트가 빌드 때 만든다)
export const ogImage = (path: string, alt: string) => [{ url: path, width: 1200, height: 630, alt, type: "image/png" }];

// 모든 페이지에 공통인 Open Graph 값. 하위 페이지가 openGraph를 지정하면 부모 값과 합쳐지지 않고 통째로 바뀌므로,
// 글 페이지 등에서는 이 값을 펼쳐 넣고 필요한 것만 덮어쓴다
export const siteOpenGraph = {
  siteName: site.name,
  locale: "ko_KR",
  type: "website",
  images: ogImage("/og.png", `${site.name}: ${site.description}`),
} satisfies Metadata["openGraph"];
