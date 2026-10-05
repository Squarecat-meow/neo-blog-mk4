import { posts } from "#site/content";
import BrushDivider from "@/components/BrushDivider";
import Hero from "@/components/Hero";
import PostList, { type PostListItem } from "@/components/PostList";
import SiteHeader from "@/components/SiteHeader";
import { categoryNames, site } from "@/site.config";

export default function Home() {
  const items: PostListItem[] = [...posts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ url, title, date, year, category }) => ({ url, title, date, year, category }));

  // 칩 순서는 site.config.ts의 카테고리 순서를 따르고, 매핑에 없는 카테고리는 뒤에 붙인다
  const counts = new Map<string, number>();
  for (const p of items) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const order = Object.keys(categoryNames);
  const rank = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length);
  const categories = [...counts.keys()]
    .sort((a, b) => rank(a) - rank(b))
    .map((slug) => ({ slug, name: categoryNames[slug] ?? slug, count: counts.get(slug)! }));

  return (
    <>
      <SiteHeader overlay />
      <main>
        <Hero>
          <div className="hero-heading">
            <h1>{site.name}</h1>
            <p>{site.description}</p>
          </div>
        </Hero>

        <div className="mx-auto max-w-[860px] px-5 pt-4 pb-14">
          <BrushDivider />
          <PostList posts={items} categories={categories} />
        </div>
      </main>
    </>
  );
}
