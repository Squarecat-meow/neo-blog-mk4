import categories from "./content/_config/categories.json";
import series from "./content/_config/series.json";

// 블로그 전역 설정. 이름, 소개 문구, 프로필은 여기서 관리한다 (카테고리/시리즈 이름은 아래 참고)
export const site = {
  name: "새론이의 사계절",
  description: "새론이가 사계절을 보내는 방법",
  url: "https://mina.house", // 끝 슬래시 없음. sitemap, canonical, OG 이미지의 전체 주소에 쓴다
} as const;

export type ProfileLink = {
  kind: "github" | "email" | "link"; // 아이콘 종류
  label: string; // 화면에 보일 이름
  href: string; // 이메일은 "mailto:주소"
};

// 홈 사이드바 프로필. 자세한 소개는 /about 페이지에 쓴다.
export const profile: {
  name: string;
  bio: string;
  // 프로필 사진. 정사각형 사진이면 zoom 1, position "50% 50%"로 두면 된다.
  // 큰 그림의 일부만 쓰려면 zoom(확대 배율)과 position(보일 위치, CSS background-position)으로 자른다.
  // 사진 파일은 public/에 둔다 (예: public/profile.webp → src "/profile.webp"). 표시 크기가 최대 112px이라 224px 정도면 충분하다.
  avatar: { src: string; zoom: number; position: string };
  links: ProfileLink[]; // 비워 두면 링크 줄이 나오지 않는다
} = {
  name: "정새론",
  bio: "<head>와 <body>로 이루어진 사람",
  avatar: { src: "/profile.jpg", zoom: 1, position: "50% 50%" },
  links: [
    {
      kind: "github",
      label: "GitHub",
      href: "https://github.com/Squarecat-meow",
    },
    { kind: "link", label: "미스키", href: "https://serafuku.moe/@Yozumina" },
  ],
};

// 카테고리와 시리즈의 slug → 화면 표시 이름은 Obsidian vault 안의 JSON 파일에서 관리한다.
// Obsidian 글 템플릿(content/_templates/post.md)도 같은 파일을 읽어 목록에서 고르게 하므로, 목록이 한 곳에만 있다.
// 이름이 _로 시작하는 폴더라 글로 빌드되지 않는다. 여기에 없는 slug가 글에 나오면 빌드 때 경고만 띄운다.
export const categoryNames: Record<string, string> = categories;
export const seriesNames: Record<string, string> = series;
