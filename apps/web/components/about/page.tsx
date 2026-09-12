"use client"

import { m } from "framer-motion"
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Droplets,
  Eye,
  FileCheck,
  FileText,
  Landmark,
  MapPin,
  MessageSquareWarning,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  Trees,
  Users,
} from "lucide-react"
import Link from "next/link"
import React from "react"
import { Card } from "@workspace/ui/components/card"

const services = [
  {
    title: "संपत्ति एवं गृह कर",
    english: "Property Tax",
    description:
      "संपत्ति कर, कर विवरण, बकाया राशि एवं ऑनलाइन भुगतान से संबंधित नागरिक सेवाएं।",
    icon: Receipt,
    theme: {
      card: "border-amber-200 bg-linear-to-br from-white via-amber-50/60 to-orange-50",
      icon: "bg-linear-to-br from-amber-400 to-orange-500 text-white",
      badge: "bg-amber-100 text-amber-700",
      hover: "group-hover:border-amber-300 group-hover:shadow-amber-200/70",
      line: "bg-linear-to-r from-amber-400 to-orange-400",
    },
  },
  {
    title: "जल आपूर्ति एवं जलकर",
    english: "Water Services",
    description:
      "जल कनेक्शन, जलकर, बिल एवं जलापूर्ति से संबंधित नागरिक सेवाएं।",
    icon: Droplets,
    theme: {
      card: "border-sky-200 bg-linear-to-br from-white via-sky-50/70 to-cyan-50",
      icon: "bg-linear-to-br from-sky-400 to-cyan-500 text-white",
      badge: "bg-sky-100 text-sky-700",
      hover: "group-hover:border-sky-300 group-hover:shadow-sky-200/70",
      line: "bg-linear-to-r from-sky-400 to-cyan-400",
    },
  },
  {
    title: "जन्म एवं मृत्यु प्रमाण पत्र",
    english: "Birth & Death",
    description:
      "जन्म एवं मृत्यु पंजीकरण तथा प्रमाण पत्र संबंधी सेवाओं तक आसान पहुंच।",
    icon: FileText,
    theme: {
      card: "border-emerald-200 bg-linear-to-br from-white via-emerald-50/70 to-teal-50",
      icon: "bg-linear-to-br from-emerald-400 to-teal-500 text-white",
      badge: "bg-emerald-100 text-emerald-700",
      hover: "group-hover:border-emerald-300 group-hover:shadow-emerald-200/70",
      line: "bg-linear-to-r from-emerald-400 to-teal-400",
    },
  },
  {
    title: "जन शिकायत निवारण",
    english: "Public Grievance",
    description:
      "नागरिक समस्याओं एवं शिकायतों को ऑनलाइन दर्ज करने की सुविधा।",
    icon: MessageSquareWarning,
    theme: {
      card: "border-rose-200 bg-linear-to-br from-white via-rose-50/70 to-pink-50",
      icon: "bg-linear-to-br from-rose-400 to-pink-500 text-white",
      badge: "bg-rose-100 text-rose-700",
      hover: "group-hover:border-rose-300 group-hover:shadow-rose-200/70",
      line: "bg-linear-to-r from-rose-400 to-pink-400",
    },
  },
  {
    title: "ई-टेंडर एवं निविदाएं",
    english: "E-Tender",
    description:
      "नगर पालिका की निविदाओं एवं विकास कार्यों से संबंधित जानकारी।",
    icon: FileCheck,
    theme: {
      card: "border-violet-200 bg-linear-to-br from-white via-violet-50/70 to-indigo-50",
      icon: "bg-linear-to-br from-violet-500 to-indigo-500 text-white",
      badge: "bg-violet-100 text-violet-700",
      hover: "group-hover:border-violet-300 group-hover:shadow-violet-200/70",
      line: "bg-linear-to-r from-violet-500 to-indigo-500",
    },
  },
  {
    title: "व्यापार एवं लाइसेंस",
    english: "Trade License",
    description:
      "व्यापारिक लाइसेंस एवं नगरपालिका अनुमतियों से संबंधित सेवाएं।",
    icon: Award,
    theme: {
      card: "border-orange-200 bg-linear-to-br from-white via-orange-50/70 to-yellow-50",
      icon: "bg-linear-to-br from-orange-400 to-yellow-500 text-white",
      badge: "bg-orange-100 text-orange-700",
      hover: "group-hover:border-orange-300 group-hover:shadow-orange-200/70",
      line: "bg-linear-to-r from-orange-400 to-yellow-400",
    },
  },
]

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#fffdf8] via-[#f7fbff] to-[#f8f5ff] font-sans text-slate-800 antialiased">

      {/* =====================================================
          COLORFUL GLOBAL BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#123247 1px, transparent 1px), linear-gradient(90deg, #123247 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="pointer-events-none fixed -left-40 top-20 h-105 w-105 rounded-full bg-amber-300/20 blur-[120px]" />

      <div className="pointer-events-none fixed -right-45 top-[25%] h-120 w-120 rounded-full bg-sky-300/20 blur-[130px]" />

      <div className="pointer-events-none fixed -bottom-45 left-[25%] h-125 w-125 rounded-full bg-violet-300/15 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl space-y-24 px-4 py-12 md:px-8 md:py-16">

        {/* =====================================================
            INTRODUCTION
        ====================================================== */}

        <section className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(18,50,71,0.07)] backdrop-blur-xl md:p-10">

          {/* Colorful blobs */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sky-300/15 blur-3xl" />

          {/* Grid */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(#123247 1px, transparent 1px), linear-gradient(90deg, #123247 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-12">

            {/* LEFT */}

            <m.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="space-y-5 lg:col-span-7"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/60">
                  <Landmark className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-600">
                    About Mainpuri
                  </p>

                  <h2 className="font-serif text-2xl font-black tracking-tight text-[#123247] md:text-3xl">
                    ऐतिहासिक परिचय एवं स्थिति
                  </h2>
                </div>

              </div>

              <div className="h-0.5 w-full bg-linear-to-r from-amber-400 via-orange-300 to-transparent" />

              <p className="text-justify text-sm leading-7 text-slate-600 md:text-base">
                <strong className="font-black text-[#123247]">
                  नगर पालिका परिषद, मैनपुरी
                </strong>{" "}
                जनपद मैनपुरी, उत्तर प्रदेश में नागरिकों को
                आवश्यक नगरीय एवं नगरपालिका सेवाएं उपलब्ध
                कराने वाली स्थानीय नगरीय निकाय संस्था है।
              </p>

              <p className="text-justify text-sm leading-7 text-slate-600 md:text-base">
                नगर पालिका परिषद द्वारा नगर में स्वच्छता,
                जलापूर्ति, जल निकासी, सड़क एवं सार्वजनिक
                अवसंरचना, स्ट्रीट लाइट, ठोस अपशिष्ट प्रबंधन
                तथा अन्य आवश्यक नागरिक सुविधाओं के संचालन
                एवं रखरखाव का कार्य किया जाता है।
              </p>

              <p className="text-justify text-sm leading-7 text-slate-600 md:text-base">
                डिजिटल गवर्नेंस के माध्यम से नागरिकों को
                नगरपालिका सेवाओं, शिकायत निवारण और आवश्यक
                सूचनाओं तक सरल, पारदर्शी एवं सुविधाजनक
                पहुंच उपलब्ध कराने के लिए निरंतर प्रयास
                किए जा रहे हैं।
              </p>

              <div className="flex flex-wrap gap-3 pt-2">

                <div className="group flex cursor-default items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:bg-sky-100 hover:shadow-lg hover:shadow-sky-100">
                  <MapPin className="h-4 w-4 text-sky-600 transition-transform group-hover:scale-110" />

                  <span className="text-xs font-bold text-sky-800">
                    Mainpuri, Uttar Pradesh
                  </span>
                </div>

                <div className="group flex cursor-default items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-lg hover:shadow-emerald-100">
                  <Building2 className="h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110" />

                  <span className="text-xs font-bold text-emerald-800">
                    Nagar Palika Parishad
                  </span>
                </div>

              </div>
            </m.div>

            {/* RIGHT CARD */}

            <m.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-5"
            >
              <Card className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(18,50,71,0.08)]">

                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-400 via-pink-400 to-sky-400" />

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <h3 className="font-serif text-xl font-black text-[#123247]">
                      मैनपुरी : एक नज़र में
                    </h3>

                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      Nagar Palika Parishad, Mainpuri
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-200/60">
                    <Landmark className="h-5 w-5" />
                  </div>

                </div>

                <div className="space-y-3">

                  {/* Address */}

                  <div className="group rounded-2xl border border-sky-100 bg-linear-to-r from-sky-50 to-cyan-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-400 to-cyan-500 text-white shadow-md">
                        <MapPin className="h-4 w-4 transition-transform group-hover:scale-110" />
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-sky-500">
                          कार्यालय पता
                        </p>

                        <p className="mt-1 text-xs font-black leading-5 text-[#123247]">
                          Agrawal Mohalla,
                          <br />
                          Mainpuri, Uttar Pradesh - 205001
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Mini cards */}

                  <div className="grid grid-cols-2 gap-3">

                    <div className="group rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-teal-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100">

                      <ShieldCheck className="h-5 w-5 text-emerald-600 transition-transform group-hover:rotate-6 group-hover:scale-110" />

                      <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-emerald-500">
                        Governance
                      </p>

                      <p className="mt-0.5 text-sm font-black text-emerald-700">
                        Transparent
                      </p>

                    </div>

                    <div className="group rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 to-indigo-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100">

                      <Sparkles className="h-5 w-5 text-violet-600 transition-transform group-hover:rotate-12 group-hover:scale-110" />

                      <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-violet-500">
                        Services
                      </p>

                      <p className="mt-0.5 text-sm font-black text-violet-700">
                        Digital
                      </p>

                    </div>

                  </div>

                  {/* Message */}

                  <div className="group rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 p-4 transition-all duration-300 hover:border-orange-300 hover:shadow-lg hover:shadow-amber-100">

                    <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600">

                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 transition-transform group-hover:scale-110" />

                      नागरिकों के लिए सरल, पारदर्शी और
                      उत्तरदायी नगरपालिका सेवाएं उपलब्ध
                      कराने के लिए प्रतिबद्ध।

                    </p>

                  </div>

                </div>
              </Card>
            </m.div>

          </div>
        </section>

        {/* =====================================================
            MISSION & VISION
        ====================================================== */}

        <section className="grid gap-8 md:grid-cols-2">

          {/* MISSION */}

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative overflow-hidden rounded-[28px] border border-amber-200 bg-linear-to-br from-white via-amber-50/50 to-orange-50/70 p-7 shadow-[0_12px_35px_rgba(245,158,11,0.07)] transition-all duration-500 hover:-translate-y-2 hover:border-amber-300 hover:shadow-[0_25px_55px_rgba(245,158,11,0.18)] md:p-8"
          >

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl transition-all duration-500 group-hover:bg-orange-400/30" />

            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-400 to-orange-500" />

            <div className="relative z-10">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Target className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-600">
                    Our Mission
                  </p>

                  <h3 className="font-serif text-2xl font-black text-[#123247]">
                    हमारा मिशन
                  </h3>
                </div>

              </div>

              <p className="text-sm leading-7 text-slate-600 md:text-base">
                नगर पालिका परिषद, मैनपुरी का उद्देश्य
                नागरिकों को स्वच्छ, सुरक्षित और सुविधापूर्ण
                नगरीय वातावरण उपलब्ध कराना तथा नगरपालिका
                सेवाओं को प्रभावी, पारदर्शी एवं नागरिक-केंद्रित
                बनाना है।
              </p>

              <ul className="mt-6 space-y-3.5">

                {[
                  "स्वच्छता एवं ठोस अपशिष्ट प्रबंधन को बेहतर बनाना",
                  "जलापूर्ति एवं जल निकासी सेवाओं को मजबूत करना",
                  "सड़क, स्ट्रीट लाइट एवं सार्वजनिक अवसंरचना का रखरखाव",
                  "डिजिटल एवं पारदर्शी नागरिक सेवाओं को बढ़ावा देना",
                ].map((item) => (
                  <li
                    key={item}
                    className="group/item flex items-start gap-3 text-sm text-slate-600"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-linear-to-r from-amber-400 to-orange-500 transition-transform group-hover/item:scale-150" />

                    <span className="transition-colors group-hover/item:text-orange-700">
                      {item}
                    </span>
                  </li>
                ))}

              </ul>

              <div className="mt-7 rounded-2xl border border-amber-200 bg-white/70 p-4 text-center text-[10px] font-black uppercase tracking-wider text-orange-700">
                पारदर्शिता • जवाबदेही • जनसेवा
              </div>

            </div>
          </m.div>

          {/* VISION */}

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden rounded-[28px] border border-sky-200 bg-linear-to-br from-white via-sky-50/50 to-indigo-50/70 p-7 shadow-[0_12px_35px_rgba(14,165,233,0.07)] transition-all duration-500 hover:-translate-y-2 hover:border-sky-300 hover:shadow-[0_25px_55px_rgba(14,165,233,0.18)] md:p-8"
          >

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl transition-all duration-500 group-hover:bg-violet-400/25" />

            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-400 to-violet-500" />

            <div className="relative z-10">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400 to-violet-500 text-white shadow-lg shadow-sky-200 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Eye className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-600">
                    Our Vision
                  </p>

                  <h3 className="font-serif text-2xl font-black text-[#123247]">
                    हमारा दृष्टिकोण
                  </h3>
                </div>

              </div>

              <p className="text-sm leading-7 text-slate-600 md:text-base">
                हमारा लक्ष्य एक ऐसा आधुनिक, स्वच्छ, सुरक्षित
                और सतत विकसित मैनपुरी बनाना है जहां नागरिकों
                को नगरपालिका सेवाएं सरलता, पारदर्शिता और
                उत्तरदायित्व के साथ उपलब्ध हों।
              </p>

              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">

                <p>
                  डिजिटल गवर्नेंस, बेहतर सार्वजनिक अवसंरचना
                  और नागरिक सहभागिता के माध्यम से शहरी जीवन
                  की गुणवत्ता को निरंतर बेहतर बनाना।
                </p>

                <p>
                  स्वच्छता, हरित क्षेत्र, जल संरक्षण और
                  जिम्मेदार नागरिक भागीदारी के साथ भविष्य के
                  लिए तैयार मैनपुरी के निर्माण की दिशा में
                  आगे बढ़ना।
                </p>

              </div>

              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-sky-200 bg-white/70 p-4 transition-all duration-300 group-hover:border-violet-200">

                <Trees className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

                <p className="text-xs font-semibold leading-5 text-slate-600">
                  स्वच्छ, हरित, सुरक्षित और प्रगतिशील मैनपुरी
                  के निर्माण के लिए नागरिकों और प्रशासन का
                  सहयोग आवश्यक है।
                </p>

              </div>

            </div>
          </m.div>

        </section>

        {/* =====================================================
            SERVICES
        ====================================================== */}

        <section
          id="services"
          className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 px-5 py-12 shadow-[0_15px_50px_rgba(18,50,71,0.05)] backdrop-blur-xl md:px-10 md:py-14"
        >

          {/* Color blobs */}

          <div className="pointer-events-none absolute -left-20 top-20 h-48 w-48 rounded-full bg-sky-300/15 blur-3xl" />

          <div className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-pink-300/15 blur-3xl" />

          {/* Grid */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(#123247 1px, transparent 1px), linear-gradient(90deg, #123247 1px, transparent 1px)",
              backgroundSize: "38px 38px",
            }}
          />

          <div className="relative z-10">

            {/* Header */}

            <div className="mx-auto max-w-3xl text-center">

              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />

                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-700">
                  ई-गवर्नेंस एवं नागरिक सुविधाएं
                </span>
              </div>

              <h2 className="mt-5 font-serif text-3xl font-black tracking-tight text-[#123247] sm:text-4xl">

                नागरिकों के लिए{" "}

                <span className="bg-linear-to-r from-amber-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                  प्रमुख सेवाएं
                </span>

              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                नगर पालिका परिषद, मैनपुरी से संबंधित प्रमुख
                नगरपालिका सेवाओं और नागरिक सुविधाओं तक
                आसान डिजिटल पहुंच।
              </p>

            </div>

            {/* Cards */}

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {services.map((service, index) => {
                const Icon = service.icon

                return (
                  <m.div
                    key={service.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.06,
                    }}
                  >
                    <Card
                      className={`group relative h-full overflow-hidden rounded-[24px] border p-6 shadow-[0_8px_30px_rgba(18,50,71,0.045)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_55px_rgba(18,50,71,0.14)] ${service.theme.card} ${service.theme.hover}`}
                    >

                      {/* Top colorful line */}

                      <div
                        className={`absolute inset-x-0 top-0 h-1 ${service.theme.line} opacity-70 transition-all duration-500 group-hover:h-1.5`}
                      />

                      {/* Number */}

                      <span className="absolute right-5 top-5 text-[9px] font-black tracking-widest text-slate-300 transition-colors group-hover:text-slate-400">
                        0{index + 1}
                      </span>

                      {/* Icon */}

                      <div
                        className={`flex h-13 w-13 items-center justify-center rounded-2xl shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ${service.theme.icon}`}
                      >
                        <Icon className="h-5.5 w-5.5" />
                      </div>

                      {/* Content */}

                      <p
                        className={`mt-5 inline-flex rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] ${service.theme.badge}`}
                      >
                        {service.english}
                      </p>

                      <h3 className="mt-3 text-base font-black text-[#123247] transition-colors duration-300 group-hover:text-slate-900">
                        {service.title}
                      </h3>

                      <p className="mt-2 text-xs leading-6 text-slate-600">
                        {service.description}
                      </p>

                      {/* Bottom */}

                      <div className="mt-6 flex items-center justify-between border-t border-slate-200/70 pt-4">

                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Citizen Service
                        </span>

                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm transition-all duration-300 group-hover:translate-x-1 group-hover:shadow-md">
                          <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-[#123247]" />
                        </span>

                      </div>

                    </Card>
                  </m.div>
                )
              })}

            </div>
          </div>
        </section>

        {/* =====================================================
            CITIZEN FIRST
        ====================================================== */}

        <section className="group relative overflow-hidden rounded-[30px] border border-violet-200 bg-linear-to-r from-amber-50 via-white to-sky-50 p-7 shadow-[0_15px_45px_rgba(18,50,71,0.06)] transition-all duration-500 hover:shadow-[0_25px_60px_rgba(124,58,237,0.10)] md:p-10">

          {/* Background blobs */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-300/20 blur-3xl transition-all duration-500 group-hover:bg-pink-300/25" />

          <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-7 text-center md:flex-row md:text-left">

            {/* Icon */}

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 via-indigo-500 to-sky-500 text-white shadow-xl shadow-violet-200 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
              <Users className="h-7 w-7" />
            </div>

            {/* Content */}

            <div className="flex-1">

              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600">
                Citizen First Governance
              </p>

              <h2 className="mt-1 font-serif text-xl font-black text-[#123247] md:text-2xl">
                जनसेवा हमारी प्राथमिकता
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                नगर पालिका परिषद, मैनपुरी नागरिकों की
                आवश्यकताओं को ध्यान में रखते हुए बेहतर
                नगरपालिका सेवाएं, उत्तरदायी प्रशासन और
                पारदर्शी डिजिटल गवर्नेंस उपलब्ध कराने के
                लिए निरंतर प्रयासरत है।
              </p>

            </div>

            {/* CTA */}

            <Link
              href="/public-grievance"
              className="group/btn inline-flex shrink-0 items-center gap-2 rounded-xl bg-linear-to-r from-[#123247] to-[#24556D] px-6 py-3.5 text-xs font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-violet-600 hover:to-indigo-600 hover:shadow-xl hover:shadow-violet-200"
            >
              शिकायत दर्ज करें

              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>

          </div>
        </section>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="border-t border-slate-200 pt-8 text-center">

          <div className="flex items-center justify-center gap-2">

            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-orange-500 text-white">
              <Landmark className="h-3.5 w-3.5" />
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Nagar Palika Parishad, Mainpuri
            </p>

          </div>

          <p className="mt-2 text-[9px] font-medium text-slate-400">
            Mainpuri, Uttar Pradesh • Government of Uttar Pradesh
          </p>

        </footer>

      </div>
    </main>
  )
}
