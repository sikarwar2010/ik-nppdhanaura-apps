import { ArrowRight, ArrowUpRight, Download, Inbox } from "lucide-react"
import Link from "next/link"
import type { ComponentProps, ElementType, ReactNode } from "react"

import type { LinkAction, Text } from "@/content/schema"
import { pick, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * Renders bilingual content. When English is requested but only the Hindi
 * original exists, the Hindi text is shown with lang="hi".
 */
export function LText({
  text,
  locale,
  as: Tag = "span",
  className,
}: {
  text: Text
  locale: Locale
  as?: ElementType
  className?: string
}) {
  const { value, lang } = pick(text, locale)
  return (
    <Tag className={className} lang={lang !== locale ? lang : undefined}>
      {value}
    </Tag>
  )
}

export function isExternal(href: string) {
  return /^https?:\/\//.test(href)
}

/**
 * Link that marks external destinations visibly and for screen readers,
 * and opens them safely in a new tab.
 */
export function SmartLink({
  href,
  children,
  className,
  externalLabel,
  showIcon = true,
  ...rest
}: Omit<ComponentProps<"a">, "href"> & {
  href: string
  externalLabel: string
  showIcon?: boolean
}) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
        {children}
        {showIcon && <ArrowUpRight aria-hidden className="size-[1em] shrink-0 opacity-70" />}
        <span className="sr-only"> {externalLabel}</span>
      </a>
    )
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  )
}

export function ActionButton({
  action,
  locale,
  externalLabel,
  variant = "primary",
  className,
}: {
  action: LinkAction
  locale: Locale
  externalLabel: string
  variant?: "primary" | "secondary"
  className?: string
}) {
  const Icon = action.kind === "document" ? Download : isExternal(action.href) ? null : ArrowRight
  return (
    <SmartLink
      href={action.href}
      externalLabel={externalLabel}
      className={cn(variant === "primary" ? "btn-primary" : "btn-secondary", className)}
    >
      <LText text={action.label} locale={locale} />
      {Icon && <Icon aria-hidden className="size-4" />}
    </SmartLink>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  action,
  id,
  className,
}: {
  eyebrow?: string
  title: string
  lead?: string
  action?: ReactNode
  id?: string
  className?: string
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          {title}
        </h2>
        <div aria-hidden className="mt-3 h-1 w-12 rounded-full bg-saffron-500" />
        {lead && <p className="mt-3 text-ink-muted">{lead}</p>}
      </div>
      {action}
    </div>
  )
}

export function ViewAllLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-11 items-center gap-1.5 font-semibold text-teal-ink hover:text-navy-800"
    >
      {children}
      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export function EmptyState({
  title,
  children,
  icon: Icon = Inbox,
}: {
  title: string
  children?: ReactNode
  icon?: ElementType
}) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-white/60 px-6 py-10 text-center">
      <Icon aria-hidden className="mx-auto mb-3 size-8 text-ink-muted" />
      <p className="font-semibold text-navy-800">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{children}</div>}
    </div>
  )
}

export function Section({
  children,
  className,
  labelledBy,
  tone = "default",
}: {
  children: ReactNode
  className?: string
  labelledBy?: string
  tone?: "default" | "white" | "tint"
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "py-14 sm:py-16",
        tone === "white" && "border-y border-line bg-white",
        tone === "tint" && "bg-ivory-200",
        className
      )}
    >
      <div className="container-site">{children}</div>
    </section>
  )
}
