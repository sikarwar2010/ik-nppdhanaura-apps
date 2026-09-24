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

    /* =====================================================
       SPECIAL DECIMAL PERCENTAGE
    ====================================================== */

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

    /* =====================================================
       NORMAL COUNT UP
    ====================================================== */

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
      className="
        font-sans
        text-[30px]
        font-black
        leading-none
        tracking-[-0.045em]
        text-emerald-950
        sm:text-[34px]
        md:text-[38px]
      "
    >
      {displayValue}

      <span className="ml-0.5 text-amber-600">
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
      targetValue: 50000,
      suffix: "+",
      icon: (
        <Users className="h-5 w-5" />
      ),
    },

    {
      label: "Nagar Panchayat Wards",
      labelHi: "नगर पंचायत वार्ड",
      targetValue: 18,
      suffix: "",
      icon: (
        <Landmark className="h-5 w-5" />
      ),
    },

    {
      label: "Development Projects",
      labelHi: "विकास परियोजनाएं",
      targetValue: 120,
      suffix: "+",
      icon: (
        <Wrench className="h-5 w-5" />
      ),
    },

    {
      label: "Water Connections",
      labelHi: "पेयजल कनेक्शन",
      targetValue: 12500,
      suffix: "+",
      icon: (
        <Droplets className="h-5 w-5" />
      ),
    },

    {
      label: "Complaints Resolved",
      labelHi: "निवारित शिकायतें",
      targetValue: 98.4,
      suffix: "%",
      icon: (
        <MessageSquare className="h-5 w-5" />
      ),
    },
  ]

  return (
    <section
      id="statistics"
      aria-label="Goverdhan municipal statistics"
      className="
        relative
        overflow-hidden
        bg-gradient-to-br
        from-[#effaf2]
        via-[#f8fdf9]
        to-[#eaf7ee]
        py-16
        font-sans
        sm:py-20
        md:py-24
      "
    >

      {/* =====================================================
          PREMIUM BACKGROUND GLOWS
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-[430px]
          w-[430px]
          rounded-full
          bg-emerald-300/20
          blur-[110px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-40
          -bottom-40
          h-[480px]
          w-[480px]
          rounded-full
          bg-lime-300/20
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[300px]
          w-[500px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-teal-300/10
          blur-[110px]
        "
      />

      {/* =====================================================
          PREMIUM GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.55]
        "
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(16,100,67,0.055) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(16,100,67,0.055) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "46px 46px",
        }}
      />

      {/* =====================================================
          DECORATIVE SIDE LINES
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-0
          top-[52%]
          hidden
          h-px
          w-[13%]
          bg-gradient-to-r
          from-transparent
          to-emerald-400/30
          lg:block
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-0
          top-[52%]
          hidden
          h-px
          w-[13%]
          bg-gradient-to-l
          from-transparent
          to-emerald-400/30
          lg:block
        "
      />

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-7xl
          px-4
          md:px-8
        "
      >

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
          className="
            mb-10
            text-center
            sm:mb-12
          "
        >

          {/* Badge */}

          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-emerald-200
              bg-white/80
              px-4
              py-2
              shadow-[0_8px_25px_rgba(16,100,67,0.08)]
              backdrop-blur-md
            "
          >

            <span
              className="
                flex
                h-5
                w-5
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-emerald-500
                to-green-500
                text-white
              "
            >
              <Sparkles className="h-3 w-3" />
            </span>

            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.18em]
                text-emerald-800
                sm:text-[10px]
              "
            >
              Goverdhan At A Glance
            </span>

          </div>

          {/* Heading */}

          <h2
            className="
              mt-5
              font-serif
              text-3xl
              font-black
              tracking-[-0.025em]
              text-emerald-950
              sm:text-4xl
              md:text-5xl
            "
          >
            Goverdhan in Numbers
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-xl
              text-[11px]
              font-medium
              leading-6
              text-slate-600
              sm:text-xs
              md:text-sm
            "
          >
            Key indicators reflecting the reach of civic
            services, development initiatives and citizen
            engagement across Nagar Panchayat Goverdhan.
          </p>

          {/* Premium Divider */}

          <div
            className="
              mt-6
              flex
              items-center
              justify-center
              gap-2
            "
          >
            <span
              className="
                h-[3px]
                w-14
                rounded-full
                bg-gradient-to-r
                from-emerald-500
                to-green-400
              "
            />

            <span
              className="
                h-2
                w-2
                rounded-full
                bg-amber-500
              "
            />

            <span
              className="
                h-[3px]
                w-5
                rounded-full
                bg-lime-500
              "
            />

            <span
              className="
                h-[3px]
                w-14
                rounded-full
                bg-gradient-to-r
                from-teal-400
                to-emerald-500
              "
            />
          </div>

        </m.div>

        {/* ===================================================
            STATISTICS GRID
        ==================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:gap-4
            lg:grid-cols-5
          "
        >

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
              className="
                group
                relative
                overflow-hidden
                rounded-[22px]
                border
                border-emerald-100
                bg-white/90
                p-4
                shadow-[0_8px_30px_rgba(6,78,59,0.055)]
                backdrop-blur-md
                transition-all
                duration-300

                hover:-translate-y-2
                hover:border-emerald-300
                hover:bg-white
                hover:shadow-[0_20px_45px_rgba(6,78,59,0.13)]

                sm:p-5
              "
            >

              {/* =================================================
                  COLOURFUL TOP LINE
              ================================================== */}

              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-0
                  h-[4px]
                  origin-left
                  scale-x-50
                  bg-gradient-to-r
                  from-emerald-500
                  via-lime-400
                  to-amber-400
                  opacity-60
                  transition-all
                  duration-500
                  group-hover:scale-x-100
                  group-hover:opacity-100
                "
              />

              {/* =================================================
                  HOVER GLOW
              ================================================== */}

              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -right-12
                  -top-12
                  h-32
                  w-32
                  rounded-full
                  bg-emerald-400/10
                  blur-2xl
                  opacity-0
                  transition-opacity
                  duration-300
                  group-hover:opacity-100
                "
              />

              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -bottom-10
                  -left-10
                  h-24
                  w-24
                  rounded-full
                  bg-lime-400/10
                  blur-2xl
                  opacity-0
                  transition-opacity
                  duration-300
                  group-hover:opacity-100
                "
              />

              {/* =================================================
                  ICON + STATUS
              ================================================== */}

              <div
                className="
                  relative
                  flex
                  items-center
                  justify-between
                "
              >

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-emerald-100
                    bg-gradient-to-br
                    from-emerald-50
                    to-lime-50
                    text-emerald-700
                    transition-all
                    duration-300

                    group-hover:border-emerald-500
                    group-hover:bg-gradient-to-br
                    group-hover:from-emerald-600
                    group-hover:to-green-500
                    group-hover:text-white
                    group-hover:shadow-lg
                    group-hover:shadow-emerald-500/20
                  "
                >
                  {stat.icon}
                </div>

                {/* Active Indicator */}

                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                  "
                >

                  <span
                    className="
                      relative
                      flex
                      h-1.5
                      w-1.5
                    "
                  >
                    <span
                      className="
                        absolute
                        inline-flex
                        h-full
                        w-full
                        animate-ping
                        rounded-full
                        bg-emerald-500/30
                      "
                    />

                    <span
                      className="
                        relative
                        inline-flex
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-emerald-500
                      "
                    />
                  </span>

                  <span
                    className="
                      hidden
                      text-[7px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-slate-400
                      sm:block
                    "
                  >
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

                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-emerald-700
                    transition-colors
                    group-hover:text-emerald-600
                  "
                >
                  {stat.labelHi}
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    font-semibold
                    leading-4
                    text-slate-600
                    transition-colors
                    group-hover:text-emerald-950
                  "
                >
                  {stat.label}
                </p>

              </div>

              {/* =================================================
                  PROGRESS
              ================================================== */}

              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-2
                "
              >

                <div
                  className="
                    h-1
                    flex-1
                    overflow-hidden
                    rounded-full
                    bg-emerald-100
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-emerald-500
                      via-green-500
                      to-lime-400
                      transition-all
                      duration-700
                      group-hover:w-full
                    "
                    style={{
                      width:
                        index === 4
                          ? "98%"
                          : `${55 + index * 8}%`,
                    }}
                  />
                </div>

                <CheckCircle2
                  className="
                    h-3
                    w-3
                    shrink-0
                    text-emerald-600
                    transition-transform
                    duration-300
                    group-hover:scale-125
                  "
                />

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
          className="
            mt-5
            flex
            flex-col
            gap-3
            rounded-2xl
            border
            border-emerald-100
            bg-white/75
            px-4
            py-3.5
            shadow-[0_8px_25px_rgba(6,78,59,0.05)]
            backdrop-blur-md
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-5
          "
        >

          {/* Left */}

          <div
            className="
              flex
              items-center
              gap-2.5
            "
          >

            <div
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-gradient-to-br
                from-emerald-500
                to-green-500
                text-white
                shadow-sm
              "
            >
              <Landmark className="h-3.5 w-3.5" />
            </div>

            <div>

              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-emerald-950
                "
              >
                Nagar Panchayat Goverdhan
              </p>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  font-medium
                  text-slate-500
                "
              >
                Goverdhan, Mathura, Uttar Pradesh
              </p>

            </div>
          </div>

          {/* Right */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <CheckCircle2
              className="
                h-3.5
                w-3.5
                text-emerald-600
              "
            />

            <span
              className="
                text-[8px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-slate-500
              "
            >
              Official Nagar Panchayat Statistics
            </span>

          </div>

        </m.div>

      </div>
    </section>
  )
}
