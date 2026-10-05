import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBackdrop from "@/components/ArticleBackdrop";
import BrushDivider from "@/components/BrushDivider";
import SiteHeader from "@/components/SiteHeader";
import { adjacentPosts, findPost, formatDate, postParams, seriesPosts, type Post } from "@/lib/posts";
import { ogImage, siteOpenGraph } from "@/lib/seo";
import { categoryNames, seriesNames } from "@/site.config";

// 정적 export: 모든 글 주소를 빌드 때 확정하고, 그 밖의 주소는 404
export const dynamicParams = false;

export const generateStaticParams = postParams;

export async function generateMetadata({ params }: PageProps<"/[year]/[slug]">): Promise<Metadata> {
  const { year, slug } = await params;
  const post = findPost(year, slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: post.url },
    openGraph: {
      ...siteOpenGraph,
      type: "article",
      url: post.url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      images: ogImage(`${post.url}/og.png`, post.title),
    },
  };
}

export default async function PostPage({ params }: PageProps<"/[year]/[slug]">) {
  const { year, slug } = await params;
  const post = findPost(year, slug);
  if (!post) notFound();

  const { prev, next } = adjacentPosts(post);

  return (
    <>
      <ArticleBackdrop />
      <SiteHeader />
      <main className="mx-auto max-w-[700px] px-5 pb-14">
        <article>
          <Link href="/" className="mt-2 inline-block text-muted no-underline hover:text-accent-text">
            ← 목록으로
          </Link>
          <p className="mt-6 mb-1 text-[15px] text-muted">
            {categoryNames[post.category] ?? post.category} · <time dateTime={post.date.slice(0, 10)}>{formatDate(post.date)}</time> ·{" "}
            {post.readingTime}분 걸려요
          </p>
          <h1 className="mb-7 font-display text-[clamp(36px,6.4vw,56px)] leading-[1.22] font-bold">{post.title}</h1>

          {post.series && <SeriesBox post={post} />}

          {/* 본문 HTML은 빌드 때 Velite가 만든 것이다 (글쓴이 본인의 Markdown) */}
          <div className="post-prose prose" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        <BrushDivider seed={9} d="M8 11 C150 19 260 5 400 13 S650 20 760 11 S930 7 992 14" />

        <nav aria-label="이전 글, 다음 글" className="mt-2 grid gap-5 sm:grid-cols-2">
          {prev ? <PagerLink post={prev} label="이전 글" /> : <span />}
          {next && <PagerLink post={next} label="다음 글" align="right" />}
        </nav>
      </main>
    </>
  );
}

// 시리즈 목차: 같은 시리즈 글을 순서대로, 지금 글은 링크 없이 표시
function SeriesBox({ post }: { post: Post }) {
  const list = seriesPosts(post.series!);
  return (
    <nav aria-label="시리즈 목차" className="mb-10 rounded-r-xl border-l-4 border-accent bg-field px-5 py-3.5">
      <h2 className="mb-1 font-display text-[21px] leading-[1.4] font-bold">시리즈: {seriesNames[post.series!] ?? post.series}</h2>
      <ol className="list-decimal pl-[1.4em] text-base">
        {list.map((p) =>
          p.url === post.url ? (
            <li key={p.url} aria-current="page" className="py-0.5 text-accent-text">
              {p.title} <span className="text-sm text-muted">(지금 읽는 글)</span>
            </li>
          ) : (
            <li key={p.url} className="py-0.5">
              <Link href={p.url} className="decoration-line underline-offset-[3px] hover:text-accent-text hover:decoration-accent">
                {p.title}
              </Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}

function PagerLink({ post, label, align = "left" }: { post: Post; label: string; align?: "left" | "right" }) {
  return (
    <Link
      href={post.url}
      className={`group block border-t border-line py-3.5 no-underline ${align === "right" ? "sm:text-right" : ""}`}
    >
      <small className="block text-sm text-muted">{label}</small>
      <span className="font-display text-[22px] leading-[1.35] group-hover:text-accent-text">{post.title}</span>
    </Link>
  );
}
