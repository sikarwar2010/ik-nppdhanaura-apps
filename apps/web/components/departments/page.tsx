"use client"

import { m } from "framer-motion"
import {
  ArrowRight,
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

interface DepartmentCard {
  name: string
  nameHi: string
  desc: string
  icon: React.ReactNode
  color: string
  iconBg: string
  badgeBg: string
  hoverBorder: string
  hoverShadow: string
  glow: string
  dot: string
  services: string[]
}

export default function Departments() {
  const departments: DepartmentCard[] = [
    {
      name: "Public Works Department",
      nameHi: "लोक निर्माण विभाग",
      desc: "मैनपुरी नगर की सड़कों, मुख्य मार्गों, प्रशासनिक भवनों, नालियों और सार्वजनिक बुनियादी ढांचे के निर्माण, रखरखाव एवं प्रबंधन से संबंधित कार्य।",
      icon: <HardHat className="h-7 w-7" />,
      color: "from-amber-400 via-orange-500 to-red-500",
      iconBg: "from-amber-400 to-orange-500",
      badgeBg: "border-amber-200 bg-amber-50 text-amber-700",
      hoverBorder: "hover:border-amber-300",
      hoverShadow: "hover:shadow-amber-200/70",
      glow: "bg-amber-400/15",
      dot: "bg-amber-500",
      services: [
        "सड़क क्षति एवं मरम्मत रिपोर्टिंग",
        "सड़क खुदाई अनुमति एवं ट्रेंचिंग एनओसी",
        "सार्वजनिक प्रकाश एवं सुरक्षा व्यवस्था",
      ],
    },
    {
      name: "Revenue Department",
      nameHi: "राजस्व विभाग",
      desc: "गृह एवं संपत्ति कर निर्धारण, स्थानीय करों, यूजर चार्ज तथा नगरपालिका राजस्व के पारदर्शी संग्रह एवं प्रबंधन से संबंधित कार्य।",
      icon: <Coins className="h-7 w-7" />,
      color: "from-blue-500 via-indigo-500 to-violet-600",
      iconBg: "from-blue-500 to-indigo-600",
      badgeBg: "border-blue-200 bg-blue-50 text-blue-700",
      hoverBorder: "hover:border-blue-300",
      hoverShadow: "hover:shadow-blue-200/70",
      glow: "bg-blue-400/15",
      dot: "bg-blue-500",
      services: [
        "स्वयं संपत्ति कर आकलन",
        "संपत्ति का नामांतरण",
        "कर भुगतान रसीद एवं एनओसी",
      ],
    },
    {
      name: "Water Supply Department",
      nameHi: "जल आपूर्ति विभाग",
      desc: "पेयजल पाइपलाइन नेटवर्क, जल टैंक, जल कनेक्शन एवं जल संबंधी शिकायतों के प्रबंधन और त्वरित समाधान से संबंधित सेवाएं।",
      icon: <Droplet className="h-7 w-7" />,
      color: "from-cyan-400 via-sky-500 to-blue-600",
      iconBg: "from-cyan-400 to-blue-600",
      badgeBg: "border-cyan-200 bg-cyan-50 text-cyan-700",
      hoverBorder: "hover:border-cyan-300",
      hoverShadow: "hover:shadow-cyan-200/70",
      glow: "bg-cyan-400/15",
      dot: "bg-cyan-500",
      services: [
        "नया जल कनेक्शन अनुरोध",
        "पाइपलाइन लीकेज एवं मरम्मत शिकायत",
        "जल बिल विवाद समाधान",
      ],
    },
    {
      name: "Sanitation Department",
      nameHi: "स्वास्थ्य एवं स्वच्छता विभाग",
      desc: "घर-घर कचरा संग्रहण, ठोस अपशिष्ट प्रबंधन, स्वच्छता अभियान, फॉगिंग तथा नगर की साफ-सफाई व्यवस्था का संचालन।",
      icon: <Trash2 className="h-7 w-7" />,
      color: "from-emerald-400 via-green-500 to-teal-600",
      iconBg: "from-emerald-400 to-teal-600",
      badgeBg: "border-emerald-200 bg-emerald-50 text-emerald-700",
      hoverBorder: "hover:border-emerald-300",
      hoverShadow: "hover:shadow-emerald-200/70",
      glow: "bg-emerald-400/15",
      dot: "bg-emerald-500",
      services: [
        "कचरा प्रबंधन एवं डंपिंग रिपोर्टिंग",
        "मच्छर रोधी फॉगिंग एवं स्प्रे अनुरोध",
        "सार्वजनिक सफाई शिकायत निवारण",
      ],
    },
    {
      name: "Health Department",
      nameHi: "लोक स्वास्थ्य विभाग",
      desc: "जन्म एवं मृत्यु पंजीकरण, नागरिक जीवन अभिलेख तथा सार्वजनिक स्वास्थ्य और स्वच्छता से संबंधित आवश्यक सेवाओं का प्रबंधन।",
      icon: <HeartPulse className="h-7 w-7" />,
      color: "from-rose-400 via-pink-500 to-red-600",
      iconBg: "from-rose-400 to-red-600",
      badgeBg: "border-rose-200 bg-rose-50 text-rose-700",
      hoverBorder: "hover:border-rose-300",
      hoverShadow: "hover:shadow-rose-200/70",
      glow: "bg-rose-400/15",
      dot: "bg-rose-500",
      services: [
        "ऑनलाइन जन्म पंजीकरण एवं प्रमाण पत्र",
        "ऑनलाइन मृत्यु पंजीकरण",
        "स्वास्थ्य एवं व्यापार लाइसेंस एनओसी",
      ],
    },
    {
      name: "Engineering & Town Planning",
      nameHi: "अभियांत्रिकी एवं नगर नियोजन",
      desc: "भवन निर्माण नक्शा स्वीकृति, नगर नियोजन, ज़ोनिंग नियम, अतिक्रमण नियंत्रण तथा नियोजित शहरी विकास से संबंधित कार्य।",
      icon: <Hammer className="h-7 w-7" />,
      color: "from-violet-500 via-purple-600 to-indigo-700",
      iconBg: "from-violet-500 to-indigo-600",
      badgeBg: "border-violet-200 bg-violet-50 text-violet-700",
      hoverBorder: "hover:border-violet-300",
      hoverShadow: "hover:shadow-violet-200/70",
      glow: "bg-violet-400/15",
      dot: "bg-violet-500",
      services: [
        "भवन योजना एवं नक्शा स्वीकृति",
        "अतिक्रमण नियंत्रण एवं कार्रवाई",
        "ज़ोनिंग विनियमन एवं लैंड यूज़",
      ],
    },
  ]

  return (
    <section
      id="digital-gateway"
      className="relative overflow-hidden bg-linear-to-br from-[#fffdf8] via-[#f7fbff] to-[#faf7ff] px-4 py-20 font-sans md:px-8 md:py-24"
    >
      {/* =====================================================
          BACKGROUND GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#123247 1px, transparent 1px), linear-gradient(90deg, #123247 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* =====================================================
          COLORFUL BACKGROUND GLOWS
      ====================================================== */}

      <div className="pointer-events-none absolute -left-32 top-10 h-100 w-100 rounded-full bg-amber-300/20 blur-[130px]" />

      <div className="pointer-events-none absolute -right-32 top-1/4 h-112.5 w-112.5 rounded-full bg-sky-300/20 blur-[140px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-100 w-100 rounded-full bg-violet-300/15 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* =====================================================
            SECTION HEADER
        ====================================================== */}

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-3xl space-y-5 text-center"
        >
          {/* Badge */}

          <span className="group inline-flex cursor-default items-center gap-2 rounded-full border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-2 text-[10px] font-black tracking-[0.15em] text-orange-700 uppercase shadow-sm transition-all duration-300 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-sm">
              <Landmark className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-6" />
            </span>

            नगर पालिका परिषद, मैनपुरी
          </span>

          {/* Heading */}

          <h2 className="font-serif text-3xl font-black tracking-tight text-[#123247] md:text-5xl">
            Departments of{" "}
            <span className="bg-linear-to-r from-amber-500 via-pink-500 to-violet-600 bg-clip-text text-transparent">
              Mainpuri
            </span>
          </h2>

          {/* Description */}

          <p className="text-sm font-medium leading-7 text-slate-600 md:text-base">
            नगर पालिका परिषद, मैनपुरी के विभिन्न विभागों
            द्वारा उपलब्ध कराई जाने वाली नागरिक सेवाएं,
            आवेदन सुविधाएं एवं शिकायत निवारण प्रणाली एक
            ही डिजिटल प्लेटफॉर्म पर।
          </p>

          {/* Decorative separator */}

          <div className="mx-auto flex items-center justify-center gap-2 pt-2">
            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-amber-400 to-orange-500" />

            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-violet-50">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            </span>

            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-sky-500 to-violet-500" />
          </div>
        </m.div>

        {/* =====================================================
            DEPARTMENT GRID
        ====================================================== */}

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept, index) => (
            <m.div
              key={dept.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: index * 0.08,
                duration: 0.5,
              }}
              className={`group relative flex min-h-117.5 flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-7 shadow-[0_12px_35px_rgba(18,50,71,0.06)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 ${dept.hoverBorder} ${dept.hoverShadow} hover:shadow-[0_25px_60px_rgba(18,50,71,0.14)]`}
            >
              {/* =================================================
                  TOP COLOR BAR
              ================================================== */}

              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-linear-to-r ${dept.color} transition-all duration-500 group-hover:h-2`}
              />

              {/* =================================================
                  COLORFUL CARD GLOW
              ================================================== */}

              <div
                className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full ${dept.glow} opacity-70 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-100`}
              />

              {/* =================================================
                  DECORATIVE CIRCLE
              ================================================== */}

              <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 overflow-hidden">
                <div
                  className={`absolute -right-14 -top-14 h-32 w-32 rounded-full bg-linear-to-br ${dept.color} opacity-[0.06] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.12]`}
                />
              </div>

              {/* =================================================
                  MAIN CONTENT
              ================================================== */}

              <div className="relative z-10">

                {/* Header */}

                <div className="flex items-start justify-between gap-4">

                  {/* Icon */}

                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${dept.iconBg} text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl`}
                  >
                    {dept.icon}
                  </div>

                  {/* Status */}

                  <span
                    className={`rounded-full border px-3 py-1.5 text-[9px] font-black tracking-wider uppercase transition-all duration-300 group-hover:scale-105 ${dept.badgeBg}`}
                  >
                    सक्रिय सेवा
                  </span>
                </div>

                {/* =================================================
                    TITLES
                ================================================== */}

                <div className="mt-6 space-y-1.5">

                  <span
                    className={`block text-[10px] font-black tracking-[0.13em] uppercase transition-colors duration-300 group-hover:text-slate-900`}
                  >
                    {dept.nameHi}
                  </span>

                  <h3 className="font-serif text-xl font-black tracking-tight text-[#123247] transition-all duration-300 group-hover:translate-x-0.5">
                    {dept.name}
                  </h3>

                </div>

                {/* =================================================
                    DESCRIPTION
                ================================================== */}

                <p className="mt-4 text-xs leading-6 font-medium text-slate-600 md:text-sm">
                  {dept.desc}
                </p>

                {/* =================================================
                    SERVICES
                ================================================== */}

                <div className="mt-6 border-t border-slate-100 pt-5">

                  <p className="mb-3 text-[9px] font-black tracking-[0.15em] text-slate-400 uppercase">
                    प्रमुख सेवाएं
                  </p>

                  <div className="space-y-3">

                    {dept.services.map((service) => (
                      <div
                        key={service}
                        className="group/service flex items-start gap-3 text-xs font-semibold text-slate-700"
                      >
                        {/* Color dot */}

                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dept.dot} shadow-sm transition-all duration-300 group-hover:scale-150`}
                        />

                        <span className="leading-5 transition-colors duration-300 group-hover/service:text-[#123247]">
                          {service}
                        </span>
                      </div>
                    ))}

                  </div>
                </div>
              </div>

              {/* =================================================
                  CARD FOOTER
              ================================================== */}

              <div className="relative z-10 mt-7 border-t border-slate-100 pt-4">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span
                      className={`h-2 w-2 rounded-full ${dept.dot} shadow-sm`}
                    />

                    <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                      Citizen Services
                    </span>

                  </div>

                  <button
                    type="button"
                    className={`group/action flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r ${dept.iconBg} px-3.5 py-2 text-[10px] font-black text-white opacity-90 shadow-sm transition-all duration-300 hover:scale-105 hover:opacity-100 hover:shadow-lg`}
                  >
                    <span>सेवाएं देखें</span>

                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/action:translate-x-1" />
                  </button>

                </div>
              </div>

              {/* =================================================
                  HOVER BOTTOM GLOW
              ================================================== */}

              <div
                className={`pointer-events-none absolute bottom-0 left-1/2 h-1 w-0 -translate-x-1/2 rounded-full bg-linear-to-r ${dept.color} opacity-0 blur-sm transition-all duration-500 group-hover:w-3/4 group-hover:opacity-100`}
              />
            </m.div>
          ))}
        </div>

        {/* =====================================================
            BOTTOM CITIZEN CTA
        ====================================================== */}

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="group relative mt-12 overflow-hidden rounded-[28px] border border-violet-200 bg-linear-to-r from-amber-50 via-white to-violet-50 p-7 shadow-[0_15px_45px_rgba(18,50,71,0.06)] transition-all duration-500 hover:shadow-[0_25px_60px_rgba(124,58,237,0.12)] md:p-9"
        >
          {/* Grid */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(#123247 1px, transparent 1px), linear-gradient(90deg, #123247 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />

          {/* Glow */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-300/20 blur-3xl transition-all duration-500 group-hover:bg-pink-300/30" />

          <div className="relative z-10 flex flex-col items-center gap-6 text-center md:flex-row md:text-left">

            {/* Icon */}

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 via-indigo-500 to-sky-500 text-white shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
              <Landmark className="h-6 w-6" />
            </div>

            {/* Text */}

            <div className="flex-1">

              <p className="text-[9px] font-black tracking-[0.15em] text-violet-600 uppercase">
                Digital Governance
              </p>

              <h3 className="mt-1 font-serif text-xl font-black text-[#123247] md:text-2xl">
                सभी नगरपालिका सेवाएं एक ही स्थान पर
              </h3>

              <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-600 md:text-sm">
                नगर पालिका परिषद, मैनपुरी की नागरिक सेवाओं,
                शिकायत निवारण एवं आवश्यक ऑनलाइन सुविधाओं
                तक सरल डिजिटल पहुंच प्राप्त करें।
              </p>

            </div>

            {/* CTA */}

            <button
              type="button"
              className="group/cta flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-[#123247] to-[#24556D] px-5 py-3 text-xs font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-violet-600 hover:to-indigo-600 hover:shadow-xl hover:shadow-violet-200"
            >
              सभी सेवाएं देखें

              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
            </button>

          </div>
        </m.div>
      </div>
    </section>
  )
}
