import Link from "next/link";
import { profile, type ProfileLink } from "@/site.config";

const iconProps = {
  className: "size-4 shrink-0",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

// 링크 종류별 아이콘 (GitHub 로고는 GitHub이 배포하는 마크 모양)
function LinkIcon({ kind }: { kind: ProfileLink["kind"] }) {
  if (kind === "github") {
    return (
      <svg {...iconProps} fill="currentColor">
        <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    );
  }
  if (kind === "email") {
    return (
      <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
      </svg>
    );
  }
  return (
    <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </svg>
  );
}

// 홈 목록 옆의 짧은 프로필. 넓은 화면에서는 목록 왼쪽에 붙어 스크롤을 따라오고,
// 좁은 화면에서는 목록 위에 가로로 놓인다. 자세한 소개는 /about으로 보낸다.
// 내용(이름, 소개, 사진, 링크)은 site.config.ts의 profile에서 바꾼다.
export default function ProfileSidebar() {
  const { name, bio, avatar, links } = profile;

  return (
    <aside aria-label="블로그 쓰는 사람" className="lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center gap-4 lg:flex-col lg:items-start">
        {/* 프로필 사진: avatar 설정대로 확대하고 위치를 맞춰 동그랗게 자른다 (이름이 바로 옆에 있어서 장식으로 둔다) */}
        <div
          aria-hidden="true"
          className="size-[72px] shrink-0 rounded-full border border-line bg-field bg-no-repeat lg:size-[112px]"
          style={{
            backgroundImage: `url(${avatar.src})`,
            backgroundSize: `${avatar.zoom * 100}%`,
            backgroundPosition: avatar.position,
          }}
        />
        <div>
          <p className="font-display text-2xl leading-[1.3]">{name}</p>
          <p className="mt-1 text-[15px] leading-[1.7] text-muted">{bio}</p>

          {links.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 lg:flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    // 외부 사이트는 새 탭으로 연다. 이메일은 메일 앱이 열리므로 그대로 둔다
                    {...(link.kind === "email" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    className="inline-flex items-center gap-1.5 text-[15px] text-ink no-underline hover:text-accent-text"
                  >
                    <LinkIcon kind={link.kind} />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

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
