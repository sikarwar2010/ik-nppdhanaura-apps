"use client"

import { useLocale, type MessageKey } from "@workspace/i18n"
import {
  Award,
  Building2,
  ChevronDown,
  Construction,
  Droplets,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Home,
  Image as ImageIcon,
  Landmark,
  Layers3,
  Mail,
  Menu,
  Newspaper,
  Recycle,
  Search,
  ShieldCheck,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface MenuItem {
  name: string
  labelKey: MessageKey
  href: string
  hasDropdown?: boolean
  megaMenuType?: "departments" | "services" | null
  items?: { name: string; href: string }[]
}

export default function Navbar() {
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState("Home")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileSearch, setMobileSearch] = useState("")

  /* =========================================================
      SCROLL STATE
  ========================================================== */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }

    handleScroll()

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  /* =========================================================
      ACTIVE ROUTE
  ========================================================== */

  useEffect(() => {
    if (pathname === "/") setActiveTab("Home")
    else if (pathname === "/about") setActiveTab("About")
    else if (pathname === "/departments") setActiveTab("Departments")
    else if (pathname === "/services") setActiveTab("Services")
    else if (pathname === "/public-grievance")
      setActiveTab("Public Grievance")
    else if (pathname === "/schemes") setActiveTab("Schemes")
    else if (pathname === "/gallery") setActiveTab("Gallery")
    else if (pathname === "/staff") setActiveTab("Staff")
    else if (pathname === "/contact") setActiveTab("Contact")
    else if (pathname === "/propertytax") setActiveTab("Property Tax")
    else setActiveTab("Home")
  }, [pathname])

  /* =========================================================
      MENU ITEMS
  ========================================================== */

  const menuItems: MenuItem[] = [
    {
      name: "Home",
      labelKey: "web.nav.home",
      href: "/",
      hasDropdown: false,
    },
    {
      name: "About",
      labelKey: "web.nav.about",
      href: "/about",
      hasDropdown: false,
    },
    {
      name: "Departments",
      labelKey: "web.nav.departments",
      href: "/departments",
      hasDropdown: true,
      megaMenuType: "departments",
    },
    {
      name: "Services",
      labelKey: "web.nav.services",
      href: "/services",
      hasDropdown: true,
      megaMenuType: "services",
    },
    {
      name: "Public Grievance",
      labelKey: "web.nav.grievance",
      href: "/public-grievance",
      hasDropdown: false,
    },
    {
      name: "Schemes",
      labelKey: "web.nav.schemes",
      href: "/schemes",
      hasDropdown: false,
    },
    {
      name: "Gallery",
      labelKey: "web.nav.gallery",
      href: "/gallery",
      hasDropdown: false,
    },
    {
      name: "Staff",
      labelKey: "web.nav.staff",
      href: "/staff",
      hasDropdown: false,
    },
    {
      name: "Contact",
      labelKey: "web.nav.contact",
      href: "/contact",
      hasDropdown: false,
    },
    {
      name: "Property Tax",
      labelKey: "web.nav.propertyTax",
      href: "/propertytax",
      hasDropdown: false,
    },
  ]

  /* =========================================================
      DEPARTMENTS
  ========================================================== */

  const departments = [
    {
      name: "Public Works Department",
      desc: "Municipal roads, infrastructure and civil projects.",
      icon: Construction,
      color: "from-orange-500 to-amber-500",
    },
    {
      name: "Revenue Department",
      desc: "Taxation, revenue collection and trade licensing.",
      icon: FileSpreadsheet,
      color: "from-blue-500 to-indigo-500",
    },
    {
      name: "Water Supply Department",
      desc: "Drinking water distribution and connections.",
      icon: Droplets,
      color: "from-cyan-500 to-sky-500",
    },
    {
      name: "Sanitation Department",
      desc: "Waste management, cleanliness and hygiene.",
      icon: Recycle,
      color: "from-emerald-500 to-teal-500",
    },
    {
      name: "Health Department",
      desc: "Birth, death and community health services.",
      icon: Award,
      color: "from-rose-500 to-pink-500",
    },
    {
      name: "Engineering Department",
      desc: "Town planning, construction and engineering.",
      icon: Building2,
      color: "from-violet-500 to-purple-500",
    },
  ]

  /* =========================================================
      SERVICES
  ========================================================== */

  const services = [
    {
      name: "Property Tax Payment",
      desc: "View and manage property and house tax dues.",
      icon: FileSpreadsheet,
      color: "from-emerald-500 to-green-500",
    },
    {
      name: "Water Connection Request",
      desc: "Apply for a new municipal water connection.",
      icon: Droplets,
      color: "from-sky-500 to-cyan-500",
    },
    {
      name: "Birth Certificate",
      desc: "Apply and verify municipal birth records.",
      icon: Award,
      color: "from-pink-500 to-rose-500",
    },
    {
      name: "Death Registration",
      desc: "Register and verify death records.",
      icon: FileText,
      color: "from-purple-500 to-violet-500",
    },
    {
      name: "Trade License",
      desc: "Apply for or renew municipal trade licenses.",
      icon: Landmark,
      color: "from-amber-500 to-orange-500",
    },
    {
      name: "Building Permission",
      desc: "Submit building permission and NOC requests.",
      icon: Building2,
      color: "from-indigo-500 to-blue-500",
    },
    {
      name: "RTI Services",
      desc: "Access information under the RTI framework.",
      icon: Newspaper,
      color: "from-teal-500 to-emerald-500",
    },
    {
      name: "Grievance Redressal",
      desc: "Register civic complaints and track resolution.",
      icon: Mail,
      color: "from-red-500 to-orange-500",
    },
  ]

  /* =========================================================
      MENU CLICK
  ========================================================== */

  const handleMenuClick = (
    name: string,
    href: string,
  ) => {
    setActiveTab(name)
    setIsOpen(false)
    setOpenDropdown(null)

    if (href.includes("#")) {
      const targetId = href.split("#")[1]

      if (!targetId) {
        router.push(href)
        return
      }

      if (pathname === "/") {
        const element = document.getElementById(targetId)

        if (element) {
          const offset = scrolled ? 90 : 140

          const elementPosition =
            element.getBoundingClientRect().top +
            window.scrollY

          window.scrollTo({
            top: elementPosition - offset,
            behavior: "smooth",
          })
        }
      } else {
        router.push(href)
      }
    } else {
      router.push(href)
    }
  }

  /* =========================================================
      ESC CLOSE
  ========================================================== */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null)
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  /* =========================================================
      BODY SCROLL LOCK (MOBILE MENU)
  ========================================================== */

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"

      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  /* =========================================================
      RENDER
  ========================================================== */

  return (
    <>
      <nav
        className={`
          sticky top-0 z-50 w-full
          border-b border-emerald-700/70
          transition-all duration-500
          ${scrolled
            ? "bg-emerald-950/95 shadow-[0_12px_40px_rgba(2,44,34,0.35)] backdrop-blur-xl"
            : "bg-linear-to-r from-emerald-950 via-emerald-900 to-emerald-950"
          }
        `}
      >
        {/* =====================================================
            PREMIUM TOP ACCENT
        ====================================================== */}

        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-amber-300 via-yellow-400 to-emerald-300" />

        {/* =====================================================
            SUBTLE NAV PATTERN
        ====================================================== */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />

        {/* =====================================================
            MAIN NAVIGATION
        ====================================================== */}

        <div
          className={`
            relative mx-auto flex max-w-360
            items-center gap-5 px-4 md:px-6
            transition-all duration-300
            ${scrolled ? "h-17" : "h-19.5"}
          `}
        >
          {/* ===================================================
              COMPACT BRAND ON SCROLL
          ==================================================== */}

          <Link
            href="/"
            className={`
              group flex shrink-0 items-center gap-3
              transition-all duration-300
              ${scrolled
                ? "w-auto translate-x-0 opacity-100"
                : "pointer-events-none w-0 -translate-x-5 overflow-hidden opacity-0"
              }
            `}
            aria-label="Nagar Panchayat Goverdhan Mathura Home"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-amber-300/20 blur-md transition-all duration-300 group-hover:bg-amber-300/40" />

              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/30 bg-white p-1.5 shadow-lg">
                <img
                  src="/governmentlogo.png"
                  alt="Government Emblem"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="hidden xl:block">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-amber-300">
                Government of Uttar Pradesh
              </p>

              <p className="mt-0.5 text-[12px] font-extrabold uppercase tracking-wide text-white">
                Nagar Panchayat Goverdhan , Mathura
              </p>
            </div>
          </Link>

          {/* ===================================================
              DESKTOP NAVIGATION
          ==================================================== */}

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive =
                  activeTab === item.name

                const isDropdownOpen =
                  openDropdown === item.name

                const isPropertyTax =
                  item.name === "Property Tax"

                return (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => {
                      if (item.hasDropdown) {
                        setOpenDropdown(item.name)
                      }
                    }}
                    onMouseLeave={() => {
                      if (item.hasDropdown) {
                        setOpenDropdown(null)
                      }
                    }}
                  >
                    {/* =================================================
                        NAV ITEM
                    ================================================== */}

                    <button
                      type="button"
                      onClick={() =>
                        handleMenuClick(
                          item.name,
                          item.href,
                        )
                      }
                      aria-expanded={
                        item.hasDropdown
                          ? isDropdownOpen
                          : undefined
                      }
                      className={`
                        group relative flex
                        h-11 cursor-pointer
                        items-center gap-1.5
                        rounded-xl px-3.5
                        text-[12px]
                        font-bold
                        uppercase
                        tracking-[0.055em]
                        transition-all
                        duration-300
                        ${isActive
                          ? "bg-white text-emerald-800 shadow-[0_6px_18px_rgba(0,0,0,0.16)]"
                          : isPropertyTax
                            ? "bg-linear-to-r from-amber-400 to-yellow-400 text-emerald-950 shadow-[0_5px_16px_rgba(251,191,36,0.18)] hover:from-yellow-300 hover:to-amber-300"
                            : "text-emerald-50 hover:bg-white/10 hover:text-white"
                        }
                      `}
                    >
                      <span>{t(item.labelKey)}</span>

                      {item.hasDropdown && (
                        <ChevronDown
                          className={`
                            h-3.5 w-3.5
                            transition-all
                            duration-300
                            ${isDropdownOpen
                              ? "rotate-180"
                              : "group-hover:translate-y-0.5"
                            }
                          `}
                        />
                      )}

                      {/* Gold hover underline */}

                      {!isActive &&
                        !isPropertyTax && (
                          <span
                            className="
                              absolute bottom-1.5
                              left-3 right-3
                              h-0.5
                              origin-center
                              scale-x-0
                              rounded-full
                              bg-linear-to-r
                              from-amber-300
                              to-yellow-200
                              opacity-0
                              transition-all
                              duration-300
                              group-hover:scale-x-100
                              group-hover:opacity-100
                            "
                          />
                        )}
                    </button>

                    {/* =================================================
                        MEGA MENU
                    ================================================== */}

                    {item.hasDropdown &&
                      item.megaMenuType &&
                      isDropdownOpen && (
                        <div
                          className="absolute left-1/2 top-full z-70 w-215 -translate-x-1/2 pt-3"
                          onMouseEnter={() =>
                            setOpenDropdown(item.name)
                          }
                          onMouseLeave={() =>
                            setOpenDropdown(null)
                          }
                        >
                          <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_30px_90px_rgba(6,78,59,0.28)]">
                            {/* Top Accent */}

                            <div className="h-1 bg-linear-to-r from-emerald-500 via-teal-400 to-amber-400" />

                            <div className="grid grid-cols-[245px_1fr]">
                              {/* =================================================
                                  INTRO PANEL
                              ================================================== */}

                              <div className="relative overflow-hidden bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-900 p-7 text-white">
                                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/10" />

                                <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

                                <div className="relative flex h-full flex-col justify-between">
                                  <div>
                                    <div
                                      className={`
                                        mb-5 flex h-12 w-12
                                        items-center justify-center
                                        rounded-2xl
                                        bg-linear-to-br
                                        ${item.megaMenuType ===
                                          "departments"
                                          ? "from-orange-400 to-amber-500"
                                          : "from-cyan-400 to-teal-400"
                                        }
                                        text-white
                                        shadow-lg
                                      `}
                                    >
                                      {item.megaMenuType ===
                                        "departments" ? (
                                        <Building2 className="h-6 w-6" />
                                      ) : (
                                        <Layers3 className="h-6 w-6" />
                                      )}
                                    </div>

                                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-amber-300">
                                      Explore Mainpuri
                                    </p>

                                    <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight">
                                      {t(item.labelKey)}
                                    </h3>

                                    <p className="mt-3 text-[11px] leading-6 text-emerald-100/75">
                                      {item.megaMenuType ===
                                        "departments"
                                        ? "Explore municipal departments, responsibilities and administrative functions of Nagar Palika Parishad, Mainpuri."
                                        : "Access important civic services and digital facilities provided by Nagar Palika Parishad, Mainpuri."}
                                    </p>
                                  </div>

                                  <div className="border-t border-white/10 pt-4">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300/60">
                                      Official Portal
                                    </p>

                                    <p className="mt-1 text-[10px] font-semibold text-white">
                                      Goverdhan , Uttar Pradesh
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* =================================================
                                  ITEMS
                              ================================================== */}

                              <div className="bg-[#FAFDFB] p-5">
                                <div className="grid grid-cols-2 gap-2.5">
                                  {(item.megaMenuType ===
                                    "departments"
                                    ? departments
                                    : services
                                  ).map((subItem) => {
                                    const Icon =
                                      subItem.icon

                                    return (
                                      <button
                                        key={subItem.name}
                                        type="button"
                                        onClick={() =>
                                          handleMenuClick(
                                            item.name,
                                            item.href,
                                          )
                                        }
                                        className="
                                          group flex cursor-pointer
                                          items-start gap-3
                                          rounded-2xl
                                          border border-transparent
                                          bg-white p-3.5
                                          text-left
                                          transition-all
                                          duration-300
                                          hover:-translate-y-0.5
                                          hover:border-emerald-200
                                          hover:bg-emerald-50
                                          hover:shadow-md
                                        "
                                      >
                                        <div
                                          className={`
                                            flex h-10 w-10
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            bg-linear-to-br
                                            ${subItem.color}
                                            text-white
                                            shadow-md
                                            transition-all
                                            duration-300
                                            group-hover:scale-110
                                            group-hover:rotate-3
                                          `}
                                        >
                                          <Icon className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <p className="text-[11px] font-bold text-emerald-950 transition-colors group-hover:text-emerald-700">
                                            {subItem.name}
                                          </p>

                                          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-500">
                                            {subItem.desc}
                                          </p>
                                        </div>

                                        <ChevronDown className="mt-1 hidden h-3.5 w-3.5 -rotate-90 shrink-0 text-emerald-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 sm:block" />
                                      </button>
                                    )
                                  })}
                                </div>

                                {/* Footer */}

                                <div className="mt-4 flex items-center justify-between border-t border-emerald-100 pt-4">
                                  <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />

                                    <p className="text-[9px] font-semibold text-slate-500">
                                      Government of Uttar Pradesh
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMenuClick(
                                        item.name,
                                        item.href,
                                      )
                                    }
                                    className="
                                      group inline-flex
                                      cursor-pointer
                                      items-center gap-1
                                      rounded-lg px-2.5 py-1.5
                                      text-[9px]
                                      font-bold
                                      uppercase
                                      tracking-wider
                                      text-emerald-700
                                      transition-all
                                      hover:bg-emerald-100
                                      hover:text-emerald-900
                                    "
                                  >
                                    View all

                                    <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )
              })}
            </div>
          </div>


          {/* ===================================================
              MOBILE BUTTON
          ==================================================== */}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={
              isOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={isOpen}
            className="
              ml-auto flex h-11 w-11
              shrink-0 cursor-pointer
              items-center justify-center
              rounded-xl
              border border-white/20
              bg-white/10
              text-white
              backdrop-blur-md
              transition-all duration-300
              hover:border-amber-300/50
              hover:bg-amber-400
              hover:text-emerald-950
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-amber-300
              lg:hidden
            "
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* =======================================================
          MOBILE DRAWER
      ======================================================== */}

      {isOpen && (
        <div className="fixed inset-0 top-0 z-100 lg:hidden">
          {/* Backdrop */}

          <button
            type="button"
            aria-label="Close mobile navigation"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 cursor-default bg-emerald-950/75 backdrop-blur-sm"
          />

          {/* Drawer */}

          <aside className="absolute right-0 top-0 flex h-full w-[90%] max-w-102.5 flex-col overflow-hidden border-l border-emerald-200 bg-[#F4FAF6] shadow-[-25px_0_80px_rgba(2,44,34,0.35)]">
            {/* =================================================
                  DRAWER HEADER
              ================================================== */}

            <div className="relative overflow-hidden bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" />

              <div className="relative flex items-center justify-between px-5 py-4">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/30 bg-white p-1.5 shadow-lg">
                    <img
                      src="/governmentlogo.png"
                      alt="Government Emblem"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-amber-300">
                      Government of Uttar Pradesh
                    </p>

                    <p className="mt-0.5 text-[13px] font-extrabold text-white">
                      Nagar Panchayat Goverdhan
                    </p>

                    <p className="text-[10px] font-semibold text-emerald-200">
                      Mathura
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="
                      flex h-9 w-9
                      cursor-pointer
                      items-center justify-center
                      rounded-xl
                      border border-white/15
                      bg-white/10
                      text-white
                      transition-all
                      hover:bg-amber-400
                      hover:text-emerald-950
                    "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="h-1 bg-linear-to-r from-amber-300 via-yellow-400 to-emerald-300" />
            </div>

            {/* =================================================
                  MOBILE SEARCH
              ================================================== */}

            <div className="border-b border-emerald-100 bg-white px-5 py-3.5">
              <div className="group flex h-11 w-full items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-400/20">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-emerald-600 to-teal-600 text-white shadow-sm">
                  <Search className="h-3.5 w-3.5" />
                </span>

                <input
                  type="text"
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  placeholder={t("web.search.placeholder")}
                  className="w-full bg-transparent text-[12px] font-semibold text-emerald-950 placeholder-slate-400 outline-none"
                />

                {mobileSearch && (
                  <button
                    type="button"
                    onClick={() => setMobileSearch("")}
                    aria-label={t("web.search.clear")}
                    className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* =================================================
                  MOBILE MENU
              ================================================== */}

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive =
                    activeTab === item.name

                  const hasSub = item.hasDropdown

                  const isDropdownOpen =
                    openDropdown === item.name

                  const isPropertyTax =
                    item.name === "Property Tax"

                  return (
                    <div key={item.name}>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasSub) {
                            setOpenDropdown(
                              isDropdownOpen
                                ? null
                                : item.name,
                            )
                          } else {
                            handleMenuClick(
                              item.name,
                              item.href,
                            )
                          }
                        }}
                        className={`
                            group flex w-full
                            cursor-pointer
                            items-center
                            justify-between
                            rounded-xl
                            px-3.5 py-3
                            text-left
                            transition-all
                            duration-200
                            ${isActive
                            ? "bg-linear-to-r from-emerald-700 to-teal-700 text-white shadow-lg shadow-emerald-700/20"
                            : isPropertyTax
                              ? "bg-linear-to-r from-amber-400 to-yellow-400 text-emerald-950"
                              : "text-emerald-950 hover:bg-white hover:text-emerald-700 hover:shadow-sm"
                          }
                          `}
                      >
                        <span className="flex items-center gap-3">
                          {item.name === "Home" && (
                            <Home className="h-4 w-4" />
                          )}

                          {item.name === "About" && (
                            <ShieldCheck className="h-4 w-4" />
                          )}

                          {item.name ===
                            "Departments" && (
                              <Building2 className="h-4 w-4" />
                            )}

                          {item.name === "Services" && (
                            <Layers3 className="h-4 w-4" />
                          )}

                          {item.name ===
                            "Public Grievance" && (
                              <Mail className="h-4 w-4" />
                            )}

                          {item.name === "Schemes" && (
                            <Award className="h-4 w-4" />
                          )}

                          {item.name === "Gallery" && (
                            <ImageIcon className="h-4 w-4" />
                          )}

                          {item.name === "Staff" && (
                            <Building2 className="h-4 w-4" />
                          )}

                          {item.name === "Contact" && (
                            <Mail className="h-4 w-4" />
                          )}

                          {item.name ===
                            "Property Tax" && (
                              <FileSpreadsheet className="h-4 w-4" />
                            )}

                          <span className="text-[12px] font-bold uppercase tracking-[0.045em]">
                            {t(item.labelKey)}
                          </span>
                        </span>

                        {hasSub && (
                          <ChevronDown
                            className={`
                                h-4 w-4
                                transition-transform
                                ${isDropdownOpen
                                ? "rotate-180"
                                : ""
                              }
                              `}
                          />
                        )}
                      </button>

                      {/* =================================================
                            MOBILE SUBMENU
                        ================================================== */}

                      {hasSub &&
                        isDropdownOpen && (
                          <div className="ml-4 mt-1.5 space-y-1.5 border-l-2 border-emerald-200 pl-3">
                            {(item.megaMenuType ===
                              "departments"
                              ? departments
                              : services
                            ).map((subItem) => {
                              const Icon = subItem.icon

                              return (
                                <button
                                  type="button"
                                  key={subItem.name}
                                  onClick={() =>
                                    handleMenuClick(
                                      item.name,
                                      item.href,
                                    )
                                  }
                                  className="
                                      group flex w-full
                                      cursor-pointer
                                      items-center gap-2.5
                                      rounded-xl
                                      border border-transparent
                                      bg-white
                                      px-3 py-2.5
                                      text-left
                                      transition-all
                                      hover:border-emerald-200
                                      hover:bg-emerald-50
                                      hover:shadow-sm
                                    "
                                >
                                  <div
                                    className={`
                                        flex h-8 w-8
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-linear-to-br
                                        ${subItem.color}
                                        text-white
                                        shadow-sm
                                      `}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-emerald-950">
                                      {subItem.name}
                                    </p>

                                    <p className="mt-0.5 line-clamp-1 text-[8px] text-slate-500">
                                      {subItem.desc}
                                    </p>
                                  </div>

                                  <ChevronDown className="ml-auto h-3 w-3 -rotate-90 text-emerald-500 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                                </button>
                              )
                            })}
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* =================================================
                  DRAWER FOOTER
              ================================================== */}

            <div className="border-t border-emerald-100 bg-white p-5">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-4">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-300/20 blur-xl" />

                <div className="relative flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 text-white shadow-md">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-950">
                      Official Portal
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-slate-500">
                      Nagar Panchayat Goverdhan,
                      Mathura
                    </p>

                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700">
                        Government of Uttar Pradesh
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
