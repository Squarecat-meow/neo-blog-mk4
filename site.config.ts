// 블로그 전역 설정. 이름, 소개 문구, 카테고리/시리즈 표시 이름은 여기서만 관리한다.
// 이름과 소개 문구는 임시다 (AGENTS.md "1. 프로젝트 개요").
export const site = {
  name: "숲길 노트",
  description: "만들고, 고치고, 적어두는 곳",
} as const;

// 카테고리 slug → 화면 표시 이름. 여기에 없는 slug가 글에 나오면 빌드 때 경고만 띄운다.
export const categoryNames: Record<string, string> = {
  dev: "개발",
};

// 시리즈 slug → 화면 표시 이름
export const seriesNames: Record<string, string> = {
  "blog-build": "블로그 만들기",
};
