"use client"

import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Menu,
  X,
  ChevronDown,
  Building2,
  FileSpreadsheet,
  Newspaper,
  Award,
  Layers3,
  ShieldCheck,
  Mail,
  Home,
  Image as ImageIcon,
  Search,
  ExternalLink,
  Landmark,
  FileText,
} from "lucide-react"

interface MenuItem {
  name: string
  href: string
  hasDropdown?: boolean
  megaMenuType?: "departments" | "services" | null
  items?: { name: string; href: string }[]
}

export default function Navbar() {
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
    else if (pathname === "/propertytax")
      setActiveTab("Property Tax")
    else if (pathname === "/newsandnotice")
      setActiveTab("News & Notices")
    else setActiveTab("Home")
  }, [pathname])

  /* =========================================================
     MENU ITEMS
  ========================================================== */

  const menuItems: MenuItem[] = [
    {
      name: "Home",
      href: "/",
      hasDropdown: false,
    },
    {
      name: "About",
      href: "/about",
      hasDropdown: false,
    },
    {
      name: "Departments",
      href: "/departments",
      hasDropdown: true,
      megaMenuType: "departments",
    },
    {
      name: "Services",
      href: "/services",
      hasDropdown: true,
      megaMenuType: "services",
    },
    {
      name: "Public Grievance",
      href: "/public-grievance",
      hasDropdown: false,
    },
    {
      name: "Schemes",
      href: "/schemes",
      hasDropdown: false,
    },
    {
      name: "Gallery",
      href: "/gallery",
      hasDropdown: false,
    },
    {
      name: "Staff",
      href: "/staff",
      hasDropdown: false,
    },
    {
      name: "Contact",
      href: "/contact",
      hasDropdown: false,
    },
    {
      name: "Property Tax",
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
      icon: Building2,
    },
    {
      name: "Revenue Department",
      desc: "Taxation, revenue collection and trade licensing.",
      icon: FileSpreadsheet,
    },
    {
      name: "Water Supply Department",
      desc: "Drinking water distribution and connections.",
      icon: Layers3,
    },
    {
      name: "Sanitation Department",
      desc: "Waste management, cleanliness and hygiene.",
      icon: ShieldCheck,
    },
    {
      name: "Health Department",
      desc: "Birth, death and community health services.",
      icon: Award,
    },
    {
      name: "Engineering Department",
      desc: "Town planning, construction and engineering.",
      icon: Building2,
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
    },
    {
      name: "Water Connection Request",
      desc: "Apply for a new municipal water connection.",
      icon: Layers3,
    },
    {
      name: "Birth Certificate",
      desc: "Apply and verify municipal birth records.",
      icon: Award,
    },
    {
      name: "Death Registration",
      desc: "Register and verify death records.",
      icon: FileText,
    },
    {
      name: "Trade License",
      desc: "Apply for or renew municipal trade licenses.",
      icon: Landmark,
    },
    {
      name: "Building Permission",
      desc: "Submit building permission and NOC requests.",
      icon: Building2,
    },
    {
      name: "RTI Services",
      desc: "Access information under the RTI framework.",
      icon: Newspaper,
    },
    {
      name: "Grievance Redressal",
      desc: "Register civic complaints and track resolution.",
      icon: Mail,
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
     CLOSE DROPDOWN WHEN ESC PRESSED
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
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          scrolled
            ? "border-[#D9D3C8]/80 bg-[#F7F5F0]/95 shadow-[0_8px_30px_rgba(36,55,70,0.08)] backdrop-blur-xl"
            : "border-[#D9D3C8] bg-[#F7F5F0]"
        }`}
      >
        {/* =====================================================
            MAIN NAVIGATION
        ====================================================== */}

        <div
          className={`mx-auto flex max-w-360 items-center gap-4 px-4 transition-all duration-300 md:px-6 ${
            scrolled ? "h-17" : "h-19"
          }`}
        >
          {/* ===================================================
              COMPACT BRAND - ONLY WHEN SCROLLED
          ==================================================== */}

          <Link
            href="/"
            className={`group flex shrink-0 items-center gap-2.5 transition-all duration-300 ${
              scrolled
                ? "w-auto translate-x-0 opacity-100"
                : "pointer-events-none w-0 -translate-x-4 overflow-hidden opacity-0"
            }`}
            aria-label="Nagar Palika Parishad Mainpuri Home"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-full border border-[#B88A3B]/30" />

              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#D9D3C8] bg-white p-1">
                <img
                  src="/governmentlogo.png"
                  alt="Government Emblem"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="hidden xl:block">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#B88A3B]">
                Government of Uttar Pradesh
              </p>

              <p className="text-[11px] font-black uppercase tracking-wide text-[#243746]">
                Nagar Palika Parishad, Mainpuri
              </p>
            </div>
          </Link>

          {/* ===================================================
              DESKTOP NAV
          ==================================================== */}

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-0.5">
              {menuItems.map((item) => {
                const isActive =
                  activeTab === item.name

                const isDropdownOpen =
                  openDropdown === item.name

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
                        NAV BUTTON
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
                      className={`group relative flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs (12px) font-black uppercase tracking-[0.08em] transition-all duration-200 ${
                        isActive
                          ? "text-[#B88A3B]"
                          : "text-[#526571] hover:text-[#B88A3B]"
                      }`}
                    >
                      <span>{item.name}</span>

                      {item.hasDropdown && (
                        <ChevronDown
                          className={`h-3 w-3 transition-transform duration-200 ${
                            isDropdownOpen
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}

                      {/* Active / Hover Indicator */}
                      <span
                        className={`absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-[#B88A3B] transition-all duration-200 ${
                          isActive
                            ? "scale-x-100 opacity-100"
                            : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-60"
                        }`}
                      />
                    </button>

                    {/* =================================================
                        MEGA MENU
                    ================================================== */}

                    {item.hasDropdown &&
                      item.megaMenuType &&
                      isDropdownOpen && (
                        <div
                          className="absolute left-1/2 top-full z-70 w-205 -translate-x-1/2 pt-3"
                          onMouseEnter={() =>
                            setOpenDropdown(item.name)
                          }
                          onMouseLeave={() =>
                            setOpenDropdown(null)
                          }
                        >
                          <div className="overflow-hidden rounded-2xl border border-[#D9D3C8] bg-white shadow-[0_25px_70px_rgba(36,55,70,0.16)]">
                            <div className="h-1 bg-[#B88A3B]" />

                            <div className="grid grid-cols-[230px_1fr]">
                              {/* =================================================
                                  MEGA MENU INTRO
                              ================================================== */}

                              <div className="relative overflow-hidden bg-[#203746] p-6 text-white">
                                <div
                                  aria-hidden="true"
                                  className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-white/10"
                                />

                                <div className="relative flex h-full flex-col justify-between">
                                  <div>
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                                      {item.megaMenuType ===
                                      "departments" ? (
                                        <Building2 className="h-5 w-5 text-[#D8B26A]" />
                                      ) : (
                                        <Layers3 className="h-5 w-5 text-[#D8B26A]" />
                                      )}
                                    </div>

                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D8B26A]">
                                      Explore
                                    </p>

                                    <h3 className="mt-1 text-xl font-black tracking-tight">
                                      {item.name}
                                    </h3>

                                    <p className="mt-3 text-[11px] leading-6 text-slate-300">
                                      {item.megaMenuType ===
                                      "departments"
                                        ? "Explore municipal departments, responsibilities and administrative functions."
                                        : "Access important civic services and digital facilities provided by the municipal administration."}
                                    </p>
                                  </div>

                                  <div className="border-t border-white/10 pt-4">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                      Nagar Palika Parishad
                                    </p>

                                    <p className="mt-1 text-[10px] font-semibold text-white">
                                      Mainpuri, Uttar Pradesh
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* =================================================
                                  ITEMS
                              ================================================== */}

                              <div className="p-5">
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
                                        className="group flex cursor-pointer items-start gap-3 rounded-xl border border-transparent p-3.5 text-left transition-all duration-200 hover:border-[#D9D3C8] hover:bg-[#F7F5F0]"
                                      >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E4DFD5] bg-[#F7F5F0] text-[#B88A3B] transition-all duration-200 group-hover:border-[#B88A3B]/30 group-hover:bg-[#B88A3B] group-hover:text-white">
                                          <Icon className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                          <p className="text-[11px] font-extrabold text-[#243746] transition-colors group-hover:text-[#8F682B]">
                                            {subItem.name}
                                          </p>

                                          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#8A969D]">
                                            {subItem.desc}
                                          </p>
                                        </div>

                                        <ChevronDown className="mt-1 hidden h-3 w-3 -rotate-90 shrink-0 text-[#B88A3B] opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
                                      </button>
                                    )
                                  })}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-[#EDE9E1] pt-4">
                                  <p className="text-[9px] font-semibold text-[#8A969D]">
                                    Government of Uttar Pradesh
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMenuClick(
                                        item.name,
                                        item.href,
                                      )
                                    }
                                    className="inline-flex cursor-pointer items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#9A7332] hover:text-[#243746]"
                                  >
                                    View all
                                    <ExternalLink className="h-3 w-3" />
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
              MOBILE MENU BUTTON
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
            className="ml-auto flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#D9D3C8] bg-white text-[#243746] transition-all hover:border-[#B88A3B]/40 hover:text-[#B88A3B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B88A3B] lg:hidden"
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
          MOBILE DRAWER (Placed outside <nav> to avoid backdrop-filter & sticky clipping)
      ======================================================== */}

      {isOpen && (
        <div className="fixed inset-0 z-100 flex h-dvh w-screen justify-end lg:hidden">
          {/* Backdrop */}
          <div
            aria-label="Close mobile navigation"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 cursor-pointer bg-[#172B3A]/60 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Drawer Sidebar */}
          <aside className="relative z-10 flex h-full w-[88%] max-w-97.5 flex-col overflow-hidden border-l border-[#D9D3C8] bg-[#F7F5F0] shadow-[-20px_0_60px_rgba(36,55,70,0.25)]">
            {/* Drawer Header */}
            <div className="border-b border-[#D9D3C8] bg-white">
              <div className="flex items-center justify-between px-5 py-4">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D9D3C8] bg-white p-1 shadow-sm">
                    <img
                      src="/governmentlogo.png"
                      alt="Government Emblem"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#B88A3B]">
                      Government of Uttar Pradesh
                    </p>

                    <p className="mt-0.5 text-[11px] font-black text-[#243746]">
                      Nagar Palika Parishad
                    </p>

                    <p className="text-[10px] font-semibold text-[#687781]">
                      Mainpuri
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#D9D3C8] bg-[#F7F5F0] text-[#243746] hover:border-[#B88A3B]/40 hover:text-[#B88A3B]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="border-b border-[#E4DFD5] bg-white px-5 py-3.5">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#D9D3C8] bg-[#F7F5F0] px-3 transition-colors focus-within:border-[#B88A3B] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#B88A3B]/20"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-[#B88A3B]" />
                <input
                  type="text"
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  placeholder="Search services, pages..."
                  aria-label="Search services and pages"
                  className="h-full w-full bg-transparent text-[11px] font-semibold text-[#243746] placeholder-[#7A8790] outline-none"
                />
                {mobileSearch && (
                  <button
                    type="button"
                    onClick={() => setMobileSearch("")}
                    aria-label="Clear mobile search"
                    className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#7A8790] hover:text-[#243746]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </form>
            </div>

            {/* Mobile Scrollable Menu List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive =
                    activeTab === item.name

                  const hasSub =
                    item.hasDropdown

                  const isDropdownOpen =
                    openDropdown === item.name

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
                        className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${
                          isActive
                            ? "bg-[#B88A3B] text-white shadow-sm"
                            : "text-[#526571] hover:bg-white hover:text-[#B88A3B]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
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

                          {item.name ===
                            "News & Notices" && (
                            <Newspaper className="h-4 w-4" />
                          )}

                          <span className="text-[11px] font-black uppercase tracking-[0.08em]">
                            {item.name}
                          </span>
                        </span>

                        {hasSub && (
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isDropdownOpen
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        )}
                      </button>

                      {/* Mobile submenu */}
                      {hasSub &&
                        isDropdownOpen && (
                          <div className="ml-4 mt-1 space-y-1 border-l border-[#D9D3C8] pl-3">
                            {(item.megaMenuType ===
                            "departments"
                              ? departments
                              : services
                            ).map((subItem) => {
                              const Icon =
                                subItem.icon

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
                                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white"
                                >
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#B88A3B]">
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-[#344A59]">
                                      {subItem.name}
                                    </p>

                                    <p className="mt-0.5 line-clamp-1 text-[8px] text-[#89949B]">
                                      {subItem.desc}
                                    </p>
                                  </div>
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

            {/* Drawer Footer */}
            <div className="border-t border-[#D9D3C8] bg-white p-4">
              <div className="rounded-xl border border-[#D9D3C8] bg-[#F7F5F0] p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B88A3B]/10">
                    <ShieldCheck className="h-4 w-4 text-[#B88A3B]" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#243746]">
                      Official Portal
                    </p>

                    <p className="mt-0.5 text-[9px] leading-4 text-[#7A8790]">
                      Nagar Palika Parishad, Mainpuri
                    </p>
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
