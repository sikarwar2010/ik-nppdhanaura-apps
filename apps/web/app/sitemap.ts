import type { MetadataRoute } from "next"

import { site } from "@/content"
import { allPublicPaths } from "@/lib/routes"

export default function sitemap(): MetadataRoute.Sitemap {
  return allPublicPaths().map(({ path, lastModified }) => ({
    url: `${site.url}${path === "/" ? "" : path}`,
    lastModified: lastModified ? new Date(lastModified) : undefined,
    changeFrequency: path.startsWith("/notices") || path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.split("/").length > 2 ? 0.5 : 0.7,
  }))
}
