import type { MetadataRoute } from "next";
import { postsByDate } from "@/lib/posts";
import { site } from "@/site.config";

// 빌드 때 out/sitemap.xml로 만들어진다. 주소는 모두 끝 슬래시 없이 (AGENTS.md 3장)
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = postsByDate[0]?.date;
  return [
    { url: site.url, lastModified: latest },
    { url: `${site.url}/about` },
    ...postsByDate.map((p) => ({ url: `${site.url}${p.url}`, lastModified: p.date })),
  ];
}
