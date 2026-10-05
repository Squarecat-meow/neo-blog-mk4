"use client";

import Link from "next/link";
import { useState } from "react";

export type PostListItem = {
  url: string;
  title: string;
  date: string; // ISO (UTC 자정)
  year: string;
  category: string;
};

type Props = {
  posts: PostListItem[]; // 최신 글이 먼저 오도록 정렬된 상태로 받는다
  categories: { slug: string; name: string; count: number }[];
};

// date는 UTC 자정으로 저장돼 있어서 UTC 기준으로 읽어야 하루가 밀리지 않는다
const monthDay = (iso: string) => iso.slice(5, 10).replace("-", ".");

// 카테고리 칩 + 연도별 목차. 필터는 정적 사이트라 브라우저에서만 처리한다
export default function PostList({ posts, categories }: Props) {
  const [selected, setSelected] = useState("all");
  const names = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

  const visible = selected === "all" ? posts : posts.filter((p) => p.category === selected);
  const years = [...new Set(visible.map((p) => p.year))];

  // 카테고리 버튼: 선택된 것에 형광펜 띠가 그어진다 (모양은 globals.css의 .highlight-chip)
  const chip = (slug: string, label: string, count?: number) => (
    <button
      key={slug}
      type="button"
      aria-pressed={selected === slug}
      onClick={() => setSelected(slug)}
      className="highlight-chip"
    >
      {label}
      {count != null && <span className="ml-1 text-[0.8em] text-muted">{count}</span>}
    </button>
  );

  return (
    <>
      <div className="mt-[14px] mb-1.5 flex flex-wrap gap-x-5 gap-y-2" role="group" aria-label="카테고리">
        {chip("all", "전체")}
        {categories.map((c) => chip(c.slug, c.name, c.count))}
      </div>

      {visible.length === 0 && <p className="py-6 text-muted">아직 글이 없어요.</p>}

      {years.map((year) => (
        <section key={year} className="mt-[30px] grid grid-cols-1 gap-x-4 sm:grid-cols-[110px_1fr]">
          <h2 className="mt-2.5 font-display text-4xl leading-[1.2]">{year}</h2>
          <ol>
            {visible
              .filter((p) => p.year === year)
              .map((p) => (
                <li key={p.url} className="border-t border-line last:border-b">
                  <Link
                    href={p.url}
                    className="group grid grid-cols-[48px_1fr] items-baseline gap-x-3.5 py-3.5 no-underline sm:grid-cols-[52px_1fr_auto]"
                  >
                    <time dateTime={p.date.slice(0, 10)} className="text-[15px] text-muted tabular-nums">
                      {monthDay(p.date)}
                    </time>
                    <span className="font-display text-[22px] leading-[1.35] decoration-accent decoration-2 underline-offset-[5px] group-hover:text-accent-text group-hover:underline group-focus-visible:text-accent-text group-focus-visible:underline sm:text-2xl">
                      {p.title}
                    </span>
                    <span className="col-start-2 text-sm text-muted sm:col-start-auto">{names[p.category] ?? p.category}</span>
                  </Link>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </>
  );
}
