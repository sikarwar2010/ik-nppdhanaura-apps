"use client"

import { m, useInView } from "framer-motion"
import {
  CheckCircle2,
  Droplets,
  Landmark,
  MessageSquare,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react"
import React, {
  useEffect,
  useRef,
  useState,
} from "react"

/* =========================================================
   TYPES
========================================================= */

interface StatItem {
  label: string
  labelHi: string
  targetValue: number
  suffix: string
  icon: React.ReactNode
}

/* =========================================================
   COUNT UP
========================================================= */

function CountUp({
  value,
  suffix,
  duration = 1600,
}: {
  value: number
  suffix: string
  duration?: number
}) {
  const [count, setCount] = useState(0)

  const elementRef =
    useRef<HTMLSpanElement | null>(null)

  const isInView = useInView(elementRef, {
    once: true,
    margin: "-80px",
  })

  useEffect(() => {
    if (!isInView) return

    /*
      Special handling for decimal percentage
    */

    if (value === 98.4) {
      let current = 0

      const totalFrames = Math.max(
        Math.floor(duration / 16),
        1,
      )

      const step = 98.4 / totalFrames

      const timer = setInterval(() => {
        current += step

        if (current >= 98.4) {
          current = 98.4
          clearInterval(timer)
        }

        setCount(current)
      }, 16)

      return () => clearInterval(timer)
    }

    let current = 0

    const totalFrames = Math.max(
      Math.floor(duration / 16),
      1,
    )

    const step = Math.max(
      Math.ceil(value / totalFrames),
      1,
    )

    const timer = setInterval(() => {
      current += step

      if (current >= value) {
        current = value
        clearInterval(timer)
      }

      setCount(current)
    }, 16)

    return () => clearInterval(timer)
  }, [isInView, value, duration])

  const displayValue =
    value === 98.4
      ? count.toFixed(1)
      : Math.round(count).toLocaleString("en-IN")

  return (
    <span
      ref={elementRef}
      className="font-sans text-[30px] font-black leading-none tracking-[-0.045em] text-[#123247] sm:text-[34px] md:text-[38px]"
    >
      {displayValue}

      <span className="ml-0.5 text-[#B07D2D]">
        {suffix}
      </span>
    </span>
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Statistics() {
  const stats: StatItem[] = [
    {
      label: "Total Population",
      labelHi: "कुल जनसंख्या",
      targetValue: 35000,
      suffix: "+",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Municipal Wards",
      labelHi: "नगर पालिका वार्ड",
      targetValue: 32,
      suffix: "",
      icon: <Landmark className="h-5 w-5" />,
    },
    {
      label: "Development Projects",
      labelHi: "विकास परियोजनाएं",
      targetValue: 120,
      suffix: "+",
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      label: "Water Connections",
      labelHi: "पेयजल कनेक्शन",
      targetValue: 12500,
      suffix: "+",
      icon: <Droplets className="h-5 w-5" />,
    },
    {
      label: "Complaints Resolved",
      labelHi: "निवारित शिकायतें",
      targetValue: 98.4,
      suffix: "%",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ]

  return (
    <section
      id="statistics"
      aria-label="Municipal statistics"
      className="relative overflow-hidden bg-[#F7F5F0] py-16 font-sans sm:py-20 md:py-24"
    >
      {/* =====================================================
          SOFT BACKGROUND DECORATION
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-105 w-105 rounded-full bg-[#C69A45]/5.5 blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-44 -right-36 h-120 w-120 rounded-full bg-[#123247]/[0.035] blur-[110px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-75 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D8B26A]/2.5 blur-[100px]"
      />

      {/* =====================================================
          SUBTLE ARCHITECTURAL GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #123247 1px, transparent 1px), linear-gradient(#123247 1px, transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />

      {/* =====================================================
          DECORATIVE SIDE LINES
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-[52%] hidden h-px w-[13%] bg-linear-to-r from-transparent to-[#C69A45]/30 lg:block"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-[52%] hidden h-px w-[13%] bg-linear-to-l from-transparent to-[#C69A45]/30 lg:block"
      />

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        {/* ===================================================
            HEADER
        ==================================================== */}

        <m.div
          initial={{
            opacity: 0,
            y: 18,
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
          className="mb-10 text-center sm:mb-12"
        >
          {/* Badge */}

          <div className="inline-flex items-center gap-2 rounded-full border border-[#C69A45]/25 bg-white/70 px-4 py-2 shadow-[0_5px_20px_rgba(18,50,71,0.04)] backdrop-blur-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C69A45]/10">
              <Sparkles className="h-3 w-3 text-[#A9792F]" />
            </span>

            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#96702F] sm:text-[10px]">
              Mainpuri At A Glance
            </span>
          </div>

          {/* Heading */}

          <h2 className="mt-5 font-serif text-3xl font-black tracking-tight text-[#123247] sm:text-4xl md:text-5xl">
            Mainpuri in Numbers
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-[11px] font-medium leading-6 text-[#687781] sm:text-xs md:text-sm">
            Key indicators reflecting the reach of municipal
            services, civic development and citizen engagement.
          </p>

          {/* Gold divider */}

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="h-0.5 w-14 rounded-full bg-[#C69A45]" />

            <span className="h-1.5 w-1.5 rounded-full bg-[#123247]" />

            <span className="h-0.5 w-4 rounded-full bg-[#D8B26A]" />
          </div>
        </m.div>

        {/* ===================================================
            STATISTICS GRID
        ==================================================== */}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {stats.map((stat, index) => (
            <m.article
              key={stat.label}
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
                amount: 0.15,
              }}
              transition={{
                duration: 0.55,
                delay: index * 0.07,
              }}
              className="group relative overflow-hidden rounded-[22px] border border-[#DDD8CF] bg-white p-4 shadow-[0_8px_30px_rgba(18,50,71,0.055)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C69A45]/45 hover:shadow-[0_18px_45px_rgba(18,50,71,0.10)] sm:p-5"
            >
              {/* =================================================
                  TOP GOLD LINE
              ================================================== */}

              <div className="absolute left-0 right-0 top-0 h-0.75 origin-left scale-x-50 bg-linear-to-r from-[#A9792F] via-[#D8B26A] to-transparent opacity-50 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-100" />

              {/* =================================================
                  SOFT HOVER GLOW
              ================================================== */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#C69A45]/5.5 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              {/* =================================================
                  ICON + STATUS
              ================================================== */}

              <div className="relative flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D9D3C8] bg-[#F7F5F0] text-[#123247] transition-all duration-300 group-hover:border-[#C69A45]/40 group-hover:bg-[#123247] group-hover:text-[#D8B26A]">
                  {stat.icon}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/30" />

                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>

                  <span className="hidden text-[7px] font-bold uppercase tracking-wider text-[#9AA4A9] sm:block">
                    Active
                  </span>
                </div>
              </div>

              {/* =================================================
                  NUMBER
              ================================================== */}

              <div className="relative mt-6">
                <CountUp
                  value={stat.targetValue}
                  suffix={stat.suffix}
                />
              </div>

              {/* =================================================
                  LABEL
              ================================================== */}

              <div className="relative mt-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#A9792F]">
                  {stat.labelHi}
                </p>

                <p className="mt-1 text-[10px] font-semibold leading-4 text-[#687781] transition-colors group-hover:text-[#123247]">
                  {stat.label}
                </p>
              </div>

              {/* =================================================
                  PROGRESS
              ================================================== */}

              <div className="mt-5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#EEEAE2]">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#A9792F] to-[#D8B26A] transition-all duration-700 group-hover:w-full"
                    style={{
                      width:
                        index === 4
                          ? "98%"
                          : `${55 + index * 8}%`,
                    }}
                  />
                </div>

                <CheckCircle2 className="h-3 w-3 shrink-0 text-[#B68A3B]" />
              </div>
            </m.article>
          ))}
        </div>

        {/* ===================================================
            BOTTOM OFFICIAL BAR
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
            delay: 0.25,
          }}
          className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#DDD8CF] bg-white/75 px-4 py-3.5 shadow-[0_8px_25px_rgba(18,50,71,0.04)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          {/* Left */}

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C69A45]/10 text-[#A9792F]">
              <Landmark className="h-3.5 w-3.5" />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#123247]">
                Nagar Palika Parishad, Mainpuri
              </p>

              <p className="mt-0.5 text-[9px] font-medium text-[#8A969D]">
                Government of Uttar Pradesh
              </p>
            </div>
          </div>

          {/* Right */}

          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />

            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7F8B91]">
              Official Municipal Statistics
            </span>
          </div>
        </m.div>
      </div>
    </section>
  )
}
