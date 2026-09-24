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
      "नगर पंचायत गोवर्धन से संबंधित संपत्ति कर, कर विवरण, बकाया राशि एवं ऑनलाइन भुगतान की नागरिक सेवाएं।",
    icon: Receipt,
    theme: {
      card:
        "border-amber-200 bg-gradient-to-br from-white via-amber-50/70 to-orange-50",
      icon: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
      badge: "bg-amber-100 text-amber-700",
      hover:
        "group-hover:border-amber-300 group-hover:shadow-amber-200/80",
      line: "bg-gradient-to-r from-amber-400 to-orange-400",
    },
  },
  {
    title: "जल आपूर्ति एवं जलकर",
    english: "Water Services",
    description:
      "जल कनेक्शन, जलकर, जल बिल, जलापूर्ति एवं जल संबंधी नागरिक सुविधाओं तक आसान डिजिटल पहुंच।",
    icon: Droplets,
    theme: {
      card:
        "border-sky-200 bg-gradient-to-br from-white via-sky-50/70 to-cyan-50",
      icon: "bg-gradient-to-br from-sky-400 to-cyan-500 text-white",
      badge: "bg-sky-100 text-sky-700",
      hover:
        "group-hover:border-sky-300 group-hover:shadow-sky-200/80",
      line: "bg-gradient-to-r from-sky-400 to-cyan-400",
    },
  },
  {
    title: "जन्म एवं मृत्यु प्रमाण पत्र",
    english: "Birth & Death",
    description:
      "जन्म एवं मृत्यु पंजीकरण तथा प्रमाण पत्र संबंधी नागरिक सेवाओं तक सरल और सुविधाजनक पहुंच।",
    icon: FileText,
    theme: {
      card:
        "border-emerald-200 bg-gradient-to-br from-white via-emerald-50/70 to-teal-50",
      icon: "bg-gradient-to-br from-emerald-400 to-teal-500 text-white",
      badge: "bg-emerald-100 text-emerald-700",
      hover:
        "group-hover:border-emerald-300 group-hover:shadow-emerald-200/80",
      line: "bg-gradient-to-r from-emerald-400 to-teal-400",
    },
  },
  {
    title: "जन शिकायत निवारण",
    english: "Public Grievance",
    description:
      "गोवर्धन क्षेत्र के नागरिक अपनी समस्याओं, सुझावों एवं शिकायतों को ऑनलाइन दर्ज कर सकते हैं।",
    icon: MessageSquareWarning,
    theme: {
      card:
        "border-rose-200 bg-gradient-to-br from-white via-rose-50/70 to-pink-50",
      icon: "bg-gradient-to-br from-rose-400 to-pink-500 text-white",
      badge: "bg-rose-100 text-rose-700",
      hover:
        "group-hover:border-rose-300 group-hover:shadow-rose-200/80",
      line: "bg-gradient-to-r from-rose-400 to-pink-400",
    },
  },
  {
    title: "ई-टेंडर एवं निविदाएं",
    english: "E-Tender",
    description:
      "नगर पंचायत गोवर्धन के विकास कार्यों, निविदाओं एवं सार्वजनिक परियोजनाओं से संबंधित जानकारी।",
    icon: FileCheck,
    theme: {
      card:
        "border-violet-200 bg-gradient-to-br from-white via-violet-50/70 to-indigo-50",
      icon: "bg-gradient-to-br from-violet-500 to-indigo-500 text-white",
      badge: "bg-violet-100 text-violet-700",
      hover:
        "group-hover:border-violet-300 group-hover:shadow-violet-200/80",
      line: "bg-gradient-to-r from-violet-500 to-indigo-500",
    },
  },
  {
    title: "व्यापार एवं लाइसेंस",
    english: "Trade License",
    description:
      "व्यापारिक लाइसेंस, प्रतिष्ठान संबंधी अनुमति एवं नगर पंचायत की आवश्यक अनुमतियों से जुड़ी सेवाएं।",
    icon: Award,
    theme: {
      card:
        "border-orange-200 bg-gradient-to-br from-white via-orange-50/70 to-yellow-50",
      icon: "bg-gradient-to-br from-orange-400 to-yellow-500 text-white",
      badge: "bg-orange-100 text-orange-700",
      hover:
        "group-hover:border-orange-300 group-hover:shadow-orange-200/80",
      line: "bg-gradient-to-r from-orange-400 to-yellow-400",
    },
  },
]

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#f5fff8] via-white to-[#f4fbf7] font-sans text-slate-800 antialiased">

      {/* =========================================================
          PREMIUM BACKGROUND
      ========================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#075E45 1px, transparent 1px), linear-gradient(90deg, #075E45 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="pointer-events-none fixed -left-40 top-20 h-107.5 w-107.5 rounded-full bg-emerald-300/20 blur-[120px]" />

      <div className="pointer-events-none fixed -right-45 top-[25%] h-120 w-120 rounded-full bg-lime-300/15 blur-[130px]" />

      <div className="pointer-events-none fixed -bottom-45 left-[25%] h-125 w-125 rounded-full bg-teal-300/15 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl space-y-24 px-4 py-12 md:px-8 md:py-16">

        {/* =========================================================
            INTRODUCTION
        ========================================================== */}

        <section className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white/90 p-6 shadow-[0_20px_60px_rgba(6,95,70,0.08)] backdrop-blur-xl md:p-10">

          {/* Decorative blobs */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-lime-300/15 blur-3xl" />

          {/* Grid */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(#075E45 1px, transparent 1px), linear-gradient(90deg, #075E45 1px, transparent 1px)",
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

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/70 transition-all duration-300 hover:rotate-6 hover:scale-110">
                  <Landmark className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">
                    About Goverdhan
                  </p>

                  <h2 className="font-serif text-2xl font-black tracking-tight text-[#124734] md:text-3xl">
                    गोवर्धन का परिचय एवं स्थिति
                  </h2>
                </div>

              </div>

              <div className="h-0.5 w-full bg-linear-to-r from-emerald-400 via-lime-300 to-transparent" />

              <p className="text-justify text-sm leading-7 text-slate-600 md:text-base">
                <strong className="font-black text-[#124734]">
                  नगर पंचायत गोवर्धन, मथुरा
                </strong>{" "}
                उत्तर प्रदेश के मथुरा जनपद में स्थित एक महत्वपूर्ण नगरीय
                स्थानीय निकाय है। गोवर्धन अपनी धार्मिक, सांस्कृतिक एवं
                आध्यात्मिक पहचान के कारण ब्रज क्षेत्र में विशेष महत्व रखता है।
              </p>

              <p className="text-justify text-sm leading-7 text-slate-600 md:text-base">
                नगर पंचायत द्वारा क्षेत्र में स्वच्छता, जलापूर्ति, जल निकासी,
                सड़क एवं सार्वजनिक अवसंरचना, स्ट्रीट लाइट, ठोस अपशिष्ट
                प्रबंधन तथा अन्य आवश्यक नागरिक सुविधाओं के संचालन एवं
                रखरखाव पर निरंतर कार्य किया जाता है।
              </p>

              <p className="text-justify text-sm leading-7 text-slate-600 md:text-base">
                गोवर्धन की धार्मिक एवं पर्यटन संबंधी महत्ता को ध्यान में रखते
                हुए स्वच्छ, सुरक्षित, सुव्यवस्थित एवं नागरिक-केंद्रित नगरीय
                वातावरण विकसित करना नगर पंचायत की प्राथमिकताओं में शामिल है।
              </p>

              <p className="text-justify text-sm leading-7 text-slate-600 md:text-base">
                डिजिटल गवर्नेंस के माध्यम से नागरिकों को नगरपालिका सेवाओं,
                शिकायत निवारण तथा आवश्यक सूचनाओं तक सरल, पारदर्शी और
                सुविधाजनक पहुंच उपलब्ध कराने के लिए निरंतर प्रयास किए जा
                रहे हैं।
              </p>

              <div className="flex flex-wrap gap-3 pt-2">

                <div className="group flex cursor-default items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-lg hover:shadow-emerald-100">
                  <MapPin className="h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110" />

                  <span className="text-xs font-bold text-emerald-800">
                    Goverdhan, Mathura
                  </span>
                </div>

                <div className="group flex cursor-default items-center gap-2 rounded-2xl border border-lime-200 bg-lime-50 px-4 py-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-lime-300 hover:bg-lime-100 hover:shadow-lg hover:shadow-lime-100">
                  <Building2 className="h-4 w-4 text-lime-700 transition-transform group-hover:scale-110" />

                  <span className="text-xs font-bold text-lime-800">
                    Nagar Panchayat
                  </span>
                </div>

                <div className="group flex cursor-default items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:bg-teal-100 hover:shadow-lg hover:shadow-teal-100">
                  <Trees className="h-4 w-4 text-teal-600 transition-transform group-hover:scale-110" />

                  <span className="text-xs font-bold text-teal-800">
                    ब्रज क्षेत्र
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

              <Card className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_20px_50px_rgba(6,95,70,0.08)]">

                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-400 via-lime-400 to-teal-500" />

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <h3 className="font-serif text-xl font-black text-[#124734]">
                      गोवर्धन : एक नज़र में
                    </h3>

                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      Nagar Panchayat Goverdhan, Mathura
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/60">
                    <Landmark className="h-5 w-5" />
                  </div>

                </div>

                <div className="space-y-3">

                  {/* Location */}

                  <div className="group rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-md">
                        <MapPin className="h-4 w-4 transition-transform group-hover:scale-110" />
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                          स्थान
                        </p>

                        <p className="mt-1 text-xs font-black leading-5 text-[#124734]">
                          गोवर्धन
                          <br />
                          मथुरा, उत्तर प्रदेश
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Mini Cards */}

                  <div className="grid grid-cols-2 gap-3">

                    <div className="group rounded-2xl border border-lime-100 bg-linear-to-br from-lime-50 to-emerald-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-lime-200 hover:shadow-lg hover:shadow-lime-100">

                      <ShieldCheck className="h-5 w-5 text-emerald-600 transition-transform group-hover:rotate-6 group-hover:scale-110" />

                      <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                        Governance
                      </p>

                      <p className="mt-0.5 text-sm font-black text-emerald-700">
                        Transparent
                      </p>

                    </div>

                    <div className="group rounded-2xl border border-teal-100 bg-linear-to-br from-teal-50 to-cyan-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-100">

                      <Sparkles className="h-5 w-5 text-teal-600 transition-transform group-hover:rotate-12 group-hover:scale-110" />

                      <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-teal-600">
                        Services
                      </p>

                      <p className="mt-0.5 text-sm font-black text-teal-700">
                        Digital
                      </p>

                    </div>

                  </div>

                  {/* Message */}

                  <div className="group rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-yellow-50 p-4 transition-all duration-300 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100">

                    <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600">

                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 transition-transform group-hover:scale-110" />

                      गोवर्धन क्षेत्र में नागरिकों एवं श्रद्धालुओं के लिए
                      स्वच्छ, सुरक्षित, सुव्यवस्थित और उत्तरदायी नगरीय
                      सेवाएं उपलब्ध कराने के लिए प्रतिबद्ध।

                    </p>

                  </div>

                </div>

              </Card>

            </m.div>

          </div>

        </section>

        {/* =========================================================
            MISSION & VISION
        ========================================================== */}

        <section className="grid gap-8 md:grid-cols-2">

          {/* MISSION */}

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative overflow-hidden rounded-[28px] border border-emerald-200 bg-linear-to-br from-white via-emerald-50/50 to-lime-50/70 p-7 shadow-[0_12px_35px_rgba(16,185,129,0.07)] transition-all duration-500 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-[0_25px_55px_rgba(16,185,129,0.18)] md:p-8"
          >

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl transition-all duration-500 group-hover:bg-lime-400/30" />

            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-400 to-lime-500" />

            <div className="relative z-10">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Target className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                    Our Mission
                  </p>

                  <h3 className="font-serif text-2xl font-black text-[#124734]">
                    हमारा मिशन
                  </h3>
                </div>

              </div>

              <p className="text-sm leading-7 text-slate-600 md:text-base">
                नगर पंचायत गोवर्धन का उद्देश्य नागरिकों एवं क्षेत्र में आने
                वाले श्रद्धालुओं को स्वच्छ, सुरक्षित और सुविधापूर्ण नगरीय
                वातावरण उपलब्ध कराना तथा स्थानीय सेवाओं को प्रभावी,
                पारदर्शी एवं नागरिक-केंद्रित बनाना है।
              </p>

              <ul className="mt-6 space-y-3.5">

                {[
                  "स्वच्छता एवं ठोस अपशिष्ट प्रबंधन को बेहतर बनाना",
                  "जलापूर्ति एवं जल निकासी सेवाओं को मजबूत करना",
                  "सड़क, स्ट्रीट लाइट एवं सार्वजनिक अवसंरचना का रखरखाव",
                  "गोवर्धन क्षेत्र में स्वच्छ एवं सुव्यवस्थित वातावरण को बढ़ावा देना",
                  "डिजिटल एवं पारदर्शी नागरिक सेवाओं को बढ़ावा देना",
                ].map((item) => (
                  <li
                    key={item}
                    className="group/item flex items-start gap-3 text-sm text-slate-600"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-linear-to-r from-emerald-400 to-teal-500 transition-transform group-hover/item:scale-150" />

                    <span className="transition-colors group-hover/item:text-emerald-700">
                      {item}
                    </span>
                  </li>
                ))}

              </ul>

              <div className="mt-7 rounded-2xl border border-emerald-200 bg-white/70 p-4 text-center text-[10px] font-black uppercase tracking-wider text-emerald-700">
                स्वच्छता • पारदर्शिता • जनसेवा
              </div>

            </div>

          </m.div>

          {/* VISION */}

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden rounded-[28px] border border-teal-200 bg-linear-to-br from-white via-teal-50/50 to-cyan-50/70 p-7 shadow-[0_12px_35px_rgba(20,184,166,0.07)] transition-all duration-500 hover:-translate-y-2 hover:border-teal-300 hover:shadow-[0_25px_55px_rgba(20,184,166,0.18)] md:p-8"
          >

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl transition-all duration-500 group-hover:bg-emerald-400/25" />

            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-teal-400 to-emerald-500" />

            <div className="relative z-10">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-linear-to-br from-teal-400 to-emerald-500 text-white shadow-lg shadow-teal-200 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Eye className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-600">
                    Our Vision
                  </p>

                  <h3 className="font-serif text-2xl font-black text-[#124734]">
                    हमारा दृष्टिकोण
                  </h3>
                </div>

              </div>

              <p className="text-sm leading-7 text-slate-600 md:text-base">
                हमारा लक्ष्य एक ऐसा आधुनिक, स्वच्छ, सुरक्षित और व्यवस्थित
                गोवर्धन विकसित करना है जहां नागरिकों एवं आगंतुकों को
                आवश्यक नगरीय सेवाएं सरलता, पारदर्शिता और उत्तरदायित्व के
                साथ उपलब्ध हों।
              </p>

              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">

                <p>
                  डिजिटल गवर्नेंस, बेहतर सार्वजनिक अवसंरचना और नागरिक
                  सहभागिता के माध्यम से गोवर्धन में जीवन की गुणवत्ता को
                  निरंतर बेहतर बनाना।
                </p>

                <p>
                  स्वच्छता, हरित क्षेत्र, पर्यावरण संरक्षण और जिम्मेदार
                  नागरिक भागीदारी के साथ ब्रज क्षेत्र की गरिमा के अनुरूप
                  गोवर्धन के विकास की दिशा में आगे बढ़ना।
                </p>

              </div>

              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-teal-200 bg-white/70 p-4 transition-all duration-300 group-hover:border-emerald-200">

                <Trees className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

                <p className="text-xs font-semibold leading-5 text-slate-600">
                  स्वच्छ, हरित, सुरक्षित और आध्यात्मिक पहचान वाले गोवर्धन
                  के निर्माण के लिए नागरिकों और प्रशासन का सहयोग आवश्यक है।
                </p>

              </div>

            </div>

          </m.div>

        </section>

        {/* =========================================================
            SERVICES
        ========================================================== */}

        <section
          id="services"
          className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white/80 px-5 py-12 shadow-[0_15px_50px_rgba(6,95,70,0.06)] backdrop-blur-xl md:px-10 md:py-14"
        >

          {/* Background */}

          <div className="pointer-events-none absolute -left-20 top-20 h-48 w-48 rounded-full bg-emerald-300/15 blur-3xl" />

          <div className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-lime-300/15 blur-3xl" />

          {/* Grid */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(#075E45 1px, transparent 1px), linear-gradient(90deg, #075E45 1px, transparent 1px)",
              backgroundSize: "38px 38px",
            }}
          />

          <div className="relative z-10">

            {/* Header */}

            <div className="mx-auto max-w-3xl text-center">

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">

                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />

                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  ई-गवर्नेंस एवं नागरिक सुविधाएं
                </span>

              </div>

              <h2 className="mt-5 font-serif text-3xl font-black tracking-tight text-[#124734] sm:text-4xl">

                गोवर्धन के नागरिकों के लिए{" "}

                <span className="bg-linear-to-r from-emerald-500 via-teal-500 to-lime-500 bg-clip-text text-transparent">
                  प्रमुख सेवाएं
                </span>

              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                नगर पंचायत गोवर्धन, मथुरा से संबंधित प्रमुख नगरपालिका
                सेवाओं और नागरिक सुविधाओं तक आसान डिजिटल पहुंच।
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
                      className={`group relative h-full overflow-hidden rounded-[24px] border p-6 shadow-[0_8px_30px_rgba(6,95,70,0.045)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_55px_rgba(6,95,70,0.14)] ${service.theme.card} ${service.theme.hover}`}
                    >

                      {/* Accent */}

                      <div
                        className={`absolute inset-x-0 top-0 h-1 ${service.theme.line} opacity-70 transition-all duration-500 group-hover:h-1.5`}
                      />

                      {/* Number */}

                      <span className="absolute right-5 top-5 text-[9px] font-black tracking-widest text-slate-300 transition-colors group-hover:text-emerald-400">
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

                      <h3 className="mt-3 text-base font-black text-[#124734] transition-colors duration-300 group-hover:text-emerald-700">
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

                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm transition-all duration-300 group-hover:translate-x-1 group-hover:bg-emerald-500 group-hover:shadow-md">

                          <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-white" />

                        </span>

                      </div>

                    </Card>

                  </m.div>
                )
              })}

            </div>

          </div>

        </section>

        {/* =========================================================
            CITIZEN FIRST
        ========================================================== */}

        <section className="group relative overflow-hidden rounded-[30px] border border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-lime-50 p-7 shadow-[0_15px_45px_rgba(6,95,70,0.06)] transition-all duration-500 hover:shadow-[0_25px_60px_rgba(16,185,129,0.14)] md:p-10">

          {/* Background */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl transition-all duration-500 group-hover:bg-teal-300/25" />

          <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-lime-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-7 text-center md:flex-row md:text-left">

            {/* Icon */}

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 via-teal-500 to-lime-500 text-white shadow-xl shadow-emerald-200 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
              <Users className="h-7 w-7" />
            </div>

            {/* Content */}

            <div className="flex-1">

              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                Citizen First Governance
              </p>

              <h2 className="mt-1 font-serif text-xl font-black text-[#124734] md:text-2xl">
                जनसेवा हमारी प्राथमिकता
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                नगर पंचायत गोवर्धन नागरिकों एवं क्षेत्र में आने वाले
                श्रद्धालुओं की आवश्यकताओं को ध्यान में रखते हुए बेहतर
                नगरपालिका सेवाएं, उत्तरदायी प्रशासन और पारदर्शी डिजिटल
                गवर्नेंस उपलब्ध कराने के लिए निरंतर प्रयासरत है।
              </p>

            </div>

            {/* CTA */}

            <Link
              href="/public-grievance"
              className="group/btn inline-flex shrink-0 items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-xs font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-emerald-500 hover:to-lime-500 hover:shadow-xl hover:shadow-emerald-200"
            >
              शिकायत दर्ज करें

              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>

          </div>

        </section>

        {/* =========================================================
            FOOTER
        ========================================================== */}

        <footer className="border-t border-emerald-100 pt-8 text-center">

          <div className="flex items-center justify-center gap-2">

            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 text-white">
              <Landmark className="h-3.5 w-3.5" />
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
              Nagar Panchayat, Goverdhan, Mathura
            </p>

          </div>

          <p className="mt-2 text-[9px] font-medium text-slate-400">
            Goverdhan, Mathura, Uttar Pradesh • Government of Uttar Pradesh
          </p>

        </footer>

      </div>
    </main>
  )
}
