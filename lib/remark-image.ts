import { logger } from "velite";

// 본문 이미지 처리 remark 플러그인.
// - Obsidian 크기 지정 문법 ![설명|300](a.png), ![설명|300x200](a.png) 에서 |숫자 를 떼어 width/height로 바꾼다.
// - alt가 비어 있으면 경고한다 (Obsidian에서 붙여넣으면 alt가 빈 채로 들어간다).

type Node = {
  type: string;
  alt?: string | null;
  url?: string;
  children?: Node[];
  data?: { hProperties?: Record<string, unknown> };
};

// 1: alt, 2: 폭, 3: 높이(선택)
const OBSIDIAN_SIZE = /^(.*?)\s*\|\s*(\d+)(?:x(\d+))?$/;

export default function remarkImage() {
  return (tree: Node, file: { path?: string }) => {
    const walk = (node: Node) => {
      if (node.type === "image") {
        const size = node.alt?.match(OBSIDIAN_SIZE);
        if (size) {
          const [, alt, width, height] = size;
          node.alt = alt;
          node.data = { ...node.data, hProperties: { ...node.data?.hProperties, width, height } };
        }
        if (!node.alt?.trim()) logger.warn(`${file.path}: 이미지 ${node.url}에 alt 텍스트가 없다`);
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
