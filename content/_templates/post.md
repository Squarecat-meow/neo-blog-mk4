<%*
// 글 템플릿 (Templater 플러그인으로 넣는다. 템플릿 폴더: _templates)
// frontmatter를 스크립트가 만들어 낸다. 템플릿 파일에 frontmatter를 직접 쓰면 Obsidian 속성 편집기가
// {{...}} 같은 값을 YAML로 잘못 읽어 파일을 망가뜨리기 때문이다.
//
// - 카테고리/시리즈 목록은 _config/categories.json, _config/series.json에서 읽는다 (사이트의 site.config.ts도 같은 파일을 읽는다).
//   새 카테고리나 시리즈는 그 JSON에 "slug": "한글 이름"을 한 줄 추가한다.
// - title은 따옴표로 감싸 둔다. 제목에 " #"이 들어가도 잘리지 않는다.
// - date의 연도는 글 폴더 연도와 같아야 한다 (posts/2026/... → 2026). 오늘 날짜가 들어간다.
// - description은 선택이다 (없으면 본문 앞부분을 자동으로 발췌한다).
const readJson = async (path) => JSON.parse(await tp.app.vault.adapter.read(path));
const categories = await readJson("_config/categories.json");
const series = await readJson("_config/series.json");

// 카테고리: 한글 이름으로 고르고 slug가 들어간다. 고르지 않고 닫으면 첫 번째 카테고리
const category =
  (await tp.system.suggester(Object.values(categories), Object.keys(categories), false, "카테고리 선택")) ??
  Object.keys(categories)[0];

// 시리즈: 고르면 그 시리즈에 이미 있는 글의 다음 순서 번호를 기본값으로 묻는다
const NO_SERIES = "";
const seriesSlug = await tp.system.suggester(
  ["(시리즈 아님)", ...Object.values(series)],
  [NO_SERIES, ...Object.keys(series)],
  false,
  "시리즈 선택",
);
let seriesLines = "";
if (seriesSlug) {
  const orders = tp.app.vault
    .getMarkdownFiles()
    .map((file) => tp.app.metadataCache.getFileCache(file)?.frontmatter)
    .filter((fm) => fm?.series === seriesSlug)
    .map((fm) => Number(fm.seriesOrder) || 0);
  const next = String(Math.max(0, ...orders) + 1);
  const order = (await tp.system.prompt("시리즈 순서 (숫자)", next)) || next;
  seriesLines = `series: ${seriesSlug}\nseriesOrder: ${order}\n`;
}

tR += `---\ntitle: ""\ndate: ${tp.date.now("YYYY-MM-DD")}\ncategory: ${category}\n${seriesLines}---\n\n`;
%>
