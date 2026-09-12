"use client"

import { m } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  MessageSquarePlus,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

export default function GrievanceBanner() {
  return (
    <section
      id="public-grievance"
      className="relative overflow-hidden bg-linear-to-b from-slate-50 via-white to-slate-50 px-4 py-16 font-sans sm:py-20 md:px-8 md:py-24"
    >
      {/* =====================================================
          BACKGROUND DECORATION
          Original background preserved
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-75 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[140px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-20 h-56 w-56 rounded-full bg-[#C69A45]/[0.035] blur-[90px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-[#123247]/[0.035] blur-[100px]"
      />

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="relative z-10 mx-auto max-w-7xl">
        <m.div
          initial={{
            opacity: 0,
            y: 24,
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
            ease: "easeOut",
          }}
          className="group relative overflow-hidden rounded-[28px] border border-[#C69A45]/25 bg-linear-to-r from-[#123247] via-[#173D52] to-[#0E2B3C] p-7 shadow-[0_25px_70px_rgba(18,50,71,0.16)] sm:p-9 md:rounded-[32px] md:p-12"
        >
          {/* =================================================
              PREMIUM BACKGROUND DETAILS
          ================================================== */}

          {/* Large glow */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/[0.035] blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C69A45]/[0.07] blur-3xl"
          />

          {/* Gold glow */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[20%] top-0 h-36 w-36 rounded-full bg-[#D8B26A]/[0.07] blur-2xl"
          />

          {/* Architectural grid */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #ffffff 1px, transparent 1px), linear-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Top gold line */}

          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-transparent via-[#D8B26A] to-transparent"
          />

          {/* =================================================
              CONTENT
          ================================================== */}

          <div className="relative z-10 flex flex-col items-center justify-between gap-9 lg:flex-row lg:gap-12">
            {/* =================================================
                LEFT CONTENT
            ================================================== */}

            <div className="max-w-2xl text-center lg:text-left">
              {/* Badge */}

              <m.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.45,
                  delay: 0.1,
                }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D8B26A]/20 bg-white/6 px-3.5 py-1.5 shadow-sm backdrop-blur-xl"
              >
                <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-[#C69A45]/10">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#C69A45]/10" />

                  <ShieldCheck className="relative h-3.5 w-3.5 text-[#D8B26A]" />
                </span>

                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#E0BD79] sm:text-[10px]">
                  जन शिकायत निवारण
                </span>

                <span className="h-1 w-1 rounded-full bg-[#D8B26A]" />

                <span className="hidden text-[8px] font-bold uppercase tracking-wider text-slate-400 sm:inline">
                  Public Grievance
                </span>
              </m.div>

              {/* Heading */}

              <m.h2
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.15,
                }}
                className="font-serif text-2xl font-black leading-[1.15] tracking-[-0.02em] text-white sm:text-3xl md:text-4xl"
              >
                नगर पालिका से संबंधित कोई
                <span className="text-[#D8B26A]">
                  {" "}
                  शिकायत या सुझाव है?
                </span>
              </m.h2>

              {/* Gold divider */}

              <div className="mt-5 flex items-center justify-center gap-2 lg:justify-start">
                <span className="h-0.5 w-12 rounded-full bg-[#C69A45]" />

                <span className="h-1.5 w-1.5 rounded-full bg-[#D8B26A]" />

                <span className="h-0.5 w-4 rounded-full bg-white/20" />
              </div>

              {/* Description */}

              <m.p
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                }}
                className="mt-5 max-w-xl text-[11px] font-medium leading-6 text-slate-300 sm:text-xs md:text-sm md:leading-7"
              >
                अपनी समस्या, शिकायत या सुझाव ऑनलाइन दर्ज
                कराएं। नगर पालिका परिषद, मैनपुरी नागरिकों
                को पारदर्शी, उत्तरदायी और त्वरित सेवा
                प्रदान करने के लिए प्रतिबद्ध है।
              </m.p>

              {/* Trust indicators */}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#D8B26A]" />

                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[9px]">
                    Easy Registration
                  </span>
                </div>

                <span className="hidden h-4 w-px bg-white/10 sm:block" />

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#D8B26A]" />

                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[9px]">
                    Transparent Process
                  </span>
                </div>

                <span className="hidden h-4 w-px bg-white/10 sm:block" />

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#D8B26A]" />

                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[9px]">
                    Citizen First
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                RIGHT ACTION PANEL
            ================================================== */}

            <m.div
              initial={{
                opacity: 0,
                x: 20,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.55,
                delay: 0.2,
              }}
              className="w-full shrink-0 lg:w-85"
            >
              <div className="rounded-2xl border border-white/10 bg-white/4.5 p-3 shadow-[0_15px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                {/* Main CTA */}

                <Link
                  href="/public-grievance"
                  className="group flex min-h-14.5 w-full items-center justify-between rounded-xl bg-[#C69A45] px-4 text-white shadow-[0_10px_30px_rgba(198,154,69,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#B4873A] hover:shadow-[0_15px_35px_rgba(198,154,69,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B26A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#123247]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                      <MessageSquarePlus className="h-4 w-4" />
                    </span>

                    <span className="text-left">
                      <span className="block text-[10px] font-black uppercase tracking-[0.08em]">
                        शिकायत दर्ज करें
                      </span>

                      <span className="mt-0.5 block text-[8px] font-medium text-white/70">
                        Submit your grievance online
                      </span>
                    </span>
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                {/* Contact CTA */}

                <Link
                  href="/contact"
                  className="group mt-2 flex min-h-14.5 w-full items-center justify-between rounded-xl border border-white/10 bg-white/4.5 px-4 text-white transition-all duration-300 hover:border-white/20 hover:bg-white/9 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <PhoneCall className="h-4 w-4 text-[#D8B26A]" />
                    </span>

                    <span className="text-left">
                      <span className="block text-[10px] font-black uppercase tracking-[0.08em]">
                        संपर्क कार्यालय
                      </span>

                      <span className="mt-0.5 block text-[8px] font-medium text-slate-400">
                        Contact municipal office
                      </span>
                    </span>
                  </span>

                  <ArrowRight className="h-4 w-4 text-slate-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#D8B26A]" />
                </Link>

                {/* Bottom info */}

                <div className="mt-3 flex items-center justify-center gap-2 border-t border-white/[0.07] pt-3">
                  <Sparkles className="h-3 w-3 text-[#D8B26A]" />

                  <span className="text-[8px] font-semibold text-slate-500">
                    Nagar Palika Parishad, Mainpuri
                  </span>
                </div>
              </div>
            </m.div>
          </div>
        </m.div>
      </div>
    </section>
  )
}
