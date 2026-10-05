import { defineCollection, defineConfig, logger, s } from "velite";
import remarkWikilink from "./lib/remark-wikilink";
import { categoryNames } from "./site.config";

// 영문 kebab-case (slug, category, series 공통)
const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// 읽는 시간(분). Velite의 s.metadata()는 한글을 세지 않아서(중국어/일본어만 셈) 직접 계산한다.
// 한글은 분당 500자, 영문은 분당 265단어로 잡는다.
const readingTime = () =>
  s.custom<string | undefined>().transform((_, { meta }) => {
    const text = meta.plain ?? "";
    const hangul = text.match(/[가-힣]/g)?.length ?? 0;
    const words = text.match(/[A-Za-z0-9]+/g)?.length ?? 0;
    return Math.max(1, Math.round(hangul / 500 + words / 265));
  });

const posts = defineCollection({
  name: "Post",
  // content/posts/<연도>/<slug>/index.md 구조만 글로 인정한다
  pattern: "posts/*/*/index.md",
  schema: s
    .object({
      title: s.string(),
      date: s.isodate(),
      category: s.string().regex(kebab, "category는 영문 kebab-case여야 한다"),
      series: s.string().regex(kebab, "series는 영문 kebab-case여야 한다").optional(),
      seriesOrder: s.number().int().positive().optional(),
      // 파일 위치에서 계산되는 값들 (frontmatter에 적지 않는다)
      path: s.path(), // "posts/2026/content-pipeline"
      readingTime: readingTime(),
      content: s.markdown(),
    })
    .transform(({ path, ...data }, { addIssue }) => {
      const [, year, slug] = path.split("/");

      if (!kebab.test(slug)) {
        addIssue({ fatal: true, code: "custom", message: `폴더 이름(slug) '${slug}'이 영문 kebab-case가 아니다` });
      }
      // 연도는 폴더 경로가 기준. frontmatter date와 어긋나면 실패시킨다
      const dateYear = data.date.slice(0, 4);
      if (year !== dateYear) {
        addIssue({ fatal: true, code: "custom", message: `폴더 연도 ${year}와 date 연도 ${dateYear}가 다르다` });
      }
      if ((data.series == null) !== (data.seriesOrder == null)) {
        addIssue({ fatal: true, code: "custom", message: "series와 seriesOrder는 함께 적어야 한다" });
      }

      return { ...data, year, slug, url: `/${year}/${slug}` };
    }),
});

export default defineConfig({
  root: "content",
  // 검증 실패 시 해당 글만 빠지고 넘어가지 않도록 빌드를 멈춘다.
  // 주의: velite 0.4.0 CLI는 플래그 기본값(false)이 이 값과 output.clean을 덮어쓴다.
  // 그래서 package.json의 build 스크립트에서 --strict --clean을 직접 넘긴다.
  strict: true,
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
  },
  collections: { posts },
  markdown: {
    remarkPlugins: [[remarkWikilink, { postsDir: "content/posts" }]],
  },
  // 글 하나만 봐서는 알 수 없는, 글들 사이의 규칙을 검사한다
  prepare: ({ posts }) => {
    // slug는 연도와 관계없이 전체에서 유일해야 한다 (wikilink가 이름 기준)
    const bySlug = new Map<string, string>();
    for (const post of posts) {
      const prev = bySlug.get(post.slug);
      if (prev) throw new Error(`slug 중복: '${post.slug}' (${prev}, ${post.url})`);
      bySlug.set(post.slug, post.url);
    }

    // 같은 시리즈 안에서 seriesOrder가 겹치면 순서를 정할 수 없다
    const seriesOrders = new Set<string>();
    for (const post of posts) {
      if (post.series == null) continue;
      const key = `${post.series}#${post.seriesOrder}`;
      if (seriesOrders.has(key)) throw new Error(`시리즈 '${post.series}'에 seriesOrder ${post.seriesOrder}가 중복된다`);
      seriesOrders.add(key);
    }

    // 표시 이름이 없는 카테고리는 오타일 수 있으니 경고만 한다
    for (const category of new Set(posts.map((p) => p.category))) {
      if (!(category in categoryNames)) {
        logger.warn(`카테고리 '${category}'의 표시 이름이 site.config.ts에 없다`);
      }
    }
  },
});
