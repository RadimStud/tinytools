import type { MetadataRoute } from "next";

// Only public, stable entry pages. Catalog links expose published tool pages.
// Change this host when the new domain is actually connected.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/search", "/community", "/workbench/csv-cleaner"].map(path => ({
    url: `https://tinytools-ten.vercel.app${path}`,
  }));
}
