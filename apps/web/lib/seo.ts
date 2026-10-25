import type { Metadata } from "next"

import { getI18n, type MessageKey } from "./i18n"

/** Localised title/description plus a canonical URL for a static page. */
export async function pageMetadata(
  path: string,
  titleKey: MessageKey,
  descriptionKey: MessageKey
): Promise<Metadata> {
  const { t } = await getI18n()
  return metadataFor(path, t(titleKey), t(descriptionKey))
}

export function metadataFor(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
  }
}
