import { ArrowUpRight, Info } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ServiceIcon } from "@/components/site/icons"
import { PageHeader } from "@/components/site/page-header"
import { ActionButton, isExternal, LText, Section } from "@/components/site/primitives"
import { departments, getService, services, site } from "@/content"
import { getI18n, pick, tx } from "@/lib/i18n"
import { metadataFor } from "@/lib/seo"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}
  const { locale } = await getI18n()
  return metadataFor(`/services/${slug}`, tx(service.title, locale), tx(service.summary, locale))
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()
  const { locale, t } = await getI18n()
  const title = pick(service.title, locale)
  const department = departments.find((d) => d.slug === service.department)
  const others = services.filter((s) => s.slug !== service.slug)
  const extLabel = t("label.externalNew")

  return (
    <>
      <PageHeader
        title={title.value}
        titleLang={title.lang !== locale ? title.lang : undefined}
        lead={tx(service.summary, locale)}
        crumbs={[{ label: t("nav.services"), href: "/services" }, { label: title.value }]}
      >
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className={service.mode === "online" ? "badge-teal" : "badge-muted"}>
            {service.mode === "online" ? t("label.online") : t("label.information")}
          </span>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <article>
            <div className="prose-civic">
              {service.description.map((p, i) => (
                <LText key={i} as="p" text={p} locale={locale} />
              ))}
            </div>

            {service.slug === "emergency-contacts" && (
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {site.emergency.map((e) => (
                  <li key={e.numbers[0]} className="card p-4">
                    <LText as="p" text={e.label} locale={locale} className="text-sm text-ink-muted" />
                    <p className="mt-1 flex gap-3 text-2xl font-bold text-navy-900">
                      {e.numbers.map((n) => (
                        <a key={n} href={`tel:${n}`} className="hover:underline">{n}</a>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {service.actions.length > 0 && (
              <section aria-labelledby="how" className="mt-10">
                <h2 id="how" className="text-xl font-bold">{t("services.how")}</h2>
                <ul className="mt-4 space-y-3">
                  {service.actions.map((a, i) => (
                    <li key={a.href} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <LText as="p" text={a.label} locale={locale} className="font-semibold text-navy-900" />
                        {a.provider ? (
                          <p className="mt-1 text-sm text-ink-muted">
                            {t("label.providedBy")}: <LText text={a.provider} locale={locale} />
                          </p>
                        ) : isExternal(a.href) ? (
                          <p className="mt-1 text-sm text-ink-muted">{t("label.external")}</p>
                        ) : null}
                        {isExternal(a.href) && (
                          <p className="mt-1 flex items-center gap-1 text-xs break-all text-ink-muted">
                            <ArrowUpRight aria-hidden className="size-3" />
                            {new URL(a.href).hostname}
                          </p>
                        )}
                      </div>
                      <ActionButton action={a} locale={locale} externalLabel={extLabel} variant={i === 0 ? "primary" : "secondary"} className="shrink-0" />
                    </li>
                  ))}
                </ul>
                {service.actions.some((a) => isExternal(a.href)) && (
                  <p className="mt-4 flex gap-2 text-sm text-ink-muted">
                    <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {locale === "hi"
                      ? "बाहरी पोर्टल उनके संबंधित विभागों द्वारा संचालित हैं। वहाँ दी गई जानकारी और शुल्क उसी पोर्टल पर मान्य हैं।"
                      : "External portals are run by their respective departments. Information and fees shown there apply on that portal."}
                  </p>
                )}
              </section>
            )}
          </article>

          <aside className="space-y-5">
            {department && (
              <div className="card p-5">
                <p className="text-sm text-ink-muted">{t("services.related")}</p>
                <Link href={`/departments#${department.slug}`} className="mt-2 flex items-center gap-3 font-semibold text-navy-900 hover:text-teal-ink">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-ink">
                    <ServiceIcon name={department.icon} className="size-5" />
                  </span>
                  <LText text={department.name} locale={locale} />
                </Link>
              </div>
            )}
            <nav aria-labelledby="other-services" className="card p-5">
              <h2 id="other-services" className="text-sm font-semibold tracking-wider text-ink-muted uppercase">{t("services.other")}</h2>
              <ul className="mt-3 space-y-1">
                {others.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-medium text-navy-800 hover:bg-navy-50">
                      <ServiceIcon name={s.icon} className="size-4 text-teal-ink" />
                      <LText text={s.title} locale={locale} />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </Section>
    </>
  )
}
