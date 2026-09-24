"use client"

import { AnimatePresence, m } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Landmark,
  Leaf,
  MapPin,
  Sparkles,
  Users,
  Waves,
  X,
} from "lucide-react"
import Link from "next/link"
import React, { useState } from "react"

interface SchemeItem {
  id: string
  title: string
  titleHi: string
  desc: string
  icon: React.ReactNode
  objectives: string[]
  badge: string
  theme: string
  iconTheme: string
  badgeTheme: string
  glow: string
}

export default function Schemes() {
  const [selectedScheme, setSelectedScheme] =
    useState<SchemeItem | null>(null)

  const schemes: SchemeItem[] = [
    {
      id: "pmay",
      title: "Pradhan Mantri Awas Yojana",
      titleHi: "प्रधानमंत्री आवास योजना (शहरी)",
      desc:
        "गोवर्धन नगर क्षेत्र के पात्र आर्थिक रूप से कमजोर एवं निम्न आय वर्ग के परिवारों को सुरक्षित, सम्मानजनक एवं किफायती पक्का आवास उपलब्ध कराने के लिए आवासीय सहायता।",
      icon: <Home className="h-7 w-7" />,
      badge: "आवास योजना",
      theme: "from-orange-400 via-amber-500 to-red-500",
      iconTheme: "from-orange-400 to-red-500",
      badgeTheme:
        "border-orange-200 bg-orange-50 text-orange-700",
      glow: "bg-orange-400/20",
      objectives: [
        "पात्र लाभार्थियों को आवास निर्माण हेतु वित्तीय सहायता",
        "लाभार्थी बैंक खाते में DBT के माध्यम से सहायता",
        "महिला सह-स्वामित्व को प्राथमिकता",
      ],
    },

    {
      id: "swachh-bharat",
      title: "Swachh Bharat Mission",
      titleHi: "स्वच्छ भारत मिशन (शहरी)",
      desc:
        "पवित्र तीर्थ नगरी गोवर्धन को स्वच्छ, सुंदर एवं स्वस्थ बनाए रखने के लिए घर-घर कचरा संग्रहण, ठोस अपशिष्ट प्रबंधन, स्वच्छता जागरूकता एवं सार्वजनिक स्थानों की सफाई को बढ़ावा देना।",
      icon: <Leaf className="h-7 w-7" />,
      badge: "स्वच्छता",
      theme: "from-emerald-400 via-green-500 to-teal-600",
      iconTheme: "from-emerald-400 to-teal-600",
      badgeTheme:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      glow: "bg-emerald-400/20",
      objectives: [
        "घर-घर ठोस कचरा संग्रहण एवं प्रबंधन",
        "गीले एवं सूखे कचरे का पृथक्करण",
        "गोवर्धन परिक्रमा मार्ग एवं सार्वजनिक स्थलों की स्वच्छता",
      ],
    },

    {
      id: "nulm",
      title: "DAY-NULM",
      titleHi: "राष्ट्रीय शहरी आजीविका मिशन",
      desc:
        "गोवर्धन क्षेत्र के शहरी गरीब परिवारों एवं युवाओं को कौशल विकास, स्वरोजगार, स्वयं सहायता समूह एवं छोटे व्यवसायों के माध्यम से आर्थिक रूप से सशक्त बनाने की पहल।",
      icon: <Users className="h-7 w-7" />,
      badge: "आजीविका",
      theme: "from-blue-500 via-indigo-500 to-violet-600",
      iconTheme: "from-blue-500 to-violet-600",
      badgeTheme:
        "border-blue-200 bg-blue-50 text-blue-700",
      glow: "bg-blue-400/20",
      objectives: [
        "महिला स्वयं सहायता समूहों को प्रोत्साहन",
        "युवाओं के लिए कौशल विकास एवं प्रशिक्षण",
        "स्वरोजगार हेतु ऋण एवं बैंक लिंकेज",
      ],
    },

    {
      id: "water",
      title: "Urban Water Supply",
      titleHi: "शहरी पेयजल एवं जल आपूर्ति",
      desc:
        "नगर पंचायत गोवर्धन के नागरिकों एवं तीर्थयात्रियों के लिए सुरक्षित पेयजल उपलब्ध कराने हेतु जल पाइपलाइन, जल टैंक, घरेलू कनेक्शन एवं जल गुणवत्ता से संबंधित सुविधाओं का विकास।",
      icon: <Waves className="h-7 w-7" />,
      badge: "पेयजल",
      theme: "from-cyan-400 via-sky-500 to-blue-600",
      iconTheme: "from-cyan-400 to-blue-600",
      badgeTheme:
        "border-cyan-200 bg-cyan-50 text-cyan-700",
      glow: "bg-cyan-400/20",
      objectives: [
        "नगर के विभिन्न वार्डों में घरेलू जल कनेक्शन",
        "जल गुणवत्ता परीक्षण एवं क्लोरीनेशन",
        "जल आपूर्ति व्यवस्था एवं सार्वजनिक पेयजल सुविधाओं का सुधार",
      ],
    },
  ]

  return (
    <section
      id="government-schemes"
      className="relative overflow-hidden bg-linear-to-br from-[#f4fbf6] via-[#ffffff] to-[#f5fbf8] px-4 py-20 font-sans text-slate-900 md:px-8 md:py-24"
    >
      {/* =====================================================
          PREMIUM LIGHT GREEN GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(#16704d 1px, transparent 1px), linear-gradient(90deg, #16704d 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* =====================================================
          COLORFUL AMBIENT GLOWS
      ====================================================== */}

      <div className="pointer-events-none absolute -left-40 top-10 h-105 w-105 rounded-full bg-emerald-300/20 blur-[140px]" />

      <div className="pointer-events-none absolute -right-40 top-1/3 h-112.5 w-112.5 rounded-full bg-cyan-300/20 blur-[140px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-105 w-105 rounded-full bg-orange-300/15 blur-[140px]" />

      <div className="pointer-events-none absolute right-1/4 bottom-10 h-75 w-75 rounded-full bg-violet-300/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* =====================================================
            SECTION HEADER
        ====================================================== */}

        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          {/* Badge */}

          <div className="group mb-5 inline-flex cursor-default items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-[10px] font-black tracking-[0.15em] text-emerald-700 uppercase shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg hover:shadow-emerald-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-white shadow-sm transition-transform duration-300 group-hover:rotate-12">
              <Sparkles className="h-3.5 w-3.5" />
            </span>

            नगर पंचायत गोवर्धन, मथुरा
          </div>

          {/* Heading */}

          <h1 className="font-serif text-3xl font-black tracking-tight text-[#124638] md:text-5xl">
            Government{" "}
            <span className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              Schemes
            </span>
          </h1>

          <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
            नागरिक कल्याण एवं विकास योजनाएं
          </p>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 font-medium text-slate-600 md:text-base">
            नगर पंचायत गोवर्धन, मथुरा के नागरिकों के आवास,
            स्वच्छता, पेयजल, आजीविका एवं समग्र विकास से संबंधित
            प्रमुख सरकारी योजनाओं की जानकारी एक ही स्थान पर।
          </p>

          {/* Separator */}

          <div className="mx-auto mt-7 flex items-center justify-center gap-2">
            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-emerald-400 to-teal-500" />

            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200 bg-orange-50">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            </span>

            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-cyan-500 to-emerald-600" />
          </div>
        </m.div>

        {/* =====================================================
            SCHEMES GRID
        ====================================================== */}

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-4">
          {schemes.map((scheme, index) => (
            <m.article
              key={scheme.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: index * 0.08,
                duration: 0.5,
              }}
              className="group relative flex min-h-117.5 flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_12px_35px_rgba(18,70,56,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:border-emerald-300 hover:shadow-[0_25px_65px_rgba(16,120,80,0.16)]"
            >
              {/* Top Accent */}

              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-linear-to-r ${scheme.theme} transition-all duration-500 group-hover:h-2`}
              />

              {/* Card Glow */}

              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full ${scheme.glow} opacity-50 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-100`}
              />

              {/* Decorative Circle */}

              <div
                className={`pointer-events-none absolute -right-10 top-12 h-28 w-28 rounded-full border-18 border-transparent bg-linear-to-br ${scheme.theme} opacity-[0.035] transition-all duration-500 group-hover:scale-125 group-hover:opacity-[0.1]`}
              />

              <div className="relative z-10">

                {/* Icon + Badge */}

                <div className="mb-6 flex items-start justify-between gap-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${scheme.iconTheme} text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl`}
                  >
                    {scheme.icon}
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-[9px] font-black tracking-wide transition-all duration-300 group-hover:scale-105 ${scheme.badgeTheme}`}
                  >
                    {scheme.badge}
                  </span>
                </div>

                {/* Hindi */}

                <span className="block text-[9px] font-black tracking-[0.13em] text-emerald-600 uppercase transition-colors group-hover:text-orange-600">
                  {scheme.titleHi}
                </span>

                {/* English */}

                <h3 className="mt-1.5 font-serif text-xl font-black leading-tight tracking-tight text-[#124638] transition-colors duration-300 group-hover:text-emerald-600">
                  {scheme.title}
                </h3>

                {/* Description */}

                <p className="mt-4 text-xs leading-6 font-medium text-slate-600">
                  {scheme.desc}
                </p>

                {/* Objectives */}

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-[9px] font-black tracking-[0.14em] text-slate-400 uppercase">
                    मुख्य विशेषताएं
                  </p>

                  <div className="space-y-3">
                    {scheme.objectives.map((objective) => (
                      <div
                        key={objective}
                        className="flex items-start gap-2.5 text-[11px] leading-5 font-semibold text-slate-700"
                      >
                        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 transition-all duration-300 group-hover:bg-emerald-100">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        </span>

                        <span>{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}

              <div className="relative z-10 mt-7 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedScheme(scheme)}
                  className={`group/btn flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r ${scheme.iconTheme} px-4 py-3 text-[10px] font-black tracking-wide text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <span>विस्तृत जानकारी</span>

                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </button>
              </div>

              {/* Bottom Glow */}

              <div
                className={`absolute bottom-0 left-1/2 h-1 w-0 -translate-x-1/2 rounded-full bg-linear-to-r ${scheme.theme} opacity-0 blur-sm transition-all duration-500 group-hover:w-3/4 group-hover:opacity-100`}
              />
            </m.article>
          ))}
        </div>

        {/* =====================================================
            HELP / OFFICE CARD
        ====================================================== */}

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="group relative mt-12 overflow-hidden rounded-[28px] border border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-orange-50 p-6 shadow-[0_15px_45px_rgba(18,70,56,0.07)] transition-all duration-500 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_25px_60px_rgba(16,120,80,0.14)] md:p-8"
        >
          {/* Background Grid */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(#124638 1px, transparent 1px), linear-gradient(90deg, #124638 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />

          {/* Glow */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl transition-all duration-500 group-hover:bg-orange-300/25" />

          <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row">

            {/* Icon */}

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-xl">
              <MapPin className="h-6 w-6" />
            </div>

            {/* Content */}

            <div className="flex-1 text-center md:text-left">
              <p className="text-[9px] font-black tracking-[0.15em] text-emerald-600 uppercase">
                Citizen Assistance
              </p>

              <h4 className="mt-1 font-serif text-xl font-black text-[#124638]">
                योजना से संबंधित सहायता चाहिए?
              </h4>

              <p className="mt-2 max-w-3xl text-xs leading-6 font-medium text-slate-600 md:text-sm">
                यदि आपको किसी सरकारी योजना की पात्रता, आवेदन प्रक्रिया
                या आवश्यक दस्तावेजों के संबंध में सहायता चाहिए, तो
                नगर पंचायत गोवर्धन, मथुरा कार्यालय से संपर्क करें।
              </p>
            </div>

            {/* CTA */}

            <Link
              href="/contact"
              className="flex shrink-0 items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 py-3 text-[10px] font-black tracking-wide text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:-translate-y-1 hover:from-orange-500 hover:to-pink-500 hover:shadow-xl"
            >
              संपर्क कार्यालय
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </m.div>
      </div>

      {/* =====================================================
          DETAIL MODAL
      ====================================================== */}

      <AnimatePresence>
        {selectedScheme && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-[#0c3b2d]/60 p-4 backdrop-blur-md"
            onClick={() => setSelectedScheme(null)}
          >
            <m.div
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-white/60 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.25)]"
            >
              {/* Top Gradient */}

              <div
                className={`h-1.5 bg-linear-to-r ${selectedScheme.theme}`}
              />

              {/* Header */}

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 md:px-7">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${selectedScheme.iconTheme} text-white shadow-lg`}
                  >
                    {selectedScheme.icon}
                  </div>

                  <div>
                    <p className="text-[9px] font-black tracking-[0.13em] text-emerald-600 uppercase">
                      Nagar Panchayat Goverdhan
                    </p>

                    <h3 className="mt-0.5 text-base font-black text-[#124638]">
                      {selectedScheme.title}
                    </h3>

                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                      {selectedScheme.titleHi}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedScheme(null)}
                  aria-label="Close"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}

              <div className="p-6 md:p-7">
                <div className="rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50/70 to-white p-4">
                  <p className="text-xs leading-6 font-medium text-slate-700">
                    {selectedScheme.desc}
                  </p>
                </div>

                {/* Objectives */}

                <div className="mt-6">
                  <h4 className="text-[10px] font-black tracking-[0.14em] text-[#124638] uppercase">
                    योजना की मुख्य विशेषताएं
                  </h4>

                  <div className="mt-3 space-y-2.5">
                    {selectedScheme.objectives.map((objective) => (
                      <div
                        key={objective}
                        className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/60"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </span>

                        <span className="text-xs leading-5 font-semibold text-slate-700">
                          {objective}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedScheme(null)}
                    className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-[#124638]"
                  >
                    बंद करें
                  </button>

                  <Link
                    href="/contact"
                    onClick={() => setSelectedScheme(null)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r ${selectedScheme.iconTheme} py-3 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl`}
                  >
                    सहायता लें
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Bottom */}

              <div className="border-t border-slate-100 bg-emerald-50/50 px-6 py-3 text-center">
                <p className="text-[9px] font-semibold text-slate-400">
                  नगर पंचायत गोवर्धन, मथुरा • Digital Citizen Services
                </p>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  )
}
