"use client"

import { m } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Droplet,
  Hammer,
  HardHat,
  HeartPulse,
  Landmark,
  Sparkles,
  Trash2,
} from "lucide-react"
import React from "react"

/* =========================================================
   TYPES
========================================================= */

interface DepartmentCard {
  name: string
  nameHi: string
  shortCode: string
  desc: string
  icon: React.ReactNode
  services: string[]
}

/* =========================================================
   DEPARTMENTS
========================================================= */

const departments: DepartmentCard[] = [
  {
    name: "Public Works Department",
    nameHi: "लोक निर्माण विभाग",
    shortCode: "PWD",
    desc:
      "नगर की सड़कों, नालियों, सार्वजनिक भवनों, मार्ग प्रकाश व्यवस्था और नागरिक आधारभूत संरचना के रखरखाव एवं विकास का दायित्व।",
    icon: <HardHat className="h-6 w-6" />,
    services: [
      "Road Damage Reporting",
      "Road Cut / Trenching Permission",
      "NOC & Civic Infrastructure",
    ],
  },
  {
    name: "Revenue Department",
    nameHi: "राजस्व विभाग",
    shortCode: "REV",
    desc:
      "संपत्ति कर, स्थानीय कर संग्रह, संपत्ति अभिलेख तथा नगर पालिका से संबंधित राजस्व सेवाओं का प्रबंधन।",
    icon: <Coins className="h-6 w-6" />,
    services: [
      "Property Tax Services",
      "Property Mutation",
      "Tax & NOC Services",
    ],
  },
  {
    name: "Water Supply Department",
    nameHi: "जल आपूर्ति विभाग",
    shortCode: "WTR",
    desc:
      "नागरिकों को जलापूर्ति, जल कनेक्शन, बिल संबंधी सेवाएं तथा पाइपलाइन रखरखाव जैसी सुविधाएं उपलब्ध कराना।",
    icon: <Droplet className="h-6 w-6" />,
    services: [
      "New Water Connection",
      "Water Bill Services",
      "Water Supply Complaint",
    ],
  },
  {
    name: "Sanitation Department",
    nameHi: "स्वास्थ्य एवं स्वच्छता विभाग",
    shortCode: "SAN",
    desc:
      "स्वच्छता, कचरा संग्रहण, ठोस अपशिष्ट प्रबंधन, सार्वजनिक सफाई तथा स्वच्छ नगर अभियान का संचालन।",
    icon: <Trash2 className="h-6 w-6" />,
    services: [
      "Garbage Complaint",
      "Sanitation Request",
      "Community Bin Request",
    ],
  },
  {
    name: "Health Department",
    nameHi: "लोक स्वास्थ्य विभाग",
    shortCode: "HLT",
    desc:
      "जन्म एवं मृत्यु पंजीकरण, सार्वजनिक स्वास्थ्य सेवाओं तथा नागरिक स्वास्थ्य से संबंधित नगर पालिका कार्यों का संचालन।",
    icon: <HeartPulse className="h-6 w-6" />,
    services: [
      "Birth Registration",
      "Death Registration",
      "Health & Hygiene Services",
    ],
  },
  {
    name: "Engineering & Town Planning",
    nameHi: "अभियांत्रिकी एवं नगर नियोजन",
    shortCode: "ENG",
    desc:
      "भवन अनुमति, निर्माण संबंधी स्वीकृतियां, नगर नियोजन, विकास कार्यों और निर्माण गतिविधियों की निगरानी।",
    icon: <Hammer className="h-6 w-6" />,
    services: [
      "Building Plan Approval",
      "Construction NOC",
      "Town Planning Services",
    ],
  },
]

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function DigitalGateway() {
  return (
    <section
      id="digital-gateway"
      className="relative overflow-hidden bg-[#F7F5F0] px-4 py-20 font-sans sm:py-24 md:px-8 lg:py-28"
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-45 -top-45 h-125 w-125 rounded-full bg-[#C69A45]/5.5 blur-[110px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-45 -right-45 h-130 w-130 rounded-full bg-[#123247]/6 blur-[120px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-105 w-105 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C69A45]/2.5 blur-[100px]"
      />

      {/* =====================================================
          ARCHITECTURAL GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #123247 1px, transparent 1px), linear-gradient(#123247 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* ===================================================
            SECTION HEADER
        ==================================================== */}

        <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
          <m.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.55,
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#C69A45]/25 bg-[#C69A45]/[0.07] px-4 py-2"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C69A45]/10">
              <Sparkles className="h-3 w-3 text-[#A9792F]" />
            </span>

            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#96702F] sm:text-[10px]">
              Nagar Palika Parishad • Mainpuri
            </span>
          </m.div>

          <m.h2
            initial={{
              opacity: 0,
              y: 15,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
              delay: 0.06,
            }}
            className="mt-5 font-serif text-3xl font-black tracking-tight text-[#123247] sm:text-4xl md:text-5xl"
          >
            Digital Service Gateway
          </m.h2>

          <m.p
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
              delay: 0.12,
            }}
            className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-[#687781] md:text-base"
          >
            Access essential municipal departments and citizen
            services through a single, secure and convenient
            digital gateway of Nagar Palika Parishad, Mainpuri.
          </m.p>

          {/* Divider */}

          <div className="mt-7 flex items-center justify-center gap-2">
            <span className="h-0.5 w-14 rounded-full bg-[#C69A45]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#123247]" />
            <span className="h-0.5 w-4 rounded-full bg-[#D8B26A]" />
          </div>
        </div>

        {/* ===================================================
            DEPARTMENT GRID
        ==================================================== */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept, index) => (
            <m.article
              key={dept.name}
              initial={{
                opacity: 0,
                y: 25,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.1,
              }}
              transition={{
                duration: 0.55,
                delay: index * 0.06,
              }}
              className="group relative flex min-h-97.5 flex-col overflow-hidden rounded-[24px] border border-[#DDD8CF] bg-white shadow-[0_10px_35px_rgba(18,50,71,0.055)] transition-all duration-400 hover:-translate-y-1.5 hover:border-[#C69A45]/40 hover:shadow-[0_22px_55px_rgba(18,50,71,0.11)]"
            >
              {/* =================================================
                  TOP GOLD ACCENT
              ================================================== */}

              <div className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-[#A9792F] via-[#D8B26A] to-[#A9792F] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

              {/* =================================================
                  CARD HEADER
              ================================================== */}

              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Icon */}

                  <div className="relative">
                    <div className="absolute -inset-2 rounded-2xl bg-[#C69A45]/6 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D9D3C8] bg-[#F7F5F0] text-[#123247] transition-all duration-300 group-hover:border-[#C69A45]/40 group-hover:bg-[#123247] group-hover:text-[#D8B26A]">
                      {dept.icon}
                    </div>
                  </div>

                  {/* Department Code */}

                  <span className="rounded-full border border-[#E4DFD5] bg-[#FAF9F6] px-2.5 py-1 text-[8px] font-black tracking-[0.15em] text-[#7C898F]">
                    {dept.shortCode}
                  </span>
                </div>

                {/* =================================================
                    TITLE
                ================================================== */}

                <div className="mt-5">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#A9792F]">
                    {dept.nameHi}
                  </span>

                  <h3 className="mt-1.5 text-[18px] font-black leading-snug tracking-tight text-[#183548] transition-colors duration-300 group-hover:text-[#A9792F]">
                    {dept.name}
                  </h3>
                </div>

                {/* Description */}

                <p className="mt-3 text-[11px] font-medium leading-5 text-[#687781]">
                  {dept.desc}
                </p>
              </div>

              {/* =================================================
                  SERVICES
              ================================================== */}

              <div className="mx-6 border-t border-[#ECE8E0] pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.16em] text-[#8A969D]">
                    Key Services
                  </span>

                  <span className="flex items-center gap-1 text-[8px] font-bold text-[#A9792F]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C69A45]" />
                    Available
                  </span>
                </div>

                <div className="space-y-2.5">
                  {dept.services.map((service) => (
                    <div
                      key={service}
                      className="group/service flex items-center gap-2.5 text-[10px] font-semibold text-[#526571]"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F7F5F0] text-[#A9792F] transition-colors group-hover/service:bg-[#C69A45]/10">
                        <CheckCircle2 className="h-3 w-3" />
                      </span>

                      <span className="transition-colors group-hover/service:text-[#183548]">
                        {service}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* =================================================
                  CARD FOOTER
              ================================================== */}

              <div className="mt-auto px-6 pb-6 pt-6">
                <a
                  href="#citizen-services"
                  className="group/link flex h-10 w-full items-center justify-between rounded-xl border border-[#D9D3C8] bg-[#FAF9F6] px-3.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#526571] transition-all duration-300 hover:border-[#C69A45]/40 hover:bg-[#123247] hover:text-white"
                >
                  <span>View Department Services</span>

                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[#A9792F] shadow-sm transition-all duration-300 group-hover/link:bg-[#C69A45] group-hover/link:text-white">
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5" />
                  </span>
                </a>
              </div>

              {/* Hover highlight */}

              <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-linear-to-r from-transparent via-[#C69A45] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </m.article>
          ))}
        </div>

        {/* ===================================================
            BOTTOM INFORMATION BAR
        ==================================================== */}

        <m.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
            delay: 0.2,
          }}
          className="mt-7 overflow-hidden rounded-2xl border border-[#D9D3C8] bg-[#123247] shadow-[0_15px_40px_rgba(18,50,71,0.10)]"
        >
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C69A45]/10 text-[#D8B26A]">
                <Landmark className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#D8B26A]">
                  Official Municipal Services
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-slate-300">
                  Nagar Palika Parishad, Mainpuri • Government of Uttar Pradesh
                </p>
              </div>
            </div>

            <a
              href="#citizen-services"
              className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:text-[#D8B26A]"
            >
              Explore All Services

              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </m.div>
      </div>
    </section>
  )
}
