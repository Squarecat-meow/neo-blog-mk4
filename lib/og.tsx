import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/site.config";

// OG 이미지(링크 미리보기 카드) 공통. 빌드 때 한 번 PNG로 만들어진다.
// - 이미지 생성기(satori)는 woff2와 webp를 읽지 못해서 assets/에 TTF 폰트와 JPEG 배경을 따로 둔다.
// - 받는 쪽 테마를 알 수 없으므로 라이트 색만 쓴다 (AGENTS.md 6장 색 토큰의 라이트 값).

export const ogSize = { width: 1200, height: 630 };

const color = {
  paper: "#fdfcfa",
  ink: "#231c16",
  accent: "#f28c1a",
  accentText: "#b8520a",
  muted: "#6a6e62",
};

const asset = (path: string) => readFile(join(process.cwd(), "assets", path));
const dataUrl = async (path: string) => `data:image/jpeg;base64,${(await asset(path)).toString("base64")}`;

// 고운 바탕 Bold 하나만 쓴다 (원본 TTF 하나가 8MB라 굵기 하나만 저장소에 둔다)
async function render(element: React.ReactElement) {
  return new ImageResponse(element, {
    ...ogSize,
    fonts: [{ name: "Gowun Batang", data: await asset("fonts/GowunBatang-Bold.ttf"), weight: 700, style: "normal" }],
  });
}

// 글: 글 페이지처럼 숲 그림 위 가운데에 반투명 종이를 깔고 메타, 제목, 블로그 이름을 놓는다
export async function postOgImage({ title, meta }: { title: string; meta: string }) {
  const background = await dataUrl("og/article-forest.jpg");
  return render(
    <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", fontFamily: "Gowun Batang" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori는 next/image를 쓸 수 없다 */}
      <img src={background} alt="" width={ogSize.width} height={ogSize.height} style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 800,
          padding: "52px 64px",
          background: "rgba(253, 252, 250, 0.93)",
          borderRadius: 14,
        }}
      >
        <div style={{ fontSize: 26, color: color.muted }}>{meta}</div>
        {/* 제목은 최대 3줄, 넘치면 말줄임표. satori는 display: block일 때만 lineClamp를 적용한다 */}
        <div
          style={{
            display: "block",
            marginTop: 18,
            fontSize: 58,
            lineHeight: 1.3,
            color: color.ink,
            wordBreak: "keep-all",
            lineClamp: 3,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 36, gap: 18 }}>
          <div style={{ width: 56, height: 5, borderRadius: 3, background: color.accent }} />
          <div style={{ fontSize: 28, color: color.accentText }}>{site.name}</div>
        </div>
      </div>
    </div>,
  );
}

// 홈/소개: 히어로처럼 숲과 캐릭터 위에 블로그 이름과 부제목을 놓는다 (히어로의 .hero-heading 위치를 630 높이로 환산)
export async function siteOgImage() {
  const background = await dataUrl("og/hero.jpg");
  const glow = `0 0 6px ${color.paper}, 0 0 14px ${color.paper}, 0 0 24px ${color.paper}`;
  return render(
    <div style={{ display: "flex", width: "100%", height: "100%", justifyContent: "center", fontFamily: "Gowun Batang" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori는 next/image를 쓸 수 없다 */}
      <img src={background} alt="" width={ogSize.width} height={ogSize.height} style={{ position: "absolute", inset: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, color: color.ink, textShadow: glow }}>
        <div style={{ fontSize: 66 }}>{site.name}</div>
        <div style={{ marginTop: 10, fontSize: 26 }}>{site.description}</div>
      </div>
    </div>,
  );
}
