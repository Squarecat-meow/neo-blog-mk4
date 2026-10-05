import { about } from "#site/content";
import type { Metadata } from "next";
import ArticleBackdrop from "@/components/ArticleBackdrop";
import { ProfileAvatar, ProfileLinks } from "@/components/Profile";
import SiteHeader from "@/components/SiteHeader";
import { profile } from "@/site.config";

export const metadata: Metadata = {
  title: about.title,
  description: about.description,
};

// 소개 페이지: 위에는 프로필(사이드바와 같은 내용), 아래에는 content/about.md 본문
export default function About() {
  return (
    <>
      <ArticleBackdrop />
      <SiteHeader />
      <main className="mx-auto max-w-[700px] px-5 pt-6 pb-14">
        <article>
          <header className="mb-10 flex items-center gap-5 sm:gap-7">
            <ProfileAvatar className="size-[96px] sm:size-[140px]" />
            <div>
              <h1 className="font-display text-[clamp(32px,5.6vw,48px)] leading-[1.22] font-bold">{profile.name}</h1>
              <p className="mt-1 text-muted">{profile.bio}</p>
              <ProfileLinks className="mt-2" />
            </div>
          </header>

          {/* 본문 HTML은 빌드 때 Velite가 content/about.md로 만든 것이다 */}
          <div className="post-prose prose" dangerouslySetInnerHTML={{ __html: about.content }} />
        </article>
      </main>
    </>
  );
}
