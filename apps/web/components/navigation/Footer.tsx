"use client"

import Link from "next/link"
import {
  ArrowUp,
  Building2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react"

const quickLinks = [
  { name: "About Mainpuri", href: "/about" },
  { name: "Council Members", href: "/staff" },
  { name: "Departments", href: "/departments" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact Us", href: "/contact" },
]

const citizenServices = [
  { name: "Property & House Tax", href: "/propertytax" },
  { name: "Water Supply & Bills", href: "/services" },
  { name: "Birth Certificate", href: "/services" },
  { name: "Death Certificate", href: "/services" },
  { name: "Trade / Shop License", href: "/services" },
  { name: "Building Permission / NOC", href: "/services" },
]

const governmentLinks = [
  { name: "Government of Uttar Pradesh", href: "#" },
  { name: "District Mainpuri", href: "#" },
  { name: "Digital India", href: "#" },
  { name: "Swachh Bharat Mission", href: "#" },
]

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <footer
      id="contact-us"
      className="relative overflow-hidden bg-[#F7F5F0] text-[#243746]"
    >
      {/* =========================================================
          TOP GOLD LINE
      ========================================================== */}
      <div className="h-1 w-full bg-[#B88A3B]" />

      {/* =========================================================
          SUBTLE BACKGROUND DECORATION
      ========================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #243746 1px, transparent 1px), linear-gradient(#243746 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* =========================================================
          MAIN FOOTER CONTENT
      ========================================================== */}
      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1.2fr]">
            {/* ===================================================
                BRAND SECTION
            ==================================================== */}
            <div>
              <div className="flex items-start gap-4">
                {/* Emblem */}
                <div className="flex h-17 w-17 shrink-0 items-center justify-center rounded-2xl border border-[#D9D3C8] bg-white p-2.5 shadow-[0_8px_25px_rgba(36,55,70,0.08)]">
                  <img
                    src="/governmentlogo.png"
                    alt="Government Emblem of India"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="pt-1">
                  <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-[#B88A3B]">
                    Government of Uttar Pradesh
                  </p>

                  <h2 className="text-xl font-black leading-[1.15] tracking-tight text-[#1E3342]">
                    Nagar Palika Parishad Mainpuri
                  </h2>
                </div>
              </div>

              <p className="mt-7 max-w-md text-[13px] leading-7 text-[#667681]">
                Official digital citizen portal of Nagar Palika Parishad,
                Mainpuri, Uttar Pradesh. Access municipal information,
                public services and essential civic facilities through
                one trusted platform.
              </p>

              {/* Official portal status */}
              <div className="mt-7 flex max-w-md items-center gap-3 border-l-2 border-[#B88A3B] pl-4">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#B88A3B]" />

                <div>
                  <p className="text-xs font-bold text-[#243746]">
                    Official Municipal Portal
                  </p>

                  <p className="mt-0.5 text-[10px] leading-5 text-[#7A8790]">
                    Managed by Nagar Palika Parishad, Mainpuri.
                  </p>
                </div>
              </div>
            </div>

            {/* ===================================================
                QUICK NAVIGATION
            ==================================================== */}
            <div>
              <SectionTitle
                eyebrow="Explore"
                title="Quick Navigation"
              />

              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <FooterLink
                    key={link.name}
                    href={link.href}
                    label={link.name}
                  />
                ))}
              </ul>
            </div>

            {/* ===================================================
                CITIZEN SERVICES
            ==================================================== */}
            <div>
              <SectionTitle
                eyebrow="Services"
                title="Citizen Services"
              />

              <ul className="space-y-3">
                {citizenServices.map((link) => (
                  <FooterLink
                    key={link.name}
                    href={link.href}
                    label={link.name}
                  />
                ))}
              </ul>
            </div>

            {/* ===================================================
                CONTACT CARD
            ==================================================== */}
            <div>
              <div className="relative overflow-hidden rounded-2xl bg-[#203746] p-6 text-white shadow-[0_15px_40px_rgba(32,55,70,0.14)]">
                {/* Gold accent */}
                <div className="absolute left-0 top-0 h-full w-1 bg-[#B88A3B]" />

                {/* Decorative circle */}
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/10"
                />

                <div className="relative">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#D8B26A]">
                    Connect
                  </p>

                  <h3 className="mt-1 text-lg font-extrabold tracking-tight">
                    Contact Office
                  </h3>

                  <div className="mt-5 space-y-5">
                    {/* Address */}
                    <ContactItem
                      icon={MapPin}
                      title="Office Address"
                    >
                      Nagar Palika Parishad,
                      <br />
                      Mainpuri, Uttar Pradesh, India
                    </ContactItem>

                    {/* Phone */}
                    <ContactItem
                      icon={Phone}
                      title="Phone"
                    >
                      <a
                        href="tel:+910000000000"
                        className="transition-colors hover:text-[#D8B26A]"
                      >
                        +91 XXXXXXXXXX
                      </a>
                    </ContactItem>

                    {/* Email */}
                    <ContactItem
                      icon={Mail}
                      title="Email"
                    >
                      <a
                        href="mailto:official@mainpuri-npp.in"
                        className="break-all transition-colors hover:text-[#D8B26A]"
                      >
                        official@mainpuri-npp.in
                      </a>
                    </ContactItem>

                    {/* Office hours */}
                    <ContactItem
                      icon={Clock3}
                      title="Office Hours"
                    >
                      Monday – Saturday
                      <br />
                      10:00 AM – 5:00 PM
                    </ContactItem>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              DIVIDER
          ====================================================== */}
          <div className="my-12 h-px bg-[#D9D3C8]" />

          {/* =====================================================
              GOVERNMENT PARTNERS
          ====================================================== */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B88A3B]">
                Government Initiatives
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <PartnerBadge>
                  Government of Uttar Pradesh
                </PartnerBadge>

                <PartnerBadge>
                  Digital Citizen Services
                </PartnerBadge>

                <PartnerBadge>
                  Swachh Bharat Mission
                </PartnerBadge>

                <PartnerBadge>
                  Digital India
                </PartnerBadge>
              </div>
            </div>

            {/* Back to top */}
            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#B88A3B] bg-white px-5 py-2.5 text-[11px] font-bold text-[#334B5A] shadow-sm transition-all duration-200 hover:bg-[#B88A3B] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B88A3B] focus-visible:ring-offset-2"
            >
              <span>Back to Top</span>

              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          COPYRIGHT
      ========================================================== */}
      <div className="bg-[#1D303D] text-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">
                © {new Date().getFullYear()} Nagar Palika Parishad,
                Mainpuri. All Rights Reserved.
              </p>

              <p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-400">
                This website is intended to provide official municipal
                information and citizen services. For clarification
                regarding any information published on this portal,
                please contact the concerned municipal office.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span>Developed with</span>

              <Heart
                className="h-3 w-3 fill-red-400 text-red-400"
                aria-hidden="true"
              />

              <span className="text-slate-400">
                by SDV Edutech Pvt. Ltd.
              </span>

              <span className="mx-1 text-slate-600">•</span>

              <span>Last Updated: August 2026</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* =============================================================
   SECTION TITLE
============================================================= */

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <div className="mb-6">
      <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-[#B88A3B]">
        {eyebrow}
      </p>

      <h3 className="text-[15px] font-extrabold tracking-tight text-[#243746]">
        {title}
      </h3>

      <div className="mt-3 flex items-center gap-1">
        <div className="h-0.5 w-8 bg-[#B88A3B]" />
        <div className="h-0.5 w-2 bg-[#D9D3C8]" />
      </div>
    </div>
  )
}

/* =============================================================
   FOOTER LINK
============================================================= */

function FooterLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-2 text-[12px] font-medium text-[#667681] transition-all duration-200 hover:translate-x-1 hover:text-[#243746] focus:outline-none focus-visible:text-[#B88A3B]"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#D9D3C8] bg-white transition-all duration-200 group-hover:border-[#B88A3B] group-hover:bg-[#B88A3B]">
          <ChevronRight className="h-3 w-3 text-[#B88A3B] transition-colors group-hover:text-white" />
        </span>

        <span>{label}</span>
      </Link>
    </li>
  )
}

/* =============================================================
   CONTACT ITEM
============================================================= */

function ContactItem({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/6">
        <Icon className="h-3.5 w-3.5 text-[#D8B26A]" />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
          {title}
        </p>

        <div className="mt-1 text-[11px] leading-5 text-slate-200">
          {children}
        </div>
      </div>
    </div>
  )
}

/* =============================================================
   PARTNER BADGE
============================================================= */

function PartnerBadge({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="rounded-full border border-[#D9D3C8] bg-white px-3.5 py-2 text-[10px] font-bold text-[#687781] shadow-sm transition-all duration-200 hover:border-[#B88A3B] hover:text-[#243746]">
      {children}
    </div>
  )
}
