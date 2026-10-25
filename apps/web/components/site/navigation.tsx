"use client"

import { ChevronDown, Menu, Search, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"

import { isActive } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export type ResolvedLink = { label: string; href: string; description?: string }
export type ResolvedNavItem = ResolvedLink & { children?: ResolvedLink[] }

function sectionActive(pathname: string, item: ResolvedNavItem) {
  return (
    isActive(pathname, item.href) || !!item.children?.some((c) => isActive(pathname, c.href))
  )
}

/** Desktop bar with disclosure dropdowns (Escape / outside click closes). */
export function DesktopNav({ items, label }: { items: ResolvedNavItem[]; label: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  // Close any open menu when the route changes (state reset during render).
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setOpen(null)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const button = navRef.current?.querySelector<HTMLButtonElement>(`[data-menu="${open}"]`)
        setOpen(null)
        button?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [open])

  const base =
    "relative inline-flex min-h-12 items-center gap-1 px-2.5 text-[0.9375rem] font-semibold text-white/90 transition-colors hover:text-white xl:px-3.5"
  const activeBar =
    "after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] after:rounded-t after:bg-saffron-500"

  return (
    <nav ref={navRef} aria-label={label} className="hidden lg:block">
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active = sectionActive(pathname, item)
          if (!item.children) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={cn(base, active && cn("text-white", activeBar))}
                >
                  {item.label}
                </Link>
              </li>
            )
          }
          const expanded = open === item.href
          const menuId = `menu-${item.href.slice(1)}`
          return (
            <li
              key={item.href}
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(null)
              }}
            >
              <button
                type="button"
                data-menu={item.href}
                aria-expanded={expanded}
                aria-controls={menuId}
                onClick={() => setOpen(expanded ? null : item.href)}
                className={cn(base, active && cn("text-white", activeBar))}
              >
                {item.label}
                <ChevronDown
                  aria-hidden
                  className={cn("size-4 transition-transform", expanded && "rotate-180")}
                />
              </button>
              <ul
                id={menuId}
                hidden={!expanded}
                className="absolute top-full left-0 z-50 mt-0 w-80 rounded-b-lg border border-t-0 border-line bg-white p-2 shadow-(--shadow-raised)"
              >
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      aria-current={pathname === child.href ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-3 py-2.5 hover:bg-navy-50",
                        pathname === child.href && "bg-teal-50"
                      )}
                    >
                      <span className="block font-semibold text-navy-800">{child.label}</span>
                      {child.description && (
                        <span className="mt-0.5 block text-sm text-ink-muted">
                          {child.description}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Mobile drawer: modal dialog with focus containment and scroll lock. */
export function MobileNav({
  items,
  labels,
}: {
  items: ResolvedNavItem[]
  labels: { menu: string; close: string; nav: string; search: string; placeholder: string }
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  const [drawerPath, setDrawerPath] = useState(pathname)
  if (drawerPath !== pathname) {
    setDrawerPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panelRef.current?.querySelector<HTMLElement>("button, a, input")?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
      if (e.key !== "Tab" || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", onKey)
      trigger?.focus()
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/30 px-3 font-semibold text-white hover:bg-white/10"
      >
        <Menu aria-hidden className="size-5" />
        {labels.menu}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div
            aria-hidden
            className="absolute inset-0 bg-navy-950/60 animate-in fade-in"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 right-0 flex w-[min(24rem,100%)] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 id={titleId} className="text-lg font-bold">
                {labels.menu}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-11 items-center justify-center rounded-md text-navy-800 hover:bg-navy-50"
                aria-label={labels.close}
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <form action="/search" role="search" className="border-b border-line p-4">
              <label htmlFor="mobile-search" className="sr-only">
                {labels.search}
              </label>
              <div className="flex">
                <input
                  id="mobile-search"
                  name="q"
                  type="search"
                  placeholder={labels.placeholder}
                  className="min-h-11 w-full min-w-0 rounded-l-md border border-r-0 border-line-strong bg-white px-3 text-base text-ink placeholder:text-ink-muted"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-r-md bg-navy-800 px-3 text-white"
                  aria-label={labels.search}
                >
                  <Search aria-hidden className="size-5" />
                </button>
              </div>
            </form>

            <nav aria-label={labels.nav} className="flex-1 overflow-y-auto px-2 py-3">
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    {item.children ? (
                      <>
                        <p className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wider text-ink-muted uppercase">
                          {item.label}
                        </p>
                        <ul>
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <MobileLink href={child.href} pathname={pathname}>
                                {child.label}
                              </MobileLink>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <MobileLink href={item.href} pathname={pathname}>
                        {item.label}
                      </MobileLink>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

function MobileLink({
  href,
  pathname,
  children,
}: {
  href: string
  pathname: string
  children: React.ReactNode
}) {
  const current = pathname === href
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center rounded-md px-3 font-semibold text-navy-800 hover:bg-navy-50",
        current && "bg-teal-50 text-teal-ink"
      )}
    >
      {children}
    </Link>
  )
}
