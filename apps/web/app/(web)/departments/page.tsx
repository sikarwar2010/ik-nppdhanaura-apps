import { ServiceIcon } from "@/components/site/icons"
import { PageHeader } from "@/components/site/page-header"
import { LText, Section, SmartLink } from "@/components/site/primitives"
import { departments } from "@/content"
import { getI18n } from "@/lib/i18n"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = () => pageMetadata("/departments", "departments.title", "departments.lead")

export default async function DepartmentsPage() {
  const { locale, t } = await getI18n()

  return (
    <>
      <PageHeader
        title={t("departments.title")}
        lead={t("departments.lead")}
        crumbs={[{ label: t("nav.administration"), href: "/administration" }, { label: t("nav.departments") }]}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
          <nav aria-label={t("label.inThisSection")} className="hidden lg:block">
            <ol className="sticky top-20 space-y-1 border-l-2 border-line">
              {departments.map((d, i) => (
                <li key={d.slug}>
                  <a href={`#${d.slug}`} className="-ml-0.5 block border-l-2 border-transparent py-2 pl-4 text-sm font-medium text-ink-muted hover:border-teal-600 hover:text-navy-800">
                    {i + 1}. <LText text={d.name} locale={locale} />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <ol className="space-y-5">
            {departments.map((d, i) => (
              <li key={d.slug} id={d.slug} className="card scroll-mt-24 p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-white">
                    <ServiceIcon name={d.icon} className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="eyebrow">{String(i + 1).padStart(2, "0")}</p>
                    <h2 className="text-xl font-bold"><LText text={d.name} locale={locale} /></h2>
                  </div>
                </div>
                <LText as="p" text={d.description} locale={locale} className="prose-civic mt-4" />
                <ul className="mt-5 flex flex-wrap gap-3">
                  {d.links.map((l) => (
                    <li key={l.href}>
                      <SmartLink href={l.href} externalLabel={t("label.externalNew")} className="btn-secondary">
                        <LText text={l.label} locale={locale} />
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Section>
    </>
  )
}
