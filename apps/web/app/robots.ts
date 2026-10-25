import type { MetadataRoute } from "next"

import { site } from "@/content"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Search result pages and payment callbacks are not useful in an index.
      disallow: ["/search", "/api/", "/propertytax/dues/", "/propertytax/payment/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
