import type { Metadata } from "next"

import { PolicyPage } from "@/components/site/policy-page"
import { policies } from "@/content/policies"
import { getI18n, tx } from "@/lib/i18n"
import { metadataFor } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n()
  const p = policies.accessibility
  return metadataFor("/accessibility", tx(p.title, locale), tx(p.lead, locale))
}

export default function Page() {
  return <PolicyPage policy="accessibility" />
}
