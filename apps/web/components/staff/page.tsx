"use client"

import { AnimatePresence, m } from "framer-motion"
import {
  Award,
  Calendar,
  CheckCircle2,
  Eye,
  Landmark,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react"
import React, { useState } from "react"

type TabType = "welcome" | "vision" | "mission"

interface OfficerRowProps {
  id: string
  roleTitle: string
  designation: string
  name: string
  subText: string
  imgSrc: string
  term: string
  status: string
  welcomeQuote: string
  welcomeText1: string
  welcomeText2: string
  visionTitle: string
  visionDesc: string
  visionPoints: string[]
  missionDesc: string
  missionTargets: {
    title: string
    desc: string
  }[]
  theme: string
  iconTheme: string
}

/* =========================================================
   OFFICER CARD
========================================================= */

function OfficerRow({ data }: { data: OfficerRowProps }) {
  const [activeTab, setActiveTab] = useState<TabType>("welcome")

  const tabs = [
    {
      id: "welcome" as TabType,
      label: "संदेश",
      english: "Message",
      icon: <Quote className="h-4 w-4" />,
    },
    {
      id: "vision" as TabType,
      label: "दृष्टिकोण",
      english: "Vision",
      icon: <Eye className="h-4 w-4" />,
    },
    {
      id: "mission" as TabType,
      label: "मिशन",
      english: "Mission",
      icon: <Target className="h-4 w-4" />,
    },
  ]

  return (
    <m.article
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="group relative"
    >
      {/* Desktop connector */}
      <div className="pointer-events-none absolute left-[33.33%] top-16 hidden h-px w-10 bg-linear-to-r from-emerald-300/70 to-transparent lg:block" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">

        {/* ===================================================
            PROFILE CARD
        ==================================================== */}

        <div className="lg:col-span-4">
          <div
            className={`relative h-full overflow-hidden rounded-[30px] border border-emerald-100/80 bg-white/90 p-6 shadow-[0_15px_45px_rgba(16,80,58,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-[0_28px_70px_rgba(16,120,80,0.15)]`}
          >
            {/* Top gradient */}

            <div
              className={`absolute inset-x-0 top-0 h-1.5 bg-linear-to-r ${data.theme}`}
            />

            {/* Ambient glow */}

            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl transition-all duration-500 group-hover:bg-emerald-400/20" />

            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-orange-300/10 blur-3xl" />

            {/* Decorative grid */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(#126044 1px, transparent 1px), linear-gradient(90deg, #126044 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />

            <div className="relative z-10 flex h-full flex-col items-center text-center">

              {/* Official Icon */}

              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-linear-to-br ${data.iconTheme} text-white shadow-xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-2`}
              >
                <Landmark className="h-10 w-10" />

                <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-xl border-4 border-white bg-white text-emerald-500 shadow-md">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              {/* Official Badge */}

              <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9px] font-black tracking-[0.12em] text-emerald-700 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {data.roleTitle}
              </div>

              {/* Name */}

              <h3 className="mt-4 font-serif text-xl font-black tracking-tight text-[#124638]">
                {data.name}
              </h3>

              {/* Designation */}

              <p className="mt-1 text-[10px] font-black tracking-[0.14em] text-orange-600 uppercase">
                {data.designation}
              </p>

              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                {data.subText}
              </p>

              {/* Status */}

              <div className="mt-6 grid w-full grid-cols-2 gap-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 transition-all duration-300 hover:bg-emerald-100/60">
                  <p className="text-[8px] font-black tracking-wider text-slate-400 uppercase">
                    Status
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-[#124638]">
                    {data.status || "Active"}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 transition-all duration-300 hover:bg-orange-100/60">
                  <p className="text-[8px] font-black tracking-wider text-slate-400 uppercase">
                    Term
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-[#124638]">
                    {data.term || "Current"}
                  </p>
                </div>
              </div>

              {/* Official Tag */}

              <div className="mt-auto w-full pt-6">
                <div className="flex items-center justify-center gap-2 rounded-xl border border-orange-100 bg-linear-to-r from-orange-50 to-amber-50 px-3 py-2.5 transition-all duration-300 hover:border-orange-200 hover:shadow-md">
                  <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />

                  <span className="text-[9px] font-bold text-orange-700">
                    Official Administrative Desk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            INFORMATION PANEL
        ==================================================== */}

        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-[30px] border border-emerald-100/80 bg-white/90 shadow-[0_15px_45px_rgba(16,80,58,0.07)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_28px_70px_rgba(16,120,80,0.13)]">

            {/* Header gradient */}

            <div className={`h-1 bg-linear-to-r ${data.theme}`} />

            {/* =================================================
                TABS
            ================================================== */}

            <div className="border-b border-slate-100 px-5 pt-5 md:px-7">
              <div className="flex gap-2 overflow-x-auto pb-4">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex shrink-0 cursor-pointer items-center gap-2 ronuded-xl px-4 py-2.5 text-[10px] font-black tracking-wide transition-all duration-300 ${
                        active
                          ? `bg-linear-to-r ${data.iconTheme} text-white shadow-lg`
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      {tab.icon}

                      <span>{tab.label}</span>

                      <span className="hidden opacity-70 sm:inline">
                        ({tab.english})
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* =================================================
                TAB CONTENT
            ================================================== */}

            <div className="min-h-87.5 px-5 py-6 md:px-7 md:py-7">
              <AnimatePresence mode="wait">

                {/* ================= WELCOME ================= */}

                {activeTab === "welcome" && (
                  <m.div
                    key="welcome"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    {/* Quote */}

                    <div className="relative overflow-hidden rounded-2xl border border-orange-200/70 bg-linear-to-br from-orange-50 via-white to-amber-50 p-5 transition-all duration-300 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100">
                      <Quote className="absolute -right-2 -top-3 h-20 w-20 rotate-180 text-orange-300/20" />

                      <div className="relative flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-pink-500 text-white shadow-md">
                          <Quote className="h-4 w-4" />
                        </div>

                        <p className="font-serif text-sm leading-7 font-bold text-[#124638] italic">
                          “{data.welcomeQuote}”
                        </p>
                      </div>
                    </div>

                    {/* Text */}

                    <div className="space-y-4">
                      <p className="text-xs leading-7 font-medium text-slate-600 md:text-sm">
                        {data.welcomeText1}
                      </p>

                      {data.welcomeText2 && (
                        <p className="text-xs leading-7 font-medium text-slate-600 md:text-sm">
                          {data.welcomeText2}
                        </p>
                      )}
                    </div>

                    {/* Highlight */}

                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50/60 p-4 transition-all duration-300 hover:border-emerald-200 hover:shadow-md">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-emerald-700">
                          जनसेवा एवं पारदर्शिता
                        </p>

                        <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                          Citizen-centric administration
                        </p>
                      </div>
                    </div>
                  </m.div>
                )}

                {/* ================= VISION ================= */}

                {activeTab === "vision" && (
                  <m.div
                    key="vision"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                        <Eye className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-[9px] font-black tracking-widest text-blue-600 uppercase">
                          Our Vision
                        </p>

                        <h4 className="text-sm font-black text-[#124638] md:text-base">
                          {data.visionTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50">
                      <p className="text-xs leading-7 font-medium text-slate-600 md:text-sm">
                        {data.visionDesc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {data.visionPoints.map((item, index) => (
                        <div
                          key={item}
                          className="group/item flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-md"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-orange-400 to-pink-500 text-white shadow-sm">
                            <span className="text-[9px] font-black">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          <span className="text-xs leading-5 font-semibold text-slate-700">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </m.div>
                )}

                {/* ================= MISSION ================= */}

                {activeTab === "mission" && (
                  <m.div
                    key="mission"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 to-red-500 text-white shadow-md">
                        <Target className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-[9px] font-black tracking-widest text-orange-600 uppercase">
                          Our Mission
                        </p>

                        <h4 className="text-sm font-black text-[#124638] md:text-base">
                          प्रमुख लक्ष्य और उद्देश्य
                        </h4>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 transition-all duration-300 hover:border-orange-200 hover:bg-orange-50">
                      <p className="text-xs leading-7 font-medium text-slate-600 md:text-sm">
                        {data.missionDesc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {data.missionTargets.map((item, index) => (
                        <div
                          key={item.title}
                          className="group/target relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                        >
                          <div
                            className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${data.theme}`}
                          />

                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-orange-500 transition-all duration-300 group-hover/target:bg-orange-50">
                            {index === 0 ? (
                              <Users className="h-4 w-4" />
                            ) : index === 1 ? (
                              <Landmark className="h-4 w-4" />
                            ) : (
                              <Award className="h-4 w-4" />
                            )}
                          </div>

                          <h5 className="mt-3 text-xs font-black text-[#124638]">
                            {item.title}
                          </h5>

                          <p className="mt-1.5 text-[10px] leading-5 font-medium text-slate-500">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            {/* =================================================
                FOOTER
            ================================================== */}

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-emerald-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-orange-500" />

                <span className="text-[10px] font-semibold text-slate-500">
                  कार्यालय: नगर पंचायत गोवर्धन, मथुरा, उत्तर प्रदेश
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

                <span className="text-[9px] font-black tracking-wider text-emerald-700 uppercase">
                  Official Administration
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </m.article>
  )
}

/* =========================================================
   MAIN STAFF SECTION
========================================================= */

export default function Staff() {
  const leadersData: OfficerRowProps[] = [
    {
      id: "chairperson",
      roleTitle: "निर्वाचित अध्यक्ष",
      designation: "अध्यक्ष (Chairperson)",
      name: "नगर पंचायत अध्यक्ष महोदय/महोदया",
      subText: "नगर पंचायत गोवर्धन, मथुरा",
      imgSrc: "",
      term: "निर्वाचित कार्यकाल",
      status: "Active",

      theme:
        "from-orange-400 via-amber-500 to-red-500",

      iconTheme:
        "from-orange-400 to-pink-500",

      welcomeQuote:
        "गोवर्धन को स्वच्छ, सुरक्षित, सुंदर, सुव्यवस्थित और नागरिक-केंद्रित नगर के रूप में विकसित करना हमारा प्रमुख संकल्प है।",

      welcomeText1:
        "नगर पंचायत गोवर्धन, मथुरा की ओर से मैं सभी नागरिकों एवं देश-विदेश से आने वाले श्रद्धालुओं का हार्दिक स्वागत करता/करती हूँ। हमारा प्रयास है कि गोवर्धन के प्रत्येक वार्ड में बेहतर सड़क, स्वच्छता, पेयजल, प्रकाश व्यवस्था तथा अन्य आवश्यक नागरिक सुविधाएं उपलब्ध कराई जाएं।",

      welcomeText2:
        "पारदर्शी प्रशासन, जनभागीदारी और आधुनिक डिजिटल सेवाओं के माध्यम से नागरिकों को सरल एवं प्रभावी नगर पंचायत सेवाएं उपलब्ध कराना हमारी प्राथमिकता है। साथ ही गोवर्धन की धार्मिक एवं सांस्कृतिक पहचान को ध्यान में रखते हुए नगर के समग्र विकास पर विशेष ध्यान दिया जा रहा है।",

      visionTitle:
        "स्वच्छ, सुंदर एवं विकसित गोवर्धन",

      visionDesc:
        "गोवर्धन को स्वच्छ, हरित, सुरक्षित, सुव्यवस्थित और आधुनिक नागरिक सुविधाओं से युक्त एक आदर्श तीर्थ नगरी के रूप में विकसित करना।",

      visionPoints: [
        "गोवर्धन परिक्रमा मार्ग एवं प्रमुख सार्वजनिक क्षेत्रों की बेहतर व्यवस्था।",
        "बेहतर सड़क, नाली, प्रकाश एवं सार्वजनिक बुनियादी ढांचा।",
        "स्वच्छ एवं पर्यावरण-अनुकूल नगर व्यवस्था।",
        "नागरिकों एवं श्रद्धालुओं के लिए बेहतर मूलभूत सुविधाएं।",
        "डिजिटल माध्यम से सरल एवं पारदर्शी नगर पंचायत सेवाएं।",
        "गोवर्धन की धार्मिक एवं सांस्कृतिक विरासत का संरक्षण।",
      ],

      missionDesc:
        "गोवर्धन के प्रत्येक वार्ड में आवश्यक बुनियादी सुविधाओं को मजबूत करना तथा नागरिकों, श्रद्धालुओं और प्रशासन के बीच बेहतर संवाद स्थापित करना।",

      missionTargets: [
        {
          title: "पेयजल एवं जल निकासी",
          desc:
            "नागरिकों एवं श्रद्धालुओं के लिए बेहतर पेयजल व्यवस्था तथा जलभराव की समस्याओं के समाधान हेतु प्रभावी व्यवस्था।",
        },
        {
          title: "स्वच्छता एवं पर्यावरण",
          desc:
            "घर-घर कचरा संग्रहण, स्वच्छ सार्वजनिक स्थल एवं परिक्रमा क्षेत्र की स्वच्छता को बढ़ावा देना।",
        },
        {
          title: "डिजिटल नागरिक सेवा",
          desc:
            "नगर पंचायत सेवाओं को सरल, पारदर्शी और ऑनलाइन माध्यम से नागरिकों तक अधिक सुलभ बनाना।",
        },
      ],
    },

    {
      id: "eo",
      roleTitle: "प्रशासनिक प्रमुख",
      designation: "अधिशासी अधिकारी (EO)",
      name: "अधिशासी अधिकारी महोदय",
      subText: "नगर पंचायत गोवर्धन, मथुरा",
      imgSrc: "",
      term: "शासकीय नियुक्ति",
      status: "कार्यकारी प्रमुख",

      theme:
        "from-blue-500 via-indigo-600 to-violet-600",

      iconTheme:
        "from-blue-500 to-violet-600",

      welcomeQuote:
        "पारदर्शी, जवाबदेह और त्वरित नागरिक सेवा के प्रति नगर पंचायत गोवर्धन पूरी तरह प्रतिबद्ध है।",

      welcomeText1:
        "नगर पंचायत गोवर्धन के कार्यकारी कार्यालय की ओर से सभी नागरिकों एवं श्रद्धालुओं का स्वागत है। हमारा उद्देश्य नगर पंचायत की योजनाओं एवं सेवाओं को पारदर्शी, समयबद्ध और नागरिक-केंद्रित तरीके से उपलब्ध कराना है।",

      welcomeText2:
        "नागरिक शिकायतों के त्वरित निस्तारण, ऑनलाइन सेवाओं के विस्तार तथा कार्यालयीन प्रक्रियाओं को अधिक सरल बनाने के लिए निरंतर प्रयास किए जा रहे हैं। गोवर्धन आने वाले श्रद्धालुओं के लिए स्वच्छता, पेयजल, प्रकाश एवं सार्वजनिक सुविधाओं को बेहतर बनाना भी हमारी प्राथमिकताओं में शामिल है।",

      visionTitle:
        "पारदर्शी एवं डिजिटल प्रशासन",

      visionDesc:
        "डिजिटल और पारदर्शी प्रशासन के माध्यम से नगर पंचायत सेवाओं की गुणवत्ता, गति और जवाबदेही को बेहतर बनाना।",

      visionPoints: [
        "ऑनलाइन आवेदनों एवं सेवाओं की बेहतर ट्रैकिंग।",
        "निर्धारित समय-सीमा में नागरिक सेवाओं का निस्तारण।",
        "विकास योजनाओं एवं संसाधनों का जनहित में प्रभावी उपयोग।",
        "प्रभावी शिकायत निवारण एवं नागरिक सहायता प्रणाली।",
        "गोवर्धन के तीर्थ एवं पर्यटन क्षेत्र में बेहतर नागरिक सुविधाएं।",
        "ई-गवर्नेंस के माध्यम से प्रशासनिक पारदर्शिता।",
      ],

      missionDesc:
        "विकास योजनाओं को प्रभावी रूप से लागू करना तथा नगर पंचायत और नागरिकों के बीच मजबूत संवाद स्थापित करना।",

      missionTargets: [
        {
          title: "डिजिटल कार्यप्रणाली",
          desc:
            "ऑनलाइन नगर पंचायत सेवाओं का सुरक्षित एवं पारदर्शी संचालन।",
        },
        {
          title: "विकास एवं पारदर्शिता",
          desc:
            "नगर विकास कार्यों एवं संसाधनों के उपयोग में स्पष्टता और जवाबदेही।",
        },
        {
          title: "त्वरित समाधान",
          desc:
            "नागरिक शिकायतों का समयबद्ध एवं प्रभावी निस्तारण।",
        },
      ],
    },

    {
      id: "office",
      roleTitle: "कार्यालय प्रशासन",
      designation: "मुख्य कार्यालय / प्रशासनिक स्टाफ",
      name: "नगर पंचायत कार्यालय",
      subText: "गोवर्धन, मथुरा, उत्तर प्रदेश",
      imgSrc: "",
      term: "नियमित प्रशासन",
      status: "कार्यालय प्रभारी",

      theme:
        "from-emerald-400 via-teal-500 to-cyan-600",

      iconTheme:
        "from-emerald-400 to-cyan-600",

      welcomeQuote:
        "नागरिक सुविधा, कार्यालयीन सुगमता और बेहतर सेवा प्रदान करना हमारा निरंतर प्रयास है।",

      welcomeText1:
        "नगर पंचायत गोवर्धन में कार्यालयीन एवं अभिलेखीय कार्यों को व्यवस्थित और प्रभावी ढंग से संचालित करना हमारी प्रमुख जिम्मेदारी है। नागरिकों को विभिन्न नगर पंचायत सेवाओं के लिए उचित मार्गदर्शन एवं सहायता प्रदान की जाती है।",

      welcomeText2:
        "प्रमाण पत्र, कर संबंधी अभिलेख, आवेदन एवं अन्य कार्यालयीन सेवाओं को नागरिकों तक सरल और सुविधाजनक तरीके से पहुंचाने के लिए कार्यालय स्टाफ निरंतर कार्य करता है।",

      visionTitle:
        "अभिलेख एवं नागरिक सेवा प्रबंधन",

      visionDesc:
        "महत्वपूर्ण नगर पंचायत अभिलेखों को सुरक्षित रखते हुए नागरिक सेवाओं को अधिक व्यवस्थित, पारदर्शी और डिजिटल बनाना।",

      visionPoints: [
        "महत्वपूर्ण अभिलेखों एवं रजिस्टरों का डिजिटलीकरण।",
        "आवेदनों एवं प्रमाण पत्रों का सटीक सत्यापन।",
        "नागरिक सहायता एवं मार्गदर्शन व्यवस्था।",
        "कार्यालयीन प्रक्रियाओं में कार्यकुशलता बढ़ाना।",
        "नागरिकों के लिए सरल आवेदन प्रक्रिया।",
        "डिजिटल सेवाओं को अधिक सुलभ बनाना।",
      ],

      missionDesc:
        "दैनिक कार्यालयीन कार्यों में सटीकता बनाए रखना तथा नागरिक आवेदनों का समयबद्ध निष्पादन सुनिश्चित करना।",

      missionTargets: [
        {
          title: "समयबद्ध सेवा",
          desc:
            "विभिन्न आवश्यक नगर पंचायत सेवाओं एवं प्रमाण पत्रों का निर्धारित प्रक्रिया के अनुसार निस्तारण।",
        },
        {
          title: "नागरिक सहायता",
          desc:
            "आवेदन एवं दस्तावेजी प्रक्रिया में नागरिकों को आवश्यक मार्गदर्शन।",
        },
        {
          title: "सुरक्षित रिकॉर्ड",
          desc:
            "कर, संपत्ति एवं अन्य नगर पंचायत अभिलेखों की सुरक्षित एवं व्यवस्थित व्यवस्था।",
        },
      ],
    },
  ]

  return (
    <section
      id="about-us"
      className="relative overflow-hidden bg-linear-to-br from-[#f1fbf5] via-[#ffffff] to-[#f5fcf8] px-4 py-20 font-sans md:px-8 md:py-24"
    >
      {/* =====================================================
          PREMIUM BACKGROUND GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(#126044 1px, transparent 1px), linear-gradient(90deg, #126044 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* =====================================================
          AMBIENT COLORFUL GLOWS
      ====================================================== */}

      <div className="pointer-events-none absolute -left-40 top-10 h-107.5 w-107.5 rounded-full bg-emerald-300/20 blur-[140px]" />

      <div className="pointer-events-none absolute -right-40 top-1/3 h-112.5 w-112.5 rounded-full bg-cyan-300/20 blur-[140px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-100 w-100 rounded-full bg-orange-300/15 blur-[140px]" />

      <div className="pointer-events-none absolute right-1/4 bottom-10 h-87.5 w-87.5 rounded-full bg-violet-300/10 blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* =====================================================
            SECTION HEADER
        ====================================================== */}

        <m.div
          initial={{ opacity: 0, y: 25 }}
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

          <h2 className="font-serif text-3xl font-black tracking-tight text-[#124638] md:text-5xl">
            Leadership &{" "}
            <span className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              Administration
            </span>
          </h2>

          {/* Hindi */}

          <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
            अध्यक्ष एवं प्रशासनिक अधिकारी
          </p>

          {/* Description */}

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 font-medium text-slate-600 md:text-base">
            नगर पंचायत गोवर्धन, मथुरा के नेतृत्व एवं प्रशासनिक
            अधिकारियों की ओर से नागरिकों एवं श्रद्धालुओं के लिए
            संदेश, दृष्टिकोण एवं विकास संबंधी प्रमुख उद्देश्य।
          </p>

          {/* Accent */}

          <div className="mx-auto mt-7 flex items-center justify-center gap-2">
            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-emerald-400 to-teal-500" />

            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200 bg-orange-50">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            </span>

            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-orange-400 to-pink-500" />
          </div>
        </m.div>

        {/* =====================================================
            OFFICERS
        ====================================================== */}

        <div className="space-y-10">
          {leadersData.map((leader) => (
            <OfficerRow
              key={leader.id}
              data={leader}
            />
          ))}
        </div>

        {/* =====================================================
            BOTTOM TRUST STRIP
        ====================================================== */}

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {[
            {
              icon: <ShieldCheck className="h-4 w-4" />,
              title: "पारदर्शी प्रशासन",
              text: "Transparent Governance",
              theme: "from-blue-500 to-indigo-600",
            },
            {
              icon: <Users className="h-4 w-4" />,
              title: "नागरिक केंद्रित",
              text: "Citizen First",
              theme: "from-orange-400 to-pink-500",
            },
            {
              icon: <Landmark className="h-4 w-4" />,
              title: "आधिकारिक पोर्टल",
              text: "Nagar Panchayat Goverdhan",
              theme: "from-emerald-400 to-teal-600",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${item.theme} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                {item.icon}
              </div>

              <div>
                <p className="text-[10px] font-black text-[#124638]">
                  {item.title}
                </p>

                <p className="mt-0.5 text-[9px] font-medium text-slate-500">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </m.div>

        {/* =====================================================
            GOVERNING IDENTITY STRIP
        ====================================================== */}

        <m.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-6 overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 via-white to-orange-50 px-5 py-4 text-center shadow-sm"
        >
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <MapPin className="h-4 w-4 text-emerald-600" />

            <p className="text-[10px] font-bold text-slate-600 md:text-xs">
              गोवर्धन • गिरिराज धाम • मथुरा • उत्तर प्रदेश
            </p>

            <span className="hidden h-1 w-1 rounded-full bg-orange-400 sm:block" />

            <p className="text-[10px] font-black text-emerald-700 md:text-xs">
              स्वच्छ गोवर्धन • सुंदर गोवर्धन
            </p>
          </div>
        </m.div>
      </div>
    </section>
  )
}
