import { findPost, formatDate, postParams } from "@/lib/posts";
import { postOgImage } from "@/lib/og";
import { categoryNames } from "@/site.config";

// 글마다의 링크 미리보기 이미지 → out/<연도>/<slug>/og.png (글 페이지와 같은 경로 목록으로 빌드 때 만든다)
export const dynamic = "force-static";
export const generateStaticParams = postParams;

export async function GET(_request: Request, { params }: RouteContext<"/[year]/[slug]/og.png">) {
  const { year, slug } = await params;
  const post = findPost(year, slug);
  if (!post) return postOgImage({ title: "", meta: "" }); // 글이 없을 때의 자리용 경로
  const meta = `${categoryNames[post.category] ?? post.category} · ${formatDate(post.date)}`;
  return postOgImage({ title: post.title, meta });
}
