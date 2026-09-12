"use client"

import { AnimatePresence, motion as m } from "framer-motion"
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Eye,
  Landmark,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"
import Image from "next/image"
import { useState } from "react"

/* =========================================================
   TYPES
========================================================= */

type ActiveTab = "welcome" | "vision" | "mission"

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ChairmanMessage() {
  const [activeTab, setActiveTab] =
    useState<ActiveTab>("welcome")

  return (
    <section
      id="about-us"
      className="relative overflow-hidden bg-[#F7F5F0] px-4 py-20 font-sans sm:py-24 md:px-8 lg:py-28"
    >
      {/* =====================================================
          BACKGROUND DECORATION
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-45 -top-40 h-125 w-125 rounded-full bg-[#C69A45]/6 blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-45 -right-37.5 h-125 w-125 rounded-full bg-[#123247]/6 blur-[110px]"
      />

      {/* Fine architectural grid */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #123247 1px, transparent 1px), linear-gradient(#123247 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* ===================================================
            SECTION HEADER
        ==================================================== */}

        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
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
              duration: 0.6,
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#C69A45]/25 bg-[#C69A45]/8 px-4 py-2 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#B07F2F]" />

            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A702D] sm:text-[10px]">
              Leadership & Administration
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
              amount: 0.2,
            }}
            transition={{
              duration: 0.65,
              delay: 0.08,
            }}
            className="mt-5 font-serif text-3xl font-black tracking-tight text-[#123247] sm:text-4xl md:text-5xl"
          >
            Chairman's Message
            <span className="block text-[#9A702D]">
              & Administration
            </span>
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
              delay: 0.14,
            }}
            className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-[#687781] md:text-base"
          >
            Welcome to the official digital portal of{" "}
            <span className="font-bold text-[#9A702D]">
              नगर पालिका परिषद, मैनपुरी
            </span>
            . Our administration is committed to transparent
            governance, responsive civic services and sustainable
            urban development.
          </m.p>

          {/* Premium divider */}

          <div className="mt-7 flex items-center justify-center gap-2">
            <span className="h-0.5 w-14 rounded-full bg-[#C69A45]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#123247]" />
            <span className="h-0.5 w-4 rounded-full bg-[#D8B26A]" />
          </div>
        </div>

        {/* ===================================================
            MAIN GRID
        ==================================================== */}

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-8">
          {/* =================================================
              CHAIRMAN PROFILE
          ================================================== */}

          <div className="lg:col-span-4">
            <m.div
              initial={{
                opacity: 0,
                x: -25,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.7,
              }}
              className="group relative h-full overflow-hidden rounded-[28px] border border-[#243F50] bg-[#0B2637] shadow-[0_25px_70px_rgba(18,50,71,0.18)]"
            >
              {/* Gold top accent */}

              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#B17E2E] via-[#E0BD79] to-[#B17E2E]" />

              {/* Decorative circles */}

              <div
                aria-hidden="true"
                className="absolute -right-24 -top-24 h-52 w-52 rounded-full border border-white/6"
              />

              <div
                aria-hidden="true"
                className="absolute -bottom-28 -left-28 h-60 w-60 rounded-full border border-[#C69A45]/8"
              />

              <div className="relative flex h-full flex-col p-6 sm:p-7">
                {/* Official badge */}

                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#D8B26A]/20 bg-[#C69A45]/10 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#D8B26A]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Official Leadership
                  </span>
                </div>

                {/* Portrait */}

                <div className="my-7 flex justify-center">
                  <div className="relative">
                    {/* Gold ring */}

                    <div className="absolute -inset-2 rounded-[24px] border border-[#C69A45]/25" />

                    <div className="absolute -inset-4 rounded-[28px] border border-white/4" />

                    <div className="relative aspect-4/5 w-55 overflow-hidden rounded-[20px] border border-white/10 bg-[#123247] shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:w-58.75">
                      <Image
                        src="/chairman.png"
                        alt="Chairman of Nagar Palika Parishad Mainpuri"
                        fill
                        priority={false}
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.035]"
                        sizes="(max-width: 1024px) 220px, 235px"
                      />

                      {/* Image overlay */}

                      <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[#081C2A] to-transparent" />
                    </div>
                  </div>
                </div>

                {/* Name */}

                <div className="text-center">
                  <h3 className="font-serif text-xl font-black tracking-tight text-white">
                    Smt. / Sh. Chairman Name
                  </h3>

                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#D8B26A]">
                    Hon'ble Chairman
                  </p>

                  <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-[#C69A45]" />
                    <span>
                      Mainpuri, Uttar Pradesh
                    </span>
                  </div>
                </div>

                {/* Divider */}

                <div className="my-5 h-px bg-white/8" />

                {/* Official info */}

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/[0.07] bg-white/4 p-3">
                    <Landmark className="mb-2 h-4 w-4 text-[#D8B26A]" />

                    <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                      Authority
                    </p>

                    <p className="mt-1 text-[9px] font-bold text-slate-200">
                      Nagar Palika
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.07] bg-white/4 p-3">
                    <CheckCircle2 className="mb-2 h-4 w-4 text-[#D8B26A]" />

                    <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                      Status
                    </p>

                    <p className="mt-1 text-[9px] font-bold text-slate-200">
                      Official Portal
                    </p>
                  </div>
                </div>
              </div>
            </m.div>
          </div>

          {/* =================================================
              INFORMATION PANEL
          ================================================== */}

          <div className="lg:col-span-8">
            <m.div
              initial={{
                opacity: 0,
                x: 25,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.7,
              }}
              className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#D9D3C8] bg-white shadow-[0_20px_60px_rgba(18,50,71,0.09)]"
            >
              {/* =============================================
                  TAB NAVIGATION
              ============================================== */}

              <div className="border-b border-[#E8E4DC] bg-[#FCFBF8] p-3 sm:p-4">
                <div
                  className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                  role="tablist"
                  aria-label="Chairman information"
                >
                  <TabButton
                    active={
                      activeTab === "welcome"
                    }
                    onClick={() =>
                      setActiveTab("welcome")
                    }
                    icon={
                      <Quote className="h-4 w-4" />
                    }
                    label="Welcome"
                  />

                  <TabButton
                    active={
                      activeTab === "vision"
                    }
                    onClick={() =>
                      setActiveTab("vision")
                    }
                    icon={
                      <Eye className="h-4 w-4" />
                    }
                    label="Our Vision"
                  />

                  <TabButton
                    active={
                      activeTab === "mission"
                    }
                    onClick={() =>
                      setActiveTab("mission")
                    }
                    icon={
                      <Target className="h-4 w-4" />
                    }
                    label="Our Mission"
                  />
                </div>
              </div>

              {/* =============================================
                  TAB CONTENT
              ============================================== */}

              <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-9">
                <AnimatePresence mode="wait">
                  {/* =========================================
                      WELCOME
                  ========================================== */}

                  {activeTab === "welcome" && (
                    <m.div
                      key="welcome"
                      initial={{
                        opacity: 0,
                        y: 12,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                      className="flex flex-1 flex-col"
                    >
                      <div className="mb-7 flex items-start gap-4 rounded-2xl border border-[#E9DCC3] bg-[#FBF7EF] p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C69A45]/10">
                          <Quote className="h-5 w-5 rotate-180 text-[#B17E2E]" />
                        </div>

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#A9792F]">
                            Chairman's Message
                          </p>

                          <p className="mt-2 text-sm font-bold italic leading-6 text-[#243746] sm:text-base">
                            "एक विकसित, स्वच्छ, पारदर्शी और
                            नागरिक-केंद्रित मैनपुरी का निर्माण
                            हमारा संकल्प है।"
                          </p>
                        </div>
                      </div>

                      <div className="space-y-5 text-sm leading-7 text-[#687781]">
                        <p>
                          नगर पालिका परिषद, मैनपुरी के
                          आधिकारिक डिजिटल पोर्टल पर आपका
                          हार्दिक स्वागत है। हमारा उद्देश्य
                          नागरिकों को पारदर्शी, त्वरित और
                          सुविधाजनक नगर पालिका सेवाएं उपलब्ध
                          कराना है।
                        </p>

                        <p>
                          आधुनिक तकनीक के माध्यम से कर
                          भुगतान, नागरिक सेवाओं, शिकायत
                          निवारण तथा विभिन्न नगर पालिका
                          सुविधाओं को अधिक सरल और सुलभ
                          बनाया जा रहा है।
                        </p>

                        <p>
                          हम मैनपुरी के समावेशी विकास,
                          स्वच्छता, बेहतर आधारभूत सुविधाओं
                          और नागरिक सहभागिता के लिए
                          निरंतर प्रतिबद्ध हैं।
                        </p>
                      </div>

                      <div className="mt-auto pt-8">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123247] text-[#D8B26A]">
                            <ShieldCheck className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#123247]">
                              Citizen First Governance
                            </p>

                            <p className="mt-0.5 text-[10px] text-[#89949B]">
                              Transparent • Accessible • Digital
                            </p>
                          </div>
                        </div>
                      </div>
                    </m.div>
                  )}

                  {/* =========================================
                      VISION
                  ========================================== */}

                  {activeTab === "vision" && (
                    <m.div
                      key="vision"
                      initial={{
                        opacity: 0,
                        y: 12,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                    >
                      <div className="mb-7 flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123247] text-[#D8B26A]">
                          <Eye className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#A9792F]">
                            Future Direction
                          </p>

                          <h3 className="mt-1 font-serif text-xl font-black text-[#123247]">
                            Vision for Mainpuri
                          </h3>

                          <p className="mt-1 text-[10px] text-[#89949B]">
                            A cleaner, smarter and citizen-focused city
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          {
                            title:
                              "समावेशी एवं समान विकास",
                            desc:
                              "मैनपुरी के प्रत्येक वार्ड में आवश्यक बुनियादी सुविधाओं की समान पहुंच सुनिश्चित करना।",
                          },
                          {
                            title:
                              "स्वच्छ एवं हरित परिवेश",
                            desc:
                              "स्वच्छता, हरित क्षेत्र और पर्यावरण-अनुकूल पहलों के माध्यम से बेहतर शहरी वातावरण तैयार करना।",
                          },
                          {
                            title:
                              "आधुनिक आधारभूत संरचना",
                            desc:
                              "सड़क, प्रकाश, जलापूर्ति एवं अन्य नागरिक सुविधाओं के बुनियादी ढांचे को मजबूत करना।",
                          },
                          {
                            title:
                              "नागरिक सशक्तिकरण",
                            desc:
                              "डिजिटल सेवाओं के माध्यम से नागरिकों को त्वरित, सरल और पारदर्शी सुविधाएं उपलब्ध कराना।",
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="group rounded-2xl border border-[#E7E2D9] bg-[#FCFBF8] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C69A45]/40 hover:bg-white hover:shadow-[0_12px_30px_rgba(18,50,71,0.07)]"
                          >
                            <div className="mb-3 flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C69A45]/10 text-[#A9792F]">
                                <Award className="h-4 w-4" />
                              </div>

                              <h4 className="text-xs font-black text-[#243746]">
                                {item.title}
                              </h4>
                            </div>

                            <p className="pl-10 text-[11px] leading-5 text-[#687781]">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </m.div>
                  )}

                  {/* =========================================
                      MISSION
                  ========================================== */}

                  {activeTab === "mission" && (
                    <m.div
                      key="mission"
                      initial={{
                        opacity: 0,
                        y: 12,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                    >
                      <div className="mb-7 flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123247] text-[#D8B26A]">
                          <Target className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#A9792F]">
                            Action Plan
                          </p>

                          <h3 className="mt-1 font-serif text-xl font-black text-[#123247]">
                            Our Mission
                          </h3>

                          <p className="mt-1 text-[10px] text-[#89949B]">
                            Delivering measurable civic improvements
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          {
                            title:
                              "बुनियादी सुविधाएं",
                            desc:
                              "बेहतर जलापूर्ति, सड़क, नाली एवं आधुनिक स्ट्रीट लाइट जैसी आवश्यक नागरिक सुविधाओं को मजबूत करना।",
                          },
                          {
                            title:
                              "उत्कृष्ट स्वच्छता",
                            desc:
                              "स्वच्छता व्यवस्था, कचरा संग्रहण और प्रभावी अपशिष्ट प्रबंधन को बेहतर बनाना।",
                          },
                          {
                            title:
                              "डिजिटल सेवाएं",
                            desc:
                              "कर भुगतान, प्रमाण पत्र, लाइसेंस और शिकायत निवारण जैसी सेवाओं को ऑनलाइन और सरल बनाना।",
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="group flex flex-col rounded-2xl border border-[#E7E2D9] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#C69A45]/40 hover:shadow-[0_15px_35px_rgba(18,50,71,0.08)]"
                          >
                            <span className="inline-flex w-fit rounded-full border border-[#C69A45]/20 bg-[#C69A45]/[0.07] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#9A702D]">
                              Target 0{index + 1}
                            </span>

                            <h4 className="mt-4 text-sm font-black text-[#243746]">
                              {item.title}
                            </h4>

                            <p className="mt-2 text-[11px] leading-5 text-[#687781]">
                              {item.desc}
                            </p>

                            <div className="mt-auto pt-5">
                              <div className="h-1 overflow-hidden rounded-full bg-[#EEEAE2]">
                                <div className="h-full w-2/3 rounded-full bg-[#C69A45]" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>

                {/* =============================================
                    FOOTER INFORMATION
                ============================================== */}

                <div className="mt-8 flex flex-col gap-4 border-t border-[#E8E4DC] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7F5F0] text-[#A9792F]">
                      <CalendarDays className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-[#243746]">
                        नगर पालिका परिषद, मैनपुरी
                      </p>

                      <p className="mt-0.5 text-[9px] text-[#89949B]">
                        Mainpuri, Uttar Pradesh, India
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:border-l sm:border-[#E8E4DC] sm:pl-5">
                    <CheckCircle2 className="h-4 w-4 text-[#A9792F]" />

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#A9792F]">
                        Official Municipal Portal
                      </p>

                      <p className="mt-0.5 text-[9px] text-[#89949B]">
                        Government of Uttar Pradesh
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   TAB BUTTON
========================================================= */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`group flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
        active
          ? "bg-[#123247] text-white shadow-[0_8px_22px_rgba(18,50,71,0.16)]"
          : "border border-transparent bg-[#F3F1EC] text-[#687781] hover:border-[#D9D3C8] hover:bg-white hover:text-[#A9792F]"
      }`}
    >
      <span
        className={
          active
            ? "text-[#D8B26A]"
            : "text-[#8A969D] transition-colors group-hover:text-[#C69A45]"
        }
      >
        {icon}
      </span>

      <span>{label}</span>
    </button>
  )
}
