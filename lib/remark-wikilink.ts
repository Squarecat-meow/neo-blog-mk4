import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { slug as slugify } from "github-slugger";
import { logger } from "velite";
import { parse as parseYaml } from "yaml";

// 글 사이 링크 [[slug]], [[slug|보일 텍스트]], [[slug#제목]] 을 /연도/slug 링크로 바꾸는 remark 플러그인.
// - 보일 텍스트를 안 쓰면 대상 글의 title을 보여준다.
// - #제목은 rehype-slug와 같은 규칙(github-slugger)으로 바꿔서 소제목 id와 맞춘다.
// - 없는 글이면 빌드를 멈추지 않고 경고만 한다. 링크는 /slug 로 남아서 클릭하면 404가 뜬다.
// - ![[...]] 임베드는 지원하지 않는다. 글자 그대로 두고 경고한다.

type Node = { type: string; value?: string; url?: string; children?: Node[] };

type Options = { postsDir: string };

type PostRef = { url: string; title: string };

// 1: "!"(임베드), 2: slug, 3: 제목(# 뒤), 4: 보일 텍스트
const WIKILINK = /(!?)\[\[([^[\]|#]+)(?:#([^[\]|]+))?(?:\|([^[\]]+))?\]\]/g;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

// content/posts/<연도>/<slug>/index.md 를 훑어 slug → { url, title } 맵을 만든다.
// dev 모드에서 새 글이나 바뀐 제목이 바로 반영되도록 파일마다 새로 읽는다 (글 수가 적어서 충분히 가볍다).
export function readPosts(postsDir: string) {
  const posts = new Map<string, PostRef>();
  const dirs = (path: string) =>
    readdirSync(path, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

  for (const year of dirs(postsDir)) {
    for (const slug of dirs(join(postsDir, year))) {
      let title = slug;
      try {
        const source = readFileSync(join(postsDir, year, slug, "index.md"), "utf8");
        const frontmatter = parseYaml(source.match(FRONTMATTER)?.[1] ?? "");
        if (typeof frontmatter?.title === "string") title = frontmatter.title;
      } catch {
        // index.md가 없거나 frontmatter가 깨진 글은 스키마 검증에서 따로 걸린다. 여기서는 slug로 대신한다
      }
      posts.set(slug, { url: `/${year}/${slug}`, title });
    }
  }
  return posts;
}

// [[slug#제목|보일 텍스트]] 하나를 링크 주소와 보일 텍스트로 푼다
function resolve(posts: Map<string, PostRef>, rawSlug: string, heading?: string, label?: string) {
  const slug = rawSlug.trim();
  const post = posts.get(slug);
  const hash = heading ? `#${slugify(heading.trim())}` : "";
  return {
    slug,
    found: post != null,
    url: (post?.url ?? `/${slug}`) + hash,
    text: label?.trim() || post?.title || slug,
  };
}

// 링크 없이 텍스트만 필요할 때 (자동 발췌 등). [[slug]] → 대상 글 제목
export function resolveWikilinkText(value: string, posts: Map<string, PostRef>) {
  return value.replace(WIKILINK, (raw, embed: string, slug: string, heading?: string, label?: string) =>
    embed ? raw : resolve(posts, slug, heading, label).text,
  );
}

// text 노드 하나를 text/link 노드 여러 개로 쪼갠다
function splitText(value: string, posts: Map<string, PostRef>, filePath: string): Node[] {
  const nodes: Node[] = [];
  let last = 0;

  for (const match of value.matchAll(WIKILINK)) {
    const [raw, embed, slug, heading, label] = match;
    const start = match.index;

    if (embed) {
      logger.warn(`${filePath}: ${raw} 임베드는 지원하지 않는다. 표준 문법 ![](경로)를 쓴다`);
      continue;
    }

    const link = resolve(posts, slug, heading, label);
    if (!link.found) logger.warn(`${filePath}: [[${link.slug}]] 글이 없다`);

    if (start > last) nodes.push({ type: "text", value: value.slice(last, start) });
    nodes.push({ type: "link", url: link.url, children: [{ type: "text", value: link.text }] });
    last = start + raw.length;
  }

  if (last === 0) return [{ type: "text", value }];
  if (last < value.length) nodes.push({ type: "text", value: value.slice(last) });
  return nodes;
}

export default function remarkWikilink({ postsDir }: Options) {
  return (tree: Node, file: { path?: string }) => {
    const posts = readPosts(postsDir);
    const filePath = file.path ?? "(unknown)";

    const walk = (node: Node) => {
      // 링크 안에는 링크를 넣을 수 없다. 코드(inlineCode, code)는 text 노드가 아니라서 자동으로 건너뛴다
      if (node.children == null || node.type === "link") return;
      node.children = node.children.flatMap((child) =>
        child.type === "text" && child.value?.includes("[[") ? splitText(child.value, posts, filePath) : [child],
      );
      node.children.forEach(walk);
    };
    walk(tree);
  };
}
