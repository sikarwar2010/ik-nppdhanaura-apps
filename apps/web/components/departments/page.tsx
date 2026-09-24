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
      desc: "गोवर्धन नगर क्षेत्र की सड़कों, नालियों, सार्वजनिक भवनों, मार्गों तथा अन्य नागरिक बुनियादी ढांचे के निर्माण, रखरखाव एवं प्रबंधन से संबंधित कार्य।",
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
      desc: "गृह एवं संपत्ति कर निर्धारण, स्थानीय करों, यूजर चार्ज तथा नगर पंचायत राजस्व के पारदर्शी संग्रह एवं प्रबंधन से संबंधित कार्य।",
      icon: <Coins className="h-7 w-7" />,
      color: "from-blue-500 via-indigo-500 to-violet-600",
      iconBg: "from-blue-500 to-indigo-600",
      badgeBg: "border-blue-200 bg-blue-50 text-blue-700",
      hoverBorder: "hover:border-blue-300",
      hoverShadow: "hover:shadow-blue-200/70",
      glow: "bg-blue-400/15",
      dot: "bg-blue-500",
      services: [
        "संपत्ति कर आकलन",
        "संपत्ति का नामांतरण",
        "कर भुगतान रसीद एवं एनओसी",
      ],
    },
    {
      name: "Water Supply Department",
      nameHi: "जल आपूर्ति विभाग",
      desc: "गोवर्धन क्षेत्र में पेयजल पाइपलाइन, जल कनेक्शन, जलापूर्ति व्यवस्था तथा जल संबंधी नागरिक शिकायतों के प्रबंधन एवं समाधान से संबंधित सेवाएं।",
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
        "जल बिल एवं जलापूर्ति संबंधी शिकायत",
      ],
    },
    {
      name: "Sanitation Department",
      nameHi: "स्वास्थ्य एवं स्वच्छता विभाग",
      desc: "गोवर्धन की स्वच्छता, घर-घर कचरा संग्रहण, ठोस अपशिष्ट प्रबंधन, फॉगिंग तथा सार्वजनिक स्थानों की साफ-सफाई व्यवस्था का संचालन।",
      icon: <Trash2 className="h-7 w-7" />,
      color: "from-emerald-400 via-green-500 to-teal-600",
      iconBg: "from-emerald-400 to-teal-600",
      badgeBg: "border-emerald-200 bg-emerald-50 text-emerald-700",
      hoverBorder: "hover:border-emerald-300",
      hoverShadow: "hover:shadow-emerald-200/70",
      glow: "bg-emerald-400/15",
      dot: "bg-emerald-500",
      services: [
        "कचरा प्रबंधन एवं सफाई शिकायत",
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
        "जन्म पंजीकरण एवं प्रमाण पत्र",
        "मृत्यु पंजीकरण एवं प्रमाण पत्र",
        "स्वास्थ्य एवं व्यापार लाइसेंस एनओसी",
      ],
    },
    {
      name: "Engineering & Town Planning",
      nameHi: "अभियांत्रिकी एवं नगर नियोजन",
      desc: "भवन निर्माण नक्शा स्वीकृति, नगर नियोजन, ज़ोनिंग नियम, अतिक्रमण नियंत्रण तथा गोवर्धन के सुव्यवस्थित नगरीय विकास से संबंधित कार्य।",
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
        "ज़ोनिंग विनियमन एवं नगर नियोजन",
      ],
    },
  ]

  return (
    <section
      id="digital-gateway"
      className="relative overflow-hidden bg-linear-to-br from-[#f5fff8] via-white to-[#f8fbff] px-4 py-20 font-sans md:px-8 md:py-24"
    >
      {/* =====================================================
          PREMIUM BACKGROUND GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#087f5b 1px, transparent 1px), linear-gradient(90deg, #087f5b 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* =====================================================
          COLORFUL AMBIENT GLOWS
      ====================================================== */}

      <div className="pointer-events-none absolute -left-32 top-10 h-105 w-105 rounded-full bg-emerald-300/20 blur-[130px]" />

      <div className="pointer-events-none absolute -right-32 top-1/4 h-112.5 w-112.5 rounded-full bg-sky-300/20 blur-[140px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-100 w-100 rounded-full bg-violet-300/15 blur-[140px]" />

      <div className="pointer-events-none absolute right-1/3 bottom-20 h-75 w-75 rounded-full bg-amber-300/10 blur-[120px]" />

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
          <span className="group inline-flex cursor-default items-center gap-2 rounded-full border border-emerald-200 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-2 text-[10px] font-black tracking-[0.15em] text-emerald-700 uppercase shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-lg hover:shadow-emerald-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
              <Landmark className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-6" />
            </span>

            नगर पंचायत गोवर्धन, मथुरा
          </span>

          <h2 className="font-serif text-3xl font-black tracking-tight text-[#123247] md:text-5xl">
            Departments of{" "}
            <span className="bg-linear-to-r from-emerald-500 via-green-600 to-orange-500 bg-clip-text text-transparent">
              Goverdhan
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-sm font-medium leading-7 text-slate-600 md:text-base">
            नगर पंचायत गोवर्धन, मथुरा के विभिन्न विभागों द्वारा उपलब्ध कराई
            जाने वाली नागरिक सेवाएं, आवेदन सुविधाएं एवं शिकायत निवारण
            प्रणाली एक ही डिजिटल प्लेटफॉर्म पर।
          </p>

          <div className="mx-auto flex items-center justify-center gap-2 pt-2">
            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-emerald-400 to-teal-500" />

            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
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

              {/* Top Gradient Bar */}

              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-linear-to-r ${dept.color} transition-all duration-500 group-hover:h-2`}
              />

              {/* Card Glow */}

              <div
                className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full ${dept.glow} opacity-70 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-100`}
              />

              {/* Decorative Circle */}

              <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 overflow-hidden">
                <div
                  className={`absolute -right-14 -top-14 h-32 w-32 rounded-full bg-linear-to-br ${dept.color} opacity-[0.06] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.12]`}
                />
              </div>

              {/* MAIN CONTENT */}

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

                {/* Titles */}

                <div className="mt-6 space-y-1.5">

                  <span className="block text-[10px] font-black tracking-[0.13em] text-slate-500 uppercase transition-colors duration-300 group-hover:text-emerald-700">
                    {dept.nameHi}
                  </span>

                  <h3 className="font-serif text-xl font-black tracking-tight text-[#123247] transition-colors duration-300 group-hover:text-emerald-700">
                    {dept.name}
                  </h3>

                </div>

                {/* Description */}

                <p className="mt-4 text-xs font-medium leading-6 text-slate-600 md:text-sm">
                  {dept.desc}
                </p>

                {/* SERVICES */}

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

                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dept.dot} shadow-sm transition-all duration-300 group-hover:scale-150`}
                        />

                        <span className="leading-5 transition-colors duration-300 group-hover/service:text-emerald-700">
                          {service}
                        </span>

                      </div>
                    ))}

                  </div>
                </div>

              </div>

              {/* CARD FOOTER */}

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
                    className={`group/action flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r ${dept.iconBg} px-3.5 py-2 text-[10px] font-black text-white opacity-90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:opacity-100 hover:shadow-lg`}
                  >
                    <span>सेवाएं देखें</span>

                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/action:translate-x-1" />
                  </button>

                </div>

              </div>

              {/* Bottom Glow */}

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
          className="group relative mt-12 overflow-hidden rounded-[28px] border border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-lime-50 p-7 shadow-[0_15px_45px_rgba(18,50,71,0.06)] transition-all duration-500 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_25px_60px_rgba(16,185,129,0.14)] md:p-9"
        >

          {/* Grid */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(#087f5b 1px, transparent 1px), linear-gradient(90deg, #087f5b 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />

          {/* Glow */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl transition-all duration-500 group-hover:bg-lime-300/30" />

          <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-teal-300/15 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-6 text-center md:flex-row md:text-left">

            {/* Icon */}

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 via-teal-500 to-lime-500 text-white shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
              <Landmark className="h-6 w-6" />
            </div>

            {/* Text */}

            <div className="flex-1">

              <p className="text-[9px] font-black tracking-[0.15em] text-emerald-600 uppercase">
                Digital Governance
              </p>

              <h3 className="mt-1 font-serif text-xl font-black text-[#123247] md:text-2xl">
                गोवर्धन की नागरिक सेवाएं एक ही स्थान पर
              </h3>

              <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-600 md:text-sm">
                नगर पंचायत गोवर्धन, मथुरा की नागरिक सेवाओं, शिकायत
                निवारण एवं आवश्यक ऑनलाइन सुविधाओं तक सरल डिजिटल पहुंच
                प्राप्त करें।
              </p>

            </div>

            {/* CTA */}

            <a
              href="/services"
              className="group/cta flex shrink-0 items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-emerald-500 hover:to-lime-500 hover:shadow-xl hover:shadow-emerald-200"
            >
              सभी सेवाएं देखें

              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
            </a>

          </div>

        </m.div>

      </div>
    </section>
  )
}
