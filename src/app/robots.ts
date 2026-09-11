import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/admin", "/superuser", "/auth/", "/login", "/signup"] },
    sitemap: "https://tinytools-ten.vercel.app/sitemap.xml",
  };
}
