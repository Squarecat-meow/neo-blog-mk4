import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "소개",
  description: `${site.name}을 쓰는 사람 소개`,
};

// 임시 페이지: 내용은 나중에 채운다
export default function About() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[700px] px-5 pt-10 pb-14">
        <h1 className="font-display text-[clamp(36px,6.4vw,56px)] leading-[1.22]">소개</h1>
        <p className="mt-7 text-[17.5px] leading-[1.95]">아직 준비 중이에요. 곧 채워 둘게요.</p>
      </main>
    </>
  );
}
