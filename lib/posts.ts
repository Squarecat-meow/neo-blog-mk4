import { posts, type Post } from "#site/content";

export type { Post };

// 최신 글이 먼저
export const postsByDate = [...posts].sort((a, b) => b.date.localeCompare(a.date));

// 글 페이지와 OG 이미지가 함께 쓰는 정적 경로 목록.
// output: export는 빈 배열이면 빌드를 실패시킨다. 글이 하나도 없을 때만 자리용 경로를 넘기고,
// 글을 못 찾으므로 404로 렌더된다 (out/0000/_.html이 생기지만 링크되지 않는다)
export function postParams() {
  const params = postsByDate.map((p) => ({ year: p.year, slug: p.slug }));
  return params.length > 0 ? params : [{ year: "0000", slug: "_" }];
}

export function findPost(year: string, slug: string) {
  return posts.find((p) => p.year === year && p.slug === slug);
}

// 같은 시리즈의 글을 seriesOrder 순서로
export function seriesPosts(series: string) {
  return posts.filter((p) => p.series === series).sort((a, b) => a.seriesOrder! - b.seriesOrder!);
}

// 이전/다음 글: 시리즈 글이면 시리즈 순서, 아니면 날짜 순서 (AGENTS.md "글 페이지")
export function adjacentPosts(post: Post) {
  const list = post.series ? seriesPosts(post.series) : [...postsByDate].reverse(); // 오래된 글 → 최신 글
  const i = list.findIndex((p) => p.url === post.url);
  return { prev: list[i - 1], next: list[i + 1] };
}

// date는 UTC 자정으로 저장돼 있어서 UTC 기준으로 읽어야 하루가 밀리지 않는다
export const formatDate = (iso: string) => iso.slice(0, 10).replaceAll("-", ".");
