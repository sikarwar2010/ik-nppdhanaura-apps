"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

const TABS = [
  { label: "Collect / संग्रह", href: "/collections", exact: true },
  { label: "Receipts / रसीद", href: "/collections/receipts" },
  { label: "Ledger / खाता", href: "/collections/ledger" },
  { label: "Outstanding / बकाया", href: "/collections/dues" },
] as const

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-primary">
          Nagar Palika Parishad Dhanaura
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Offline Tax Collection / ऑफलाइन कर संग्रह
        </h1>
        <p className="text-sm text-muted-foreground">
          Collect against the published demand. Amounts come from the ledger.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => {
          const active =
            "exact" in tab && tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "cursor-pointer border-b-2 px-4 py-2 text-sm font-medium",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
