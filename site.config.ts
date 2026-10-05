// 블로그 전역 설정. 이름, 소개 문구, 카테고리/시리즈 표시 이름은 여기서만 관리한다.
export const site = {
  name: "새론이의 사계절",
  description: "새론이가 사계절을 보내는 방법",
} as const;

// 카테고리 slug → 화면 표시 이름. 여기에 없는 slug가 글에 나오면 빌드 때 경고만 띄운다.
export const categoryNames: Record<string, string> = {
  dev: "개발",
};

// 시리즈 slug → 화면 표시 이름
export const seriesNames: Record<string, string> = {
  "blog-build": "블로그 만들기",
};
