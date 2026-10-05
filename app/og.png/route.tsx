import { siteOgImage } from "@/lib/og";

// 홈/소개의 링크 미리보기 이미지 → out/og.png
// opengraph-image 파일 규칙을 쓰면 확장자 없는 파일이 나와서 호스팅에 따라 image/png로 서빙되지 않을 수 있다
export const dynamic = "force-static"; // output: export에서는 빌드 때 만드는 라우트임을 명시해야 한다

export function GET() {
  return siteOgImage();
}
