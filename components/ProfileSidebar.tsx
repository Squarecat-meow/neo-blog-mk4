import Link from "next/link";
import { profile } from "@/site.config";
import { ProfileAvatar, ProfileLinks } from "./Profile";

// 홈 목록 옆의 짧은 프로필. 넓은 화면에서는 목록 왼쪽에 붙어 스크롤을 따라오고,
// 좁은 화면에서는 목록 위에 가로로 놓인다. 자세한 소개는 /about으로 보낸다.
// 내용(이름, 소개, 사진, 링크)은 site.config.ts의 profile에서 바꾼다.
export default function ProfileSidebar() {
  return (
    <aside aria-label="블로그 쓰는 사람" className="lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center gap-4 lg:flex-col lg:items-start">
        <ProfileAvatar className="size-[72px] lg:size-[112px]" />
        <div>
          <p className="font-display text-2xl leading-[1.3]">{profile.name}</p>
          <p className="mt-1 text-[15px] leading-[1.7] text-muted">{profile.bio}</p>
          <ProfileLinks className="mt-2.5 lg:flex-col" />
          <Link
            href="/about"
            className="mt-2.5 inline-block text-[15px] text-accent-text underline decoration-accent underline-offset-[3px] hover:decoration-2"
          >
            더 알아보기 →
          </Link>
        </div>
      </div>
    </aside>
  );
}
