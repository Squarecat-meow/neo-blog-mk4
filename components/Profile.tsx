import { Link as Link2, Mail } from "lucide-react";
import { profile, type ProfileLink } from "@/site.config";

// 프로필 조각: 홈 사이드바와 소개 페이지가 함께 쓴다. 내용은 site.config.ts의 profile에서 바꾼다.

// 링크 종류별 아이콘. 아이콘은 lucide-react를 쓰고, lucide에 없는 GitHub 로고만 직접 그린다
// (lucide 1.x는 브랜드 아이콘을 모두 뺐다. 로고 모양은 GitHub이 배포하는 마크)
function LinkIcon({ kind }: { kind: ProfileLink["kind"] }) {
  if (kind === "github") {
    return (
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    );
  }
  const Icon = kind === "email" ? Mail : Link2;
  return <Icon className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />;
}

// 프로필 사진: avatar 설정대로 확대하고 위치를 맞춰 동그랗게 자른다 (이름이 바로 옆에 있어서 장식으로 둔다)
export function ProfileAvatar({ className = "" }: { className?: string }) {
  const { avatar } = profile;
  return (
    <div
      aria-hidden="true"
      className={`shrink-0 rounded-full border border-line bg-field bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${avatar.src})`,
        backgroundSize: `${avatar.zoom * 100}%`,
        backgroundPosition: avatar.position,
      }}
    />
  );
}

// 외부 링크 목록. 비어 있으면 아무것도 그리지 않는다
export function ProfileLinks({ className = "" }: { className?: string }) {
  if (profile.links.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 ${className}`}>
      {profile.links.map((link) => (
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
  );
}
