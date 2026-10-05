// 상대경로 이미지 src의 URL 인코딩을 velite 이미지 복사(rehypeCopyLinkedFiles) 앞뒤로 맞춰주는 rehype 플러그인 한 쌍.
// Obsidian은 파일명의 공백을 %20으로 넣는데, velite는 인코딩을 풀지 않고 파일을 찾아서 실패한다.
//   decodeImageSrc: 복사 전에 "./a%20b.png" → "./a b.png"
//   encodeImageSrc: 복사 후에 "/static/a b-1234.png" → "/static/a%20b-1234.png"

type Node = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: Node[] };

const isRelative = (src: string) => !/^[a-z][a-z\d+.-]*:|^\/|^#/i.test(src);

function mapImageSrc(tree: Node, test: (src: string) => boolean, map: (src: string) => string) {
  const walk = (node: Node) => {
    const src = node.properties?.src;
    if (node.tagName === "img" && typeof src === "string" && test(src)) node.properties!.src = map(src);
    node.children?.forEach(walk);
  };
  walk(tree);
}

export function decodeImageSrc() {
  return (tree: Node) => mapImageSrc(tree, isRelative, decodeURI);
}

export function encodeImageSrc({ base }: { base: string }) {
  return (tree: Node) => mapImageSrc(tree, (src) => src.startsWith(base), encodeURI);
}
