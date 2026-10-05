import { readdirSync } from "node:fs";
import { join } from "node:path";
import { logger } from "velite";

// 글 사이 링크 [[slug]], [[slug|보일 텍스트]], [[slug#제목]] 을 /연도/slug 링크로 바꾸는 remark 플러그인.
// - 없는 글이면 빌드를 멈추지 않고 경고만 한다. 링크는 /slug 로 남아서 클릭하면 404가 뜬다.
// - ![[...]] 임베드는 지원하지 않는다. 글자 그대로 두고 경고한다.

type Node = { type: string; value?: string; url?: string; children?: Node[] };

type Options = { postsDir: string };

// 1: "!"(임베드), 2: slug, 3: "#제목", 4: 보일 텍스트
const WIKILINK = /(!?)\[\[([^[\]|#]+)(#[^[\]|]+)?(?:\|([^[\]]+))?\]\]/g;

// content/posts/<연도>/<slug>/ 폴더를 훑어 slug → URL 맵을 만든다.
// dev 모드에서 새 글이 생겨도 반영되도록 파일마다 새로 읽는다 (폴더 목록만 읽어서 가볍다).
function readPostUrls(postsDir: string) {
  const urls = new Map<string, string>();
  const dirs = (path: string) =>
    readdirSync(path, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

  for (const year of dirs(postsDir)) {
    for (const slug of dirs(join(postsDir, year))) urls.set(slug, `/${year}/${slug}`);
  }
  return urls;
}

// text 노드 하나를 text/link 노드 여러 개로 쪼갠다
function splitText(value: string, urls: Map<string, string>, filePath: string): Node[] {
  const nodes: Node[] = [];
  let last = 0;

  for (const match of value.matchAll(WIKILINK)) {
    const [raw, embed, rawSlug, hash = "", label] = match;
    const slug = rawSlug.trim();
    const start = match.index;

    if (embed) {
      logger.warn(`${filePath}: ${raw} 임베드는 지원하지 않는다. 표준 문법 ![](경로)를 쓴다`);
      continue;
    }

    let url = urls.get(slug);
    if (url == null) {
      logger.warn(`${filePath}: [[${slug}]] 글이 없다`);
      url = `/${slug}`;
    }

    if (start > last) nodes.push({ type: "text", value: value.slice(last, start) });
    nodes.push({
      type: "link",
      url: url + hash,
      children: [{ type: "text", value: label?.trim() || slug }],
    });
    last = start + raw.length;
  }

  if (last === 0) return [{ type: "text", value }];
  if (last < value.length) nodes.push({ type: "text", value: value.slice(last) });
  return nodes;
}

export default function remarkWikilink({ postsDir }: Options) {
  return (tree: Node, file: { path?: string }) => {
    const urls = readPostUrls(postsDir);
    const filePath = file.path ?? "(unknown)";

    const walk = (node: Node) => {
      // 링크 안에는 링크를 넣을 수 없다. 코드(inlineCode, code)는 text 노드가 아니라서 자동으로 건너뛴다
      if (node.children == null || node.type === "link") return;
      node.children = node.children.flatMap((child) =>
        child.type === "text" && child.value?.includes("[[") ? splitText(child.value, urls, filePath) : [child],
      );
      node.children.forEach(walk);
    };
    walk(tree);
  };
}
