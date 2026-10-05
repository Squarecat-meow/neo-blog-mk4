// 글 페이지와 소개 페이지의 배경: 화면에 고정된 숲 그림 + 본문 열 뒤 반투명 띠.
// 글은 가운데 빈 하늘 위로 스크롤된다. 모양과 테마 전환 페이드는 globals.css의 .article-backdrop, .article-veil
export default function ArticleBackdrop() {
  return (
    <>
      <div className="article-backdrop" aria-hidden="true" />
      <div className="article-veil" aria-hidden="true" />
    </>
  );
}
