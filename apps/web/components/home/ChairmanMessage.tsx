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
      className="
        relative
        overflow-hidden
        bg-gradient-to-br
        from-[#effaf2]
        via-[#f8fdf9]
        to-[#eaf7ee]
        px-4
        py-20
        font-sans
        sm:py-24
        md:px-8
        lg:py-28
      "
    >
      {/* =====================================================
          PREMIUM BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-[500px]
          w-[500px]
          rounded-full
          bg-emerald-300/20
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-40
          -right-40
          h-[500px]
          w-[500px]
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
          h-[360px]
          w-[360px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-teal-200/10
          blur-[100px]
        "
      />

      {/* =====================================================
          ARCHITECTURAL GRID
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
          backgroundSize: "42px 42px",
        }}
      />

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

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
                h-6
                w-6
                items-center
                justify-center
                rounded-full
                bg-linear-to-br
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
            className="
              mt-5
              font-serif
              text-3xl
              font-black
              tracking-tight
              text-emerald-950
              sm:text-4xl
              md:text-5xl
            "
          >
            Chairman's Message

            <span className="block text-emerald-700">
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
            className="
              mx-auto
              mt-5
              max-w-2xl
              text-sm
              font-medium
              leading-7
              text-slate-600
              md:text-base
            "
          >
            Welcome to the official digital portal of{" "}
            <span className="font-bold text-emerald-700">
              नगर पंचायत गोवर्धन
            </span>
            . Our administration is committed to transparent
            governance, responsive civic services, cleanliness
            and sustainable development of Goverdhan, Mathura.
          </m.p>

          {/* Premium Divider */}

          <div className="mt-7 flex items-center justify-center gap-2">
            <span
              className="
                h-[3px]
                w-14
                rounded-full
                bg-linear-to-r
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
                bg-linear-to-r
                from-teal-400
                to-emerald-500
              "
            />
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
              className="
                group
                relative
                h-full
                overflow-hidden
                rounded-[28px]
                border
                border-emerald-900/30
                bg-linear-to-br
                from-[#064e3b]
                via-[#065f46]
                to-[#047857]
                shadow-[0_25px_70px_rgba(6,78,59,0.20)]
              "
            >
              {/* Top Accent */}

              <div
                className="
                  absolute
                  inset-x-0
                  top-0
                  h-1.5
                  bg-linear-to-r
                  from-lime-300
                  via-amber-300
                  to-emerald-300
                "
              />

              {/* Decorative Circles */}

              <div
                aria-hidden="true"
                className="
                  absolute
                  -right-24
                  -top-24
                  h-52
                  w-52
                  rounded-full
                  border
                  border-white/10
                "
              />

              <div
                aria-hidden="true"
                className="
                  absolute
                  -bottom-28
                  -left-28
                  h-60
                  w-60
                  rounded-full
                  border
                  border-lime-300/10
                "
              />

              <div className="relative flex h-full flex-col p-6 sm:p-7">

                {/* Official Badge */}

                <div className="flex justify-center">
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-lime-300/20
                      bg-white/10
                      px-3.5
                      py-1.5
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-lime-200
                      backdrop-blur-md
                    "
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Official Leadership
                  </span>
                </div>

                {/* Portrait */}

                <div className="my-7 flex justify-center">
                  <div className="relative">

                    <div
                      className="
                        absolute
                        -inset-2
                        rounded-[24px]
                        border
                        border-amber-300/30
                      "
                    />

                    <div
                      className="
                        absolute
                        -inset-4
                        rounded-[28px]
                        border
                        border-white/10
                      "
                    />

                    <div
                      className="
                        relative
                        aspect-[4/5]
                        w-[220px]
                        overflow-hidden
                        rounded-[20px]
                        border
                        border-white/10
                        bg-emerald-900
                        shadow-[0_20px_50px_rgba(0,0,0,0.3)]
                        sm:w-[235px]
                      "
                    >
                      <Image
                        src="/chairman.png"
                        alt="Chairman of Nagar Panchayat Goverdhan"
                        fill
                        priority={false}
                        className="
                          object-cover
                          object-top
                          transition-transform
                          duration-700
                          group-hover:scale-[1.035]
                        "
                        sizes="(max-width: 1024px) 220px, 235px"
                      />

                      <div
                        className="
                          absolute
                          inset-x-0
                          bottom-0
                          h-28
                          bg-linear-to-t
                          from-emerald-950
                          to-transparent
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* Name */}

                <div className="text-center">
                  <h3
                    className="
                      font-serif
                      text-xl
                      font-black
                      tracking-tight
                      text-white
                    "
                  >
                    अध्यक्ष
                  </h3>

                  <p
                    className="
                      mt-1
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.2em]
                      text-amber-300
                    "
                  >
                    Nagar Panchayat Goverdhan
                  </p>

                  <div
                    className="
                      mt-4
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-[10px]
                      font-medium
                      text-emerald-100/70
                    "
                  >
                    <MapPin className="h-3.5 w-3.5 text-amber-300" />

                    <span>
                      Goverdhan, Mathura, Uttar Pradesh
                    </span>
                  </div>
                </div>

                {/* Divider */}

                <div className="my-5 h-px bg-white/10" />

                {/* Official Info */}

                <div className="mt-auto grid grid-cols-2 gap-2">

                  <div
                    className="
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      p-3
                      transition-all
                      duration-300
                      hover:bg-white/10
                    "
                  >
                    <Landmark className="mb-2 h-4 w-4 text-amber-300" />

                    <p
                      className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-wider
                        text-emerald-100/50
                      "
                    >
                      Authority
                    </p>

                    <p
                      className="
                        mt-1
                        text-[9px]
                        font-bold
                        text-white
                      "
                    >
                      Nagar Panchayat
                    </p>
                  </div>

                  <div
                    className="
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      p-3
                      transition-all
                      duration-300
                      hover:bg-white/10
                    "
                  >
                    <CheckCircle2
                      className="mb-2 h-4 w-4 text-lime-300"
                    />

                    <p
                      className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-wider
                        text-emerald-100/50
                      "
                    >
                      Status
                    </p>

                    <p
                      className="
                        mt-1
                        text-[9px]
                        font-bold
                        text-white
                      "
                    >
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
              className="
                flex
                h-full
                flex-col
                overflow-hidden
                rounded-[28px]
                border
                border-emerald-100
                bg-white/95
                shadow-[0_20px_60px_rgba(6,78,59,0.09)]
                backdrop-blur-xl
              "
            >

              {/* =============================================
                  TAB NAVIGATION
              ============================================== */}

              <div
                className="
                  border-b
                  border-emerald-100
                  bg-emerald-50/50
                  p-3
                  sm:p-4
                "
              >
                <div
                  className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                  role="tablist"
                  aria-label="Chairman information"
                >

                  <TabButton
                    active={activeTab === "welcome"}
                    onClick={() =>
                      setActiveTab("welcome")
                    }
                    icon={
                      <Quote className="h-4 w-4" />
                    }
                    label="Welcome"
                  />

                  <TabButton
                    active={activeTab === "vision"}
                    onClick={() =>
                      setActiveTab("vision")
                    }
                    icon={
                      <Eye className="h-4 w-4" />
                    }
                    label="Our Vision"
                  />

                  <TabButton
                    active={activeTab === "mission"}
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

                  {/* =================================================
                      WELCOME
                  ================================================== */}

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

                      <div
                        className="
                          mb-7
                          flex
                          items-start
                          gap-4
                          rounded-2xl
                          border
                          border-emerald-200
                          bg-gradient-to-r
                          from-emerald-50
                          to-lime-50
                          p-5
                        "
                      >
                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-emerald-600
                            text-white
                            shadow-md
                          "
                        >
                          <Quote className="h-5 w-5 rotate-180" />
                        </div>

                        <div>
                          <p
                            className="
                              text-[8px]
                              font-black
                              uppercase
                              tracking-[0.18em]
                              text-emerald-700
                            "
                          >
                            Chairman's Message
                          </p>

                          <p
                            className="
                              mt-2
                              text-sm
                              font-bold
                              italic
                              leading-6
                              text-emerald-950
                              sm:text-base
                            "
                          >
                            "स्वच्छ, सुंदर, विकसित और
                            नागरिक-केंद्रित गोवर्धन का निर्माण
                            हमारा संकल्प है।"
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                          space-y-5
                          text-sm
                          leading-7
                          text-slate-600
                        "
                      >
                        <p>
                          नगर पंचायत गोवर्धन, मथुरा के
                          आधिकारिक डिजिटल पोर्टल पर आपका
                          हार्दिक स्वागत है। हमारा उद्देश्य
                          गोवर्धन क्षेत्र के नागरिकों को
                          पारदर्शी, त्वरित और सुविधाजनक
                          नगर पंचायत सेवाएं उपलब्ध कराना है।
                        </p>

                        <p>
                          आधुनिक तकनीक के माध्यम से कर
                          भुगतान, नागरिक सेवाओं, प्रमाण
                          पत्रों, शिकायत निवारण तथा विभिन्न
                          नगर पंचायत सुविधाओं को अधिक सरल,
                          तेज और सुलभ बनाया जा रहा है।
                        </p>

                        <p>
                          गोवर्धन की धार्मिक एवं सांस्कृतिक
                          पहचान को ध्यान में रखते हुए
                          स्वच्छता, पर्यावरण संरक्षण,
                          बेहतर आधारभूत सुविधाओं और
                          नागरिक सहभागिता को प्राथमिकता
                          दी जा रही है।
                        </p>

                        <p>
                          हमारा प्रयास है कि गोवर्धन एक
                          स्वच्छ, सुरक्षित, सुव्यवस्थित और
                          आधुनिक नगर पंचायत के रूप में
                          निरंतर आगे बढ़े।
                        </p>
                      </div>

                      <div className="mt-auto pt-8">
                        <div className="flex items-center gap-3">

                          <div
                            className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-xl
                              bg-emerald-100
                              text-emerald-700
                            "
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </div>

                          <div>
                            <p
                              className="
                                text-[9px]
                                font-black
                                uppercase
                                tracking-[0.14em]
                                text-emerald-800
                              "
                            >
                              Citizen First Governance
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-[10px]
                                text-slate-500
                              "
                            >
                              Transparent • Accessible • Digital
                            </p>
                          </div>

                        </div>
                      </div>
                    </m.div>
                  )}

                  {/* =================================================
                      VISION
                  ================================================== */}

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

                        <div
                          className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-xl
                            bg-linear-to-br
                            from-emerald-500
                            to-green-600
                            text-white
                            shadow-lg
                          "
                        >
                          <Eye className="h-5 w-5" />
                        </div>

                        <div>
                          <p
                            className="
                              text-[8px]
                              font-black
                              uppercase
                              tracking-[0.18em]
                              text-emerald-700
                            "
                          >
                            Future Direction
                          </p>

                          <h3
                            className="
                              mt-1
                              font-serif
                              text-xl
                              font-black
                              text-emerald-950
                            "
                          >
                            Vision for Goverdhan
                          </h3>

                          <p
                            className="
                              mt-1
                              text-[10px]
                              text-slate-500
                            "
                          >
                            A cleaner, greener and citizen-focused
                            Goverdhan
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">

                        {[
                          {
                            title: "स्वच्छ एवं सुंदर गोवर्धन",
                            desc:
                              "स्वच्छता, हरित क्षेत्र और पर्यावरण-अनुकूल पहलों के माध्यम से गोवर्धन को स्वच्छ एवं सुंदर बनाना।",
                          },
                          {
                            title: "सांस्कृतिक विरासत संरक्षण",
                            desc:
                              "गोवर्धन की धार्मिक, सांस्कृतिक और ऐतिहासिक पहचान को संरक्षित रखते हुए व्यवस्थित विकास को बढ़ावा देना।",
                          },
                          {
                            title: "आधुनिक नागरिक सुविधाएं",
                            desc:
                              "सड़क, प्रकाश, जलापूर्ति, नाली और अन्य आवश्यक नागरिक सुविधाओं के बुनियादी ढांचे को मजबूत करना।",
                          },
                          {
                            title: "डिजिटल नागरिक सशक्तिकरण",
                            desc:
                              "डिजिटल सेवाओं के माध्यम से नागरिकों को सरल, त्वरित और पारदर्शी सरकारी सुविधाएं उपलब्ध कराना।",
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="
                              group
                              rounded-2xl
                              border
                              border-emerald-100
                              bg-linear-to-br
                              from-white
                              to-emerald-50/40
                              p-4
                              transition-all
                              duration-300
                              hover:-translate-y-1
                              hover:border-emerald-300
                              hover:bg-white
                              hover:shadow-[0_12px_30px_rgba(6,78,59,0.10)]
                            "
                          >

                            <div className="mb-3 flex items-center gap-2.5">

                              <div
                                className="
                                  flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-emerald-100
                                  text-emerald-700
                                  transition-all
                                  group-hover:bg-emerald-600
                                  group-hover:text-white
                                "
                              >
                                <Award className="h-4 w-4" />
                              </div>

                              <h4
                                className="
                                  text-xs
                                  font-black
                                  text-emerald-950
                                "
                              >
                                {item.title}
                              </h4>

                            </div>

                            <p
                              className="
                                pl-10
                                text-[11px]
                                leading-5
                                text-slate-600
                              "
                            >
                              {item.desc}
                            </p>

                          </div>
                        ))}
                      </div>
                    </m.div>
                  )}

                  {/* =================================================
                      MISSION
                  ================================================== */}

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

                        <div
                          className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-xl
                            bg-linear-to-br
                            from-amber-500
                            to-orange-500
                            text-white
                            shadow-lg
                          "
                        >
                          <Target className="h-5 w-5" />
                        </div>

                        <div>
                          <p
                            className="
                              text-[8px]
                              font-black
                              uppercase
                              tracking-[0.18em]
                              text-amber-700
                            "
                          >
                            Action Plan
                          </p>

                          <h3
                            className="
                              mt-1
                              font-serif
                              text-xl
                              font-black
                              text-emerald-950
                            "
                          >
                            Our Mission
                          </h3>

                          <p
                            className="
                              mt-1
                              text-[10px]
                              text-slate-500
                            "
                          >
                            Better civic services for Goverdhan
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">

                        {[
                          {
                            title: "बुनियादी सुविधाएं",
                            desc:
                              "बेहतर जलापूर्ति, सड़क, नाली, सार्वजनिक प्रकाश और अन्य आवश्यक नागरिक सुविधाओं को मजबूत करना।",
                          },
                          {
                            title: "स्वच्छ एवं हरित गोवर्धन",
                            desc:
                              "स्वच्छता व्यवस्था, कचरा संग्रहण, हरित क्षेत्र और प्रभावी अपशिष्ट प्रबंधन को बेहतर बनाना।",
                          },
                          {
                            title: "डिजिटल सेवाएं",
                            desc:
                              "कर भुगतान, प्रमाण पत्र, लाइसेंस और शिकायत निवारण जैसी सेवाओं को ऑनलाइन एवं सरल बनाना।",
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="
                              group
                              flex
                              flex-col
                              rounded-2xl
                              border
                              border-emerald-100
                              bg-white
                              p-5
                              transition-all
                              duration-300
                              hover:-translate-y-1
                              hover:border-emerald-300
                              hover:shadow-[0_15px_35px_rgba(6,78,59,0.10)]
                            "
                          >

                            <span
                              className="
                                inline-flex
                                w-fit
                                rounded-full
                                border
                                border-emerald-200
                                bg-emerald-50
                                px-2.5
                                py-1
                                text-[8px]
                                font-black
                                uppercase
                                tracking-[0.12em]
                                text-emerald-700
                              "
                            >
                              Target 0{index + 1}
                            </span>

                            <h4
                              className="
                                mt-4
                                text-sm
                                font-black
                                text-emerald-950
                              "
                            >
                              {item.title}
                            </h4>

                            <p
                              className="
                                mt-2
                                text-[11px]
                                leading-5
                                text-slate-600
                              "
                            >
                              {item.desc}
                            </p>

                            <div className="mt-auto pt-5">

                              <div
                                className="
                                  h-1
                                  overflow-hidden
                                  rounded-full
                                  bg-emerald-100
                                "
                              >
                                <div
                                  className="
                                    h-full
                                    w-2/3
                                    rounded-full
                                    bg-linear-to-r
                                    from-emerald-500
                                    to-lime-500
                                  "
                                />
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

                <div
                  className="
                    mt-8
                    flex
                    flex-col
                    gap-4
                    border-t
                    border-emerald-100
                    pt-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-emerald-50
                        text-emerald-700
                      "
                    >
                      <CalendarDays className="h-4 w-4" />
                    </div>

                    <div>
                      <p
                        className="
                          text-[10px]
                          font-black
                          text-emerald-950
                        "
                      >
                        नगर पंचायत गोवर्धन
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          text-slate-500
                        "
                      >
                        Goverdhan, Mathura, Uttar Pradesh
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      sm:border-l
                      sm:border-emerald-100
                      sm:pl-5
                    "
                  >
                    <CheckCircle2
                      className="
                        h-4
                        w-4
                        text-emerald-600
                      "
                    />

                    <div>
                      <p
                        className="
                          text-[8px]
                          font-black
                          uppercase
                          tracking-[0.13em]
                          text-emerald-700
                        "
                      >
                        Official Municipal Portal
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          text-slate-500
                        "
                      >
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
      className={`
        group
        flex
        h-11
        cursor-pointer
        items-center
        justify-center
        gap-2
        rounded-xl
        px-4
        text-[9px]
        font-black
        uppercase
        tracking-[0.1em]
        transition-all
        duration-300
        ${
          active
            ? `
              bg-linear-to-r
              from-emerald-700
              to-green-600
              text-white
              shadow-[0_8px_22px_rgba(6,78,59,0.18)]
            `
            : `
              border
              border-transparent
              bg-white
              text-slate-500
              hover:border-emerald-200
              hover:bg-emerald-50
              hover:text-emerald-700
              hover:shadow-sm
            `
        }
      `}
    >
      <span
        className={
          active
            ? "text-lime-300"
            : "text-slate-400 transition-colors group-hover:text-emerald-600"
        }
      >
        {icon}
      </span>

      <span>{label}</span>
    </button>
  )
}
