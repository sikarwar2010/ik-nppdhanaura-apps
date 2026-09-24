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
      className="
        relative
        overflow-hidden
        bg-gradient-to-b
        from-[#F1FAF3]
        via-white
        to-[#EAF7EE]
        px-4
        py-16
        font-sans
        sm:py-20
        md:px-8
        md:py-24
      "
    >
      {/* =====================================================
          BACKGROUND AMBIENT GLOWS
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[360px]
          w-[650px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-emerald-300/15
          blur-[130px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-24
          top-10
          h-64
          w-64
          rounded-full
          bg-lime-300/15
          blur-[100px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          bottom-0
          h-72
          w-72
          rounded-full
          bg-emerald-400/10
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
          opacity-60
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
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 50%, black 45%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 65% at 50% 50%, black 45%, transparent 100%)",
        }}
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
          className="
            group
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-emerald-200/80
            bg-gradient-to-br
            from-[#0E5138]
            via-[#146044]
            to-[#0A3D2B]
            p-7
            shadow-[0_25px_70px_rgba(15,81,50,0.18)]
            sm:p-9
            md:rounded-[34px]
            md:p-12
          "
        >

          {/* =================================================
              CARD BACKGROUND EFFECTS
          ================================================== */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-80
              w-80
              rounded-full
              bg-lime-300/[0.07]
              blur-3xl
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -bottom-24
              -left-20
              h-72
              w-72
              rounded-full
              bg-emerald-300/[0.08]
              blur-3xl
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              right-[18%]
              top-0
              h-40
              w-40
              rounded-full
              bg-[#D8B26A]/[0.09]
              blur-3xl
            "
          />

          {/* =================================================
              ARCHITECTURAL GRID
          ================================================== */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-[0.045]
            "
            style={{
              backgroundImage: `
                linear-gradient(
                  90deg,
                  #ffffff 1px,
                  transparent 1px
                ),
                linear-gradient(
                  #ffffff 1px,
                  transparent 1px
                )
              `,
              backgroundSize: "42px 42px",
            }}
          />

          {/* =================================================
              GOLD TOP LINE
          ================================================== */}

          <div
            aria-hidden="true"
            className="
              absolute
              inset-x-0
              top-0
              h-[4px]
              bg-gradient-to-r
              from-transparent
              via-[#D8B26A]
              to-transparent
            "
          />

          {/* =================================================
              CONTENT
          ================================================== */}

          <div
            className="
              relative
              z-10
              flex
              flex-col
              items-center
              justify-between
              gap-9
              lg:flex-row
              lg:gap-12
            "
          >

            {/* =================================================
                LEFT CONTENT
            ================================================== */}

            <div
              className="
                max-w-2xl
                text-center
                lg:text-left
              "
            >

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
                className="
                  mb-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[#D8B26A]/25
                  bg-white/[0.07]
                  px-3.5
                  py-1.5
                  shadow-sm
                  backdrop-blur-xl
                "
              >

                <span
                  className="
                    relative
                    flex
                    h-6
                    w-6
                    items-center
                    justify-center
                    rounded-full
                    bg-[#C69A45]/15
                  "
                >
                  <span
                    className="
                      absolute
                      inset-0
                      animate-ping
                      rounded-full
                      bg-[#C69A45]/10
                    "
                  />

                  <ShieldCheck
                    className="
                      relative
                      h-3.5
                      w-3.5
                      text-[#E4C47D]
                    "
                  />
                </span>

                <span
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-[#E4C47D]
                    sm:text-[10px]
                  "
                >
                  जन शिकायत निवारण
                </span>

                <span
                  className="
                    h-1
                    w-1
                    rounded-full
                    bg-[#D8B26A]
                  "
                />

                <span
                  className="
                    hidden
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-emerald-100/60
                    sm:inline
                  "
                >
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
                className="
                  font-serif
                  text-2xl
                  font-black
                  leading-[1.15]
                  tracking-[-0.02em]
                  text-white
                  sm:text-3xl
                  md:text-4xl
                "
              >
                नगर पंचायत गोवर्धन से संबंधित कोई{" "}

                <span
                  className="
                    bg-gradient-to-r
                    from-[#E6C984]
                    via-[#F2D99A]
                    to-[#D8B26A]
                    bg-clip-text
                    text-transparent
                  "
                >
                  शिकायत या सुझाव है?
                </span>
              </m.h2>

              {/* Gold Divider */}

              <div
                className="
                  mt-5
                  flex
                  items-center
                  justify-center
                  gap-2
                  lg:justify-start
                "
              >
                <span
                  className="
                    h-[2px]
                    w-12
                    rounded-full
                    bg-[#C69A45]
                  "
                />

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[#E4C47D]
                    shadow-[0_0_12px_rgba(228,196,125,0.4)]
                  "
                />

                <span
                  className="
                    h-[2px]
                    w-5
                    rounded-full
                    bg-white/20
                  "
                />
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
                className="
                  mt-5
                  max-w-xl
                  text-[11px]
                  font-medium
                  leading-6
                  text-emerald-50/75
                  sm:text-xs
                  md:text-sm
                  md:leading-7
                "
              >
                अपनी समस्या, शिकायत या सुझाव ऑनलाइन दर्ज कराएं।
                नगर पंचायत गोवर्धन, मथुरा नागरिकों को पारदर्शी,
                उत्तरदायी और त्वरित सेवा प्रदान करने के लिए
                प्रतिबद्ध है।
              </m.p>

              {/* Trust Indicators */}

              <div
                className="
                  mt-6
                  flex
                  flex-wrap
                  items-center
                  justify-center
                  gap-x-5
                  gap-y-2.5
                  lg:justify-start
                "
              >

                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className="
                      h-3.5
                      w-3.5
                      text-[#E4C47D]
                    "
                  />

                  <span
                    className="
                      text-[8px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-emerald-100/60
                      sm:text-[9px]
                    "
                  >
                    Easy Registration
                  </span>
                </div>

                <span
                  className="
                    hidden
                    h-4
                    w-px
                    bg-white/10
                    sm:block
                  "
                />

                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className="
                      h-3.5
                      w-3.5
                      text-[#E4C47D]
                    "
                  />

                  <span
                    className="
                      text-[8px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-emerald-100/60
                      sm:text-[9px]
                    "
                  >
                    Transparent Process
                  </span>
                </div>

                <span
                  className="
                    hidden
                    h-4
                    w-px
                    bg-white/10
                    sm:block
                  "
                />

                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className="
                      h-3.5
                      w-3.5
                      text-[#E4C47D]
                    "
                  />

                  <span
                    className="
                      text-[8px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-emerald-100/60
                      sm:text-[9px]
                    "
                  >
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
              className="
                w-full
                shrink-0
                lg:w-[340px]
              "
            >

              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.045]
                  p-3
                  shadow-[0_15px_40px_rgba(0,0,0,0.12)]
                  backdrop-blur-xl
                "
              >

                {/* =================================================
                    MAIN CTA
                ================================================== */}

                <Link
                  href="/public-grievance"
                  className="
                    group
                    flex
                    min-h-[60px]
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    bg-gradient-to-r
                    from-[#D1A64C]
                    via-[#C69A45]
                    to-[#B98A35]
                    px-4
                    text-white
                    shadow-[0_10px_30px_rgba(198,154,69,0.22)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:from-[#E0B963]
                    hover:via-[#D1A64C]
                    hover:to-[#C69A45]
                    hover:shadow-[0_16px_38px_rgba(198,154,69,0.35)]
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#E4C47D]
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-[#0E5138]
                  "
                >

                  <span
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <span
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        bg-white/15
                        transition-transform
                        duration-300
                        group-hover:scale-110
                      "
                    >
                      <MessageSquarePlus
                        className="h-4 w-4"
                      />
                    </span>

                    <span className="text-left">

                      <span
                        className="
                          block
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.08em]
                        "
                      >
                        शिकायत दर्ज करें
                      </span>

                      <span
                        className="
                          mt-0.5
                          block
                          text-[8px]
                          font-medium
                          text-white/70
                        "
                      >
                        Submit your grievance online
                      </span>

                    </span>

                  </span>

                  <span
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-white/10
                      transition-all
                      duration-300
                      group-hover:translate-x-1
                      group-hover:bg-white/20
                    "
                  >
                    <ArrowRight
                      className="h-4 w-4"
                    />
                  </span>

                </Link>

                {/* =================================================
                    CONTACT CTA
                ================================================== */}

                <Link
                  href="/contact"
                  className="
                    group
                    mt-2
                    flex
                    min-h-[60px]
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.045]
                    px-4
                    text-white
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:border-[#D8B26A]/30
                    hover:bg-white/[0.09]
                    hover:shadow-lg
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-white/40
                  "
                >

                  <span
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <span
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-white/10
                        bg-white/[0.05]
                        transition-all
                        duration-300
                        group-hover:border-[#D8B26A]/30
                        group-hover:bg-[#C69A45]/10
                      "
                    >
                      <PhoneCall
                        className="
                          h-4
                          w-4
                          text-[#E4C47D]
                        "
                      />
                    </span>

                    <span className="text-left">

                      <span
                        className="
                          block
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.08em]
                        "
                      >
                        संपर्क कार्यालय
                      </span>

                      <span
                        className="
                          mt-0.5
                          block
                          text-[8px]
                          font-medium
                          text-emerald-100/50
                        "
                      >
                        Contact Nagar Panchayat Office
                      </span>

                    </span>

                  </span>

                  <ArrowRight
                    className="
                      h-4
                      w-4
                      text-emerald-100/40
                      transition-all
                      duration-300
                      group-hover:translate-x-1
                      group-hover:text-[#E4C47D]
                    "
                  />

                </Link>

                {/* =================================================
                    BOTTOM INFORMATION
                ================================================== */}

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-center
                    gap-2
                    border-t
                    border-white/[0.07]
                    pt-3
                  "
                >

                  <Sparkles
                    className="
                      h-3 w-3
                      text-[#E4C47D]
                    "
                  />

                  <span
                    className="
                      text-[8px]
                      font-semibold
                      text-emerald-100/40
                    "
                  >
                    Nagar Panchayat Goverdhan, Mathura
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
