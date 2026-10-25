import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { ServiceIcon } from "@/components/site/icons"
import { PageHeader } from "@/components/site/page-header"
import { LText, Section, SectionHeading } from "@/components/site/primitives"
import { about, departments, site, siteImages } from "@/content"
import { getI18n, tx } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/about", "about.title", "about.lead")

export default async function AboutPage() {
  const { locale, t } = await getI18n()
  const photos = [siteImages.park, siteImages.office]

  return (
    <>
      <PageHeader title={t("about.title")} lead={t("about.lead")} crumbs={[{ label: t("nav.about") }]} />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
          <article>
            <LText as="h2" text={about.title} locale={locale} className="text-2xl font-bold" />
            <div className="prose-civic mt-5">
              {about.intro.map((p, i) => (
                <LText key={i} as="p" text={p} locale={locale} />
              ))}
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <section className="card p-6" aria-labelledby="vision">
                <h3 id="vision" className="text-lg font-bold"><LText text={about.vision.title} locale={locale} /></h3>
                <LText as="p" text={about.vision.body} locale={locale} className="mt-3 leading-relaxed text-ink" />
              </section>
              <section className="card p-6" aria-labelledby="heritage">
                <h3 id="heritage" className="text-lg font-bold"><LText text={about.heritage.title} locale={locale} /></h3>
                <LText as="p" text={about.heritage.body} locale={locale} className="mt-3 leading-relaxed text-ink" />
              </section>
            </div>
          </article>

          <aside className="space-y-4">
            {photos.map((img) => (
              <figure key={img.src} className="card overflow-hidden">
                <div className="relative aspect-[16/10]">
                  <Image src={img.src} alt={tx(img.alt, locale)} fill sizes="(min-width: 1024px) 384px, 100vw" className="object-cover" />
                </div>
                <figcaption className="px-4 py-3 text-sm text-ink-muted">{tx(img.alt, locale)}</figcaption>
              </figure>
            ))}
            <div className="rounded-lg bg-navy-800 p-5 text-white">
              <p className="text-sm text-white/75">{t("label.address")}</p>
              <p className="mt-1 font-medium">{tx(site.contact.address, locale)}</p>
            </div>
          </aside>
        </div>
      </Section>

      <Section labelledBy="responsibilities" tone="white">
        <SectionHeading id="responsibilities" title={t("about.responsibilities")} lead={t("departments.lead")} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <li key={d.slug}>
              <Link href={`/departments#${d.slug}`} className="card-interactive group flex h-full items-center gap-4 p-5">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-ink">
                  <ServiceIcon name={d.icon} className="size-5" />
                </span>
                <LText text={d.name} locale={locale} className="flex-1 font-semibold text-navy-900" />
                <ArrowRight aria-hidden className="size-4 text-ink-muted group-hover:text-teal-ink" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
