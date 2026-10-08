// Obsidian 방식의 유튜브 넣기 ![제목](https://www.youtube.com/watch?v=...)를 사이트에서도 영상으로 보여주는 remark 플러그인.
// 그대로 두면 영상 주소가 <img>로 들어가 깨진 이미지가 된다.
// - watch?v=, youtu.be/, shorts/, embed/ 주소를 알아본다. t=90, t=1m30s 같은 시작 시간도 넘긴다.
// - youtube-nocookie.com으로 넣어서 재생 전에는 유튜브가 방문자 쿠키를 남기지 않게 한다.
// - 대괄호 안 글자는 iframe의 title(스크린 리더용 영상 제목)이 된다.
// - 이미지 처리(remark-image)보다 먼저 돌아야 영상이 "alt 없는 이미지" 경고에 걸리지 않는다.
// 모양(폭 맞춤, 16:9, 쇼츠 9:16)은 globals.css의 .post-prose iframe

type Node = { type: string; url?: string; alt?: string | null; value?: string; children?: Node[] };

type Video = { id: string; start?: number; shorts: boolean };

// 유튜브 영상 ID는 11자 (영문, 숫자, -, _)
const ID = /^[\w-]{11}$/;

function parseYoutube(raw: string): Video | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  const path = url.pathname.split("/").filter(Boolean);

  let id: string | undefined;
  let shorts = false;
  if (host === "youtu.be") id = path[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (path[0] === "watch") id = url.searchParams.get("v") ?? undefined;
    else if (path[0] === "shorts") [id, shorts] = [path[1], true];
    else if (path[0] === "embed" || path[0] === "live") id = path[1];
  }
  if (!id || !ID.test(id)) return null;

  return { id, shorts, start: parseStart(url.searchParams.get("t") ?? url.searchParams.get("start")) };
}

// "90", "90s", "1m30s", "1h2m3s" → 초
function parseStart(value: string | null) {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  const m = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || !m[0]) return undefined;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function iframeHtml({ id, start, shorts }: Video, title: string) {
  const src = `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`;
  return (
    `<iframe class="youtube${shorts ? " youtube-shorts" : ""}" src="${src}" title="${escapeAttr(title)}"` +
    ` loading="lazy" referrerpolicy="strict-origin-when-cross-origin"` +
    ` allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"` +
    ` allowfullscreen></iframe>`
  );
}

export default function remarkYoutube() {
  return (tree: Node) => {
    const walk = (node: Node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        // 문단에 영상 하나만 있으면 문단째 바꿔서 <p> 안에 iframe이 들어가지 않게 한다
        const only = child.type === "paragraph" && child.children?.length === 1 ? child.children[0] : null;
        const target = only?.type === "image" ? only : child.type === "image" ? child : null;
        const video = target?.url ? parseYoutube(target.url) : null;
        if (!target || !video) {
          walk(child);
          return child;
        }
        return { type: "html", value: iframeHtml(video, target.alt?.trim() || "YouTube 동영상") };
      });
    };
    walk(tree);
  };
}
