import rehypeCallouts from "rehype-callouts";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import {
  defineCollection,
  defineConfig,
  logger,
  rehypeCopyLinkedFiles,
  s,
  type MarkdownOptions,
} from "velite";
import { decodeImageSrc, encodeImageSrc } from "./lib/rehype-image-src";
import remarkImage from "./lib/remark-image";
import remarkWikilink, { readPosts, resolveWikilinkText } from "./lib/remark-wikilink";
import { categoryNames, seriesNames } from "./site.config";

type RehypePlugin = NonNullable<MarkdownOptions["rehypePlugins"]>[number];

// 글 옆 이미지를 public/static/<이름>-<해시>.<확장자> 로 복사하고 src를 /static/... 으로 바꾼다
const assetOutput = {
  assets: "public/static",
  base: "/static/",
  name: "[name]-[hash:8].[ext]",
  format: "esm",
} as const;

const POSTS_DIR = "content/posts";

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

// description이 없을 때 쓸 자동 발췌. 본문 문단만 모아서 앞 150자를 쓴다 (소제목, 코드, 콜아웃 제외).
// s.excerpt()는 소제목과 코드까지 섞인 텍스트를 그대로 잘라서 따로 만든다.
type TextNode = { type: string; value?: string; children?: TextNode[] };
const EXCERPT_LENGTH = 150;
const excerpt = () =>
  s.custom<string | undefined>().transform((_, { meta }) => {
    const toText = (node: TextNode): string => node.value ?? node.children?.map(toText).join("") ?? "";
    const paragraphs = (meta.mdast?.children ?? []) as TextNode[];
    const raw = paragraphs
      .filter((node) => node.type === "paragraph")
      .map(toText)
      .join(" ");
    // [[slug]]는 본문 링크와 똑같이 대상 글 제목(또는 보일 텍스트)으로 바꾼다
    const text = resolveWikilinkText(raw, readPosts(POSTS_DIR)).replace(/\s+/g, " ").trim();
    if (text.length <= EXCERPT_LENGTH) return text;
    // 단어(어절) 중간에서 자르지 않도록 제한 안의 마지막 공백에서 자른다
    const cut = text.slice(0, EXCERPT_LENGTH + 1);
    return `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd() || cut.slice(0, EXCERPT_LENGTH)}…`;
  });

// YAML에서 공백 뒤의 #은 주석이라, `title: 블로그 만들기 #2`는 "블로그 만들기"로 조용히 잘린다.
// 따옴표 없이 " #"이 들어간 frontmatter 줄을 찾아낸다.
// \s는 줄바꿈까지 포함해서 다음 줄의 # 주석을 잘못 잡으므로 공백/탭([ \t])만 본다
const UNQUOTED_HASH = /^(\w+):[ \t]+(?!["'])[^\n]*[ \t]#/gm;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

const posts = defineCollection({
  name: "Post",
  // content/posts/<연도>/<slug>/<slug>.md 구조만 글로 인정한다.
  // 파일 이름을 폴더 이름과 같게 하는 이유: Obsidian은 [[slug]] 링크를 파일 이름으로 찾고, 이 블로그는 폴더 이름으로 찾는다.
  // 둘을 같게 두면 Obsidian(Folder notes 플러그인, 이름 {{folder_name}})과 사이트에서 같은 글을 가리킨다
  pattern: "posts/*/*/*.md",
  schema: s
    .object({
      title: s.string(),
      description: s.string().optional(), // 없으면 본문 앞부분을 자동 발췌한다
      date: s.isodate(),
      category: s.string().regex(kebab, "category는 영문 kebab-case여야 한다"),
      series: s.string().regex(kebab, "series는 영문 kebab-case여야 한다").optional(),
      seriesOrder: s.number().int().positive().optional(),
      // 파일 위치에서 계산되는 값들 (frontmatter에 적지 않는다)
      path: s.path({ removeIndex: false }), // "posts/2026/content-pipeline/content-pipeline"
      readingTime: readingTime(),
      excerpt: excerpt(),
      content: s.markdown(),
    })
    .transform(({ path, excerpt, ...data }, { addIssue, meta }) => {
      const [, year, slug, fileName] = path.split("/");

      if (fileName !== slug) {
        addIssue({ fatal: true, code: "custom", message: `파일 이름은 폴더 이름과 같아야 한다: ${slug}/${slug}.md (지금은 ${fileName}.md)` });
      }

      const frontmatter = String(meta.value).match(FRONTMATTER)?.[1] ?? "";
      for (const [, key] of frontmatter.matchAll(UNQUOTED_HASH)) {
        addIssue({ fatal: true, code: "custom", message: `${key} 값에 ' #'이 있으면 따옴표로 감싸야 한다 (뒤가 주석으로 잘린다)` });
      }

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

      return { ...data, description: data.description ?? excerpt, year, slug, url: `/${year}/${slug}` };
    }),
});

// 소개 페이지 (/about). content/about.md 파일 하나를 글과 같은 Markdown 파이프라인으로 처리한다.
// content/posts/ 밖에 있어서 글 목록에는 섞이지 않는다
const about = defineCollection({
  name: "About",
  pattern: "about.md",
  single: true,
  schema: s
    .object({
      title: s.string().default("소개"),
      description: s.string().optional(), // 없으면 본문 앞부분을 자동 발췌한다
      excerpt: excerpt(),
      content: s.markdown(),
    })
    .transform(({ excerpt, ...data }) => ({ ...data, description: data.description ?? excerpt })),
});

export default defineConfig({
  root: "content",
  // 검증 실패 시 해당 글만 빠지고 넘어가지 않도록 빌드를 멈춘다.
  // 주의: velite 0.4.0 CLI는 플래그 기본값(false)이 이 값과 output.clean을 덮어쓴다.
  // 그래서 package.json의 build 스크립트에서 --strict --clean을 직접 넘긴다.
  strict: true,
  output: { data: ".velite", ...assetOutput },
  collections: { posts, about },
  markdown: {
    remarkPlugins: [[remarkWikilink, { postsDir: POSTS_DIR }], remarkImage],
    // velite 기본 이미지 복사는 사용자 플러그인보다 먼저 돌아서 %20 경로를 고칠 틈이 없다.
    // 그래서 끄고, 경로 디코딩 → 복사 순서로 직접 넣는다.
    copyLinkedFiles: false,
    rehypePlugins: [
      decodeImageSrc,
      [rehypeCopyLinkedFiles, assetOutput],
      [encodeImageSrc, assetOutput],
      // 소제목에 id를 붙인다 ([[slug#제목]] 링크와 같은 github-slugger 규칙)
      rehypeSlug as RehypePlugin,
      // > [!note] 콜아웃.
      // velite가 unified 타입을 자체 번들에 넣어서 rehype-callouts의 unified 타입과 이름만 다르게 충돌한다.
      // 런타임은 같은 unified 11이라 문제없으므로 velite 쪽 타입으로 맞춰준다.
      rehypeCallouts as RehypePlugin,
      [
        rehypePrettyCode,
        {
          // 라이트/다크 색을 둘 다 CSS 변수(--shiki-light, --shiki-dark)로 넣는다. 전환은 CSS에서 한다
          theme: { light: "github-light", dark: "github-dark" },
          // 배경은 테마 색 대신 디자인 토큰(--field)을 쓴다
          keepBackground: false,
        } satisfies PrettyCodeOptions,
      ],
    ],
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
    for (const series of new Set(posts.flatMap((p) => p.series ?? []))) {
      if (!(series in seriesNames)) {
        logger.warn(`시리즈 '${series}'의 표시 이름이 site.config.ts에 없다`);
      }
    }
  },
});
