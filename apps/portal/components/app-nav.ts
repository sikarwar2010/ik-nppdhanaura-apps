import type { MessageKey } from "@workspace/i18n"
import {
  Banknote,
  BarChart3,
  ClipboardList,
  FileUp,
  History,
  Landmark,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react"
import type { ComponentType } from "react"

export type NavItem = {
  title: string
  href?: string
  icon?: ComponentType<{ className?: string }>
  permission?: string | string[]
  children?: NavItem[]
  exact?: boolean
}

export function isNavHrefActive(
  href: string,
  pathname: string,
  exact?: boolean
): boolean {
  const path = href.split("#")[0] ?? href
  if (exact) return pathname === path
  return pathname === path || pathname.startsWith(`${path}/`)
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:read",
  },
  {
    title: "Survey",
    href: "/surveys",
    icon: ClipboardList,
    permission: "survey:read",
  },
  {
    title: "Reports",
    icon: BarChart3,
    permission: "report:read",
    children: [
      { title: "Report Builder", href: "/reports", permission: "report:read" },
      {
        title: "Tax Rates",
        href: "/reports/tax-rates",
        permission: "report:read",
      },
      {
        title: "Demand Notice",
        href: "/reports/notice",
        permission: "report:read",
      },
    ],
  },
  {
    title: "Tax Administration",
    icon: Landmark,
    permission: "report:read",
    children: [
      {
        title: "Assessment Years",
        href: "/reports/tax-rates#assessment-years",
        permission: "report:read",
      },
      {
        title: "Tax Rates",
        href: "/reports/tax-rates#tax-rates",
        permission: "report:read",
      },
      {
        title: "Rebate Settings",
        href: "/reports/tax-rates#rebate",
        permission: "report:read",
      },
      {
        title: "Penalty Settings",
        href: "/reports/tax-rates#penalty",
        permission: "report:read",
      },
    ],
  },
  {
    title: "Tax Collection",
    icon: Banknote,
    permission: ["payment:collect", "demand:read"],
    children: [
      {
        title: "Offline Tax Collection",
        href: "/collections",
        permission: "payment:collect",
        exact: true,
      },
      {
        title: "Payment Receipts",
        href: "/collections/receipts",
        permission: "demand:read",
      },
      {
        title: "Customer Ledger",
        href: "/collections/ledger",
        permission: "demand:read",
      },
      {
        title: "Outstanding Dues",
        href: "/collections/dues",
        permission: "demand:read",
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    permission: [
      "user:read",
      "role:read",
      "permission:read",
      "audit:read",
      "settings:update",
    ],
    children: [
      {
        title: "Users",
        href: "/settings/users",
        permission: "user:read",
        icon: Users,
      },
      {
        title: "Roles",
        href: "/settings/roles",
        permission: "role:read",
        icon: Shield,
      },
      {
        title: "Permissions",
        href: "/settings/permissions",
        permission: "permission:read",
      },
      {
        title: "Audit Logs",
        href: "/audit-logs",
        permission: "audit:read",
        icon: ScrollText,
      },
      {
        title: "System Settings",
        href: "/settings/system",
        permission: "settings:update",
      },
    ],
  },
  {
    title: "Import",
    icon: FileUp,
    permission: ["import:read", "import:create"],
    children: [
      {
        title: "Import",
        href: "/surveys/import",
        permission: "import:create",
        icon: FileUp,
        exact: true,
      },
      {
        title: "History",
        href: "/surveys/import/history",
        permission: "import:read",
        icon: History,
      },
    ],
  },
]

const NAV_TITLE_KEYS: Record<string, MessageKey> = {
  Dashboard: "nav.dashboard",
  Survey: "nav.survey",
  Reports: "nav.reports",
  "Report Builder": "nav.reportBuilder",
  "Tax Rates": "nav.taxRates",
  "Demand Notice": "nav.demandNotice",
  "Tax Administration": "nav.taxAdministration",
  "Assessment Years": "nav.assessmentYears",
  "Rebate Settings": "nav.rebateSettings",
  "Penalty Settings": "nav.penaltySettings",
  "Tax Collection": "nav.taxCollection",
  "Offline Tax Collection": "nav.offlineCollection",
  "Payment Receipts": "nav.paymentReceipts",
  "Customer Ledger": "nav.customerLedger",
  "Outstanding Dues": "nav.outstandingDues",
  Settings: "nav.settings",
  Users: "nav.users",
  Roles: "nav.roles",
  Permissions: "nav.permissions",
  "Audit Logs": "nav.auditLogs",
  "System Settings": "nav.systemSettings",
  Import: "nav.import",
  History: "nav.history",
}

export function navTitleKey(title: string): MessageKey | null {
  return NAV_TITLE_KEYS[title] ?? null
}

/** True when Survey list/detail is active, but not import/export routes. */
export function isSurveyNavActive(pathname: string): boolean {
  if (pathname === "/surveys") return true
  if (!pathname.startsWith("/surveys/")) return false
  if (
    pathname.startsWith("/surveys/import") ||
    pathname.startsWith("/surveys/export")
  ) {
    return false
  }
  return true
}

export function getBreadcrumbLabel(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard"
  if (isSurveyNavActive(pathname)) return "Survey"
  if (pathname.startsWith("/collections")) return "Tax Collection"
  if (pathname.startsWith("/reports")) return "Reports"
  if (pathname.startsWith("/settings") || pathname.startsWith("/audit-logs")) {
    return "Settings"
  }
  if (pathname.startsWith("/surveys/import")) return "Import"
  if (pathname.startsWith("/surveys/export")) return "Reports"
  return "Admin Portal"
}
