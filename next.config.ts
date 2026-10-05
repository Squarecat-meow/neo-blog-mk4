import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 완전 정적 사이트: 서버 런타임 없이 out/ 에 HTML을 뽑는다
  output: "export",
  // URL은 /2026/<slug> 처럼 끝 슬래시 없이 통일한다
  trailingSlash: false,
  images: {
    // 정적 export에서는 기본 이미지 최적화 로더가 동작하지 않는다 (AGENTS.md "5. 이미지")
    unoptimized: true,
  },
};

export default nextConfig;
