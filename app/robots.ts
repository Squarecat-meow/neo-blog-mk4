import type { MetadataRoute } from "next";
import { site } from "@/site.config";

// 빌드 때 out/robots.txt로 만들어진다. 검색엔진에 sitemap 위치를 알려준다
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
