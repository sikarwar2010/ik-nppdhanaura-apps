"use client"

import { AnimatePresence, motion as m } from "framer-motion"
import {
  AlertOctagon,
  Award,
  CheckCircle,
  Construction,
  CreditCard,
  Download,
  Droplet,
  FileCheck2,
  FileText,
  HelpCircle,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react"
import React, { useState } from "react"

interface ServiceItem {
  id: string
  name: string
  nameHi: string
  desc: string
  icon: React.ReactNode
  color: string
  softColor: string
  badgeColor: string
  pdfName: string
}

export default function CitizenServices() {
  const [activeService, setActiveService] =
    useState<ServiceItem | null>(null)

  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const services: ServiceItem[] = [
    {
      id: "prop-tax",
      name: "Property Tax",
      nameHi: "संपत्ति कर भुगतान",
      desc:
        "Pay yearly house or property tax and generate official municipal receipts online.",
      icon: <CreditCard className="h-6 w-6" />,
      color:
        "from-orange-500 via-amber-500 to-yellow-500",
      softColor:
        "bg-orange-50 text-orange-600 ring-orange-200",
      badgeColor:
        "border-orange-200 bg-orange-50 text-orange-700",
      pdfName:
        "Goverdhan_Property_Tax_Assessment.pdf",
    },

    {
      id: "water-tax",
      name: "Water Tax",
      nameHi: "जल कर भुगतान",
      desc:
        "Check water supply billing details and settle municipal water dues conveniently.",
      icon: <Droplet className="h-6 w-6" />,
      color:
        "from-cyan-500 via-sky-500 to-blue-600",
      softColor:
        "bg-sky-50 text-sky-600 ring-sky-200",
      badgeColor:
        "border-sky-200 bg-sky-50 text-sky-700",
      pdfName:
        "Goverdhan_Water_Connection_Form.pdf",
    },

    {
      id: "birth-cert",
      name: "Birth Certificate",
      nameHi: "जन्म प्रमाण पत्र",
      desc:
        "Apply for birth registration and obtain verified municipal birth documentation.",
      icon: <Award className="h-6 w-6" />,
      color:
        "from-emerald-500 via-green-500 to-teal-500",
      softColor:
        "bg-emerald-50 text-emerald-600 ring-emerald-200",
      badgeColor:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      pdfName:
        "Birth_Registration_Goverdhan.pdf",
    },

    {
      id: "death-cert",
      name: "Death Certificate",
      nameHi: "मृत्यु प्रमाण पत्र",
      desc:
        "Register a death record and apply for official municipal death documentation.",
      icon: <FileCheck2 className="h-6 w-6" />,
      color:
        "from-slate-600 via-slate-700 to-zinc-800",
      softColor:
        "bg-slate-100 text-slate-700 ring-slate-200",
      badgeColor:
        "border-slate-200 bg-slate-100 text-slate-700",
      pdfName:
        "Death_Registration_Goverdhan.pdf",
    },

    {
      id: "trade-lic",
      name: "Trade License",
      nameHi: "व्यापार लाइसेंस",
      desc:
        "Apply for a new trade license or renew an existing commercial permission.",
      icon: <Store className="h-6 w-6" />,
      color:
        "from-amber-500 via-orange-500 to-red-500",
      softColor:
        "bg-amber-50 text-amber-600 ring-amber-200",
      badgeColor:
        "border-amber-200 bg-amber-50 text-amber-700",
      pdfName:
        "Trade_License_Application_Goverdhan.pdf",
    },

    {
      id: "build-perm",
      name: "Building Permission",
      nameHi: "भवन निर्माण अनुमति",
      desc:
        "Submit building plans and required documents for municipal construction approval.",
      icon: <Construction className="h-6 w-6" />,
      color:
        "from-violet-500 via-purple-500 to-indigo-600",
      softColor:
        "bg-violet-50 text-violet-600 ring-violet-200",
      badgeColor:
        "border-violet-200 bg-violet-50 text-violet-700",
      pdfName:
        "Building_Permission_Goverdhan.pdf",
    },

    {
      id: "rti",
      name: "RTI Application",
      nameHi: "सूचना का अधिकार (RTI)",
      desc:
        "Submit formal Right to Information requests to the Nagar Panchayat office.",
      icon: <HelpCircle className="h-6 w-6" />,
      color:
        "from-teal-500 via-cyan-500 to-blue-500",
      softColor:
        "bg-teal-50 text-teal-600 ring-teal-200",
      badgeColor:
        "border-teal-200 bg-teal-50 text-teal-700",
      pdfName:
        "RTI_Application_Form_Goverdhan.pdf",
    },

    {
      id: "grievance",
      name: "Complaint Registry",
      nameHi: "शिकायत पंजीकरण",
      desc:
        "Register civic complaints related to sanitation, roads, streetlights and public services.",
      icon: <AlertOctagon className="h-6 w-6" />,
      color:
        "from-rose-500 via-red-500 to-pink-600",
      softColor:
        "bg-rose-50 text-rose-600 ring-rose-200",
      badgeColor:
        "border-rose-200 bg-rose-50 text-rose-700",
      pdfName:
        "Civic_Grievance_Form_Goverdhan.pdf",
    },
  ]

  const handleCardClick = (service: ServiceItem) => {
    setActiveService(service)
    setDownloading(false)
    setDownloaded(false)
  }

  const handleDownload = () => {
    setDownloading(true)

    setTimeout(() => {
      setDownloading(false)
      setDownloaded(true)

      setTimeout(() => {
        setActiveService(null)
        setDownloaded(false)
      }, 1500)
    }, 1500)
  }

  return (
    <section
      id="citizen-services"
      className="
        relative isolate overflow-hidden
        bg-linear-to-br
        from-[#effaf2]
        via-[#f9fdf9]
        to-[#e8f7ed]
        px-4 py-20
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
          absolute -left-40 top-20
          h-[420px] w-[420px]
          rounded-full
          bg-emerald-300/20
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute -right-40 bottom-10
          h-[450px] w-[450px]
          rounded-full
          bg-lime-300/20
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute left-1/2 top-1/2
          h-[360px] w-[360px]
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
          absolute inset-0
          opacity-[0.5]
        "
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(16, 100, 67, 0.055) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(16, 100, 67, 0.055) 1px,
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
            HEADER
        ==================================================== */}

        <div className="mx-auto mb-14 max-w-3xl text-center">
          <m.div
            initial={{
              opacity: 0,
              y: -12,
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
                flex h-6 w-6
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-emerald-500
                to-green-500
                text-white
                shadow-sm
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
              Nagar Panchayat • Goverdhan, Mathura
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
            }}
            transition={{
              duration: 0.6,
              delay: 0.05,
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
            Unified Citizen Services
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
              delay: 0.1,
            }}
            className="
              mx-auto
              mt-4
              max-w-2xl
              text-sm
              font-medium
              leading-7
              text-slate-600
              md:text-base
            "
          >
            Access official application forms and essential civic
            services through the digital citizen portal of Nagar
            Panchayat Goverdhan, Mathura.
          </m.p>

          {/* Decorative Divider */}

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
                flex h-7 w-7
                items-center
                justify-center
                rounded-full
                border
                border-emerald-200
                bg-white
                shadow-sm
              "
            >
              <LandmarkIcon />
            </span>

            <span className="h-[3px] w-5 rounded-full bg-amber-400" />

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
            SERVICE GRID
        ==================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-6
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {services.map((service, index) => (
            <m.button
              type="button"
              key={service.id}
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
                amount: 0.1,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.06,
              }}
              onClick={() => handleCardClick(service)}
              className={`
                group
                relative
                flex
                h-[285px]
                cursor-pointer
                flex-col
                justify-between
                overflow-hidden
                rounded-[26px]
                border
                border-emerald-100
                bg-white/90
                p-6
                text-left
                shadow-[0_12px_35px_rgba(16,100,67,0.07)]
                backdrop-blur-xl
                transition-all
                duration-500
                hover:-translate-y-2
                hover:border-emerald-200
                hover:bg-white
                hover:shadow-[0_25px_60px_rgba(16,100,67,0.16)]
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-emerald-500
                focus-visible:ring-offset-2
              `}
            >
              {/* Color Strip */}

              <div
                className={`
                  absolute
                  inset-x-0
                  top-0
                  h-1.5
                  bg-gradient-to-r
                  ${service.color}
                `}
              />

              {/* Background Glow */}

              <div
                className={`
                  pointer-events-none
                  absolute
                  -right-14
                  -top-14
                  h-40
                  w-40
                  rounded-full
                  bg-linear-to-br
                  ${service.color}
                  opacity-[0.06]
                  blur-2xl
                  transition-all
                  duration-500
                  group-hover:scale-150
                  group-hover:opacity-[0.13]
                `}
              />

              {/* =================================================
                  TOP
              ================================================== */}

              <div className="relative z-10">
                <div className="mb-5 flex items-start justify-between">
                  {/* Icon */}

                  <div className="relative">
                    <div
                      className={`
                        absolute
                        -inset-2
                        rounded-2xl
                        bg-gradient-to-br
                        ${service.color}
                        opacity-0
                        blur-lg
                        transition-all
                        duration-500
                        group-hover:opacity-20
                      `}
                    />

                    <div
                      className={`
                        relative
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-2xl
                        bg-gradient-to-br
                        ${service.color}
                        text-white
                        shadow-lg
                        transition-all
                        duration-500
                        group-hover:scale-110
                        group-hover:-rotate-3
                      `}
                    >
                      {service.icon}
                    </div>
                  </div>

                  {/* Badge */}

                  <span
                    className={`
                      rounded-full
                      border
                      px-2.5
                      py-1
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      ${service.badgeColor}
                    `}
                  >
                    PDF FORM
                  </span>
                </div>

                {/* Hindi */}

                <span
                  className="
                    block
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-emerald-700
                  "
                >
                  {service.nameHi}
                </span>

                {/* English */}

                <h3
                  className="
                    mt-1.5
                    text-[18px]
                    font-black
                    tracking-tight
                    text-emerald-950
                    transition-colors
                    duration-300
                    group-hover:text-emerald-700
                  "
                >
                  {service.name}
                </h3>

                {/* Description */}

                <p
                  className="
                    mt-3
                    line-clamp-3
                    text-[11px]
                    font-medium
                    leading-5
                    text-slate-600
                  "
                >
                  {service.desc}
                </p>
              </div>

              {/* =================================================
                  ACTION
              ================================================== */}

              <div
                className="
                  relative
                  z-10
                  flex
                  items-center
                  justify-between
                  border-t
                  border-emerald-100
                  pt-4
                "
              >
                <span
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.13em]
                    text-emerald-700
                  "
                >
                  Download Form
                </span>

                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    bg-emerald-50
                    text-emerald-700
                    transition-all
                    duration-300
                    group-hover:bg-emerald-600
                    group-hover:text-white
                    group-hover:shadow-lg
                  "
                >
                  <Download
                    className="
                      h-3.5
                      w-3.5
                      transition-transform
                      duration-300
                      group-hover:translate-y-0.5
                    "
                  />
                </span>
              </div>

              {/* Bottom Hover Line */}

              <div
                className={`
                  pointer-events-none
                  absolute
                  inset-x-8
                  bottom-0
                  h-[2px]
                  origin-center
                  scale-x-0
                  rounded-full
                  bg-gradient-to-r
                  ${service.color}
                  transition-transform
                  duration-500
                  group-hover:scale-x-100
                `}
              />
            </m.button>
          ))}
        </div>

        {/* ===================================================
            BOTTOM INFORMATION
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
            delay: 0.2,
          }}
          className="
            mt-8
            overflow-hidden
            rounded-2xl
            border
            border-emerald-200
            bg-gradient-to-r
            from-emerald-800
            via-emerald-700
            to-teal-700
            shadow-[0_18px_45px_rgba(16,100,67,0.16)]
          "
        >
          <div
            className="
              relative
              flex
              flex-col
              gap-4
              px-5
              py-5
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-6
            "
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                h-48
                w-48
                rounded-full
                bg-lime-300/15
                blur-3xl
              "
            />

            <div className="relative flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/10
                  text-amber-300
                  ring-1
                  ring-white/10
                "
              >
                <FileText className="h-4 w-4" />
              </div>

              <div>
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-lime-300
                  "
                >
                  Official Citizen Portal
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    font-medium
                    text-emerald-50/80
                  "
                >
                  Nagar Panchayat Goverdhan, Mathura
                  <span className="mx-1.5 text-amber-300">
                    •
                  </span>
                  Government of Uttar Pradesh
                </p>
              </div>
            </div>

            <a
              href="/services"
              onClick={(e) => e.stopPropagation()}
              className="
                group
                relative
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/10
                px-4
                py-2.5
                text-[9px]
                font-black
                uppercase
                tracking-[0.12em]
                text-white
                backdrop-blur-md
                transition-all
                duration-300
                hover:border-amber-300/40
                hover:bg-amber-400
                hover:text-emerald-950
                hover:shadow-lg
              "
            >
              Explore Services

              <span
                className="
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                "
              >
                →
              </span>
            </a>
          </div>
        </m.div>
      </div>

      {/* =====================================================
          DOWNLOAD MODAL
      ====================================================== */}

      <AnimatePresence>
        {activeService && (
          <div
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              bg-emerald-950/60
              p-4
              backdrop-blur-md
            "
            onClick={() => setActiveService(null)}
          >
            <m.div
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 15,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative
                w-full
                max-w-md
                overflow-hidden
                rounded-[28px]
                border
                border-emerald-100
                bg-white
                shadow-[0_30px_80px_rgba(0,0,0,0.25)]
              "
            >
              {/* Modal Gradient */}

              <div
                className={`
                  absolute
                  inset-x-0
                  top-0
                  h-1.5
                  bg-gradient-to-r
                  ${activeService.color}
                `}
              />

              {/* Header */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-emerald-100
                  bg-gradient-to-r
                  from-emerald-50
                  to-white
                  px-6
                  py-5
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-linear-to-br
                      ${activeService.color}
                      text-white
                      shadow-lg
                    `}
                  >
                    {activeService.icon}
                  </div>

                  <div>
                    <h3
                      className="
                        text-sm
                        font-black
                        text-emerald-950
                      "
                    >
                      {activeService.name}
                    </h3>

                    <p
                      className="
                        mt-0.5
                        text-[10px]
                        font-bold
                        text-emerald-700
                      "
                    >
                      {activeService.nameHi}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveService(null)}
                  aria-label="Close dialog"
                  className="
                    flex
                    h-9
                    w-9
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-slate-200
                    bg-white
                    text-slate-500
                    transition-all
                    hover:border-rose-200
                    hover:bg-rose-50
                    hover:text-rose-600
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}

              <div className="p-6 text-center">
                {downloaded ? (
                  <m.div
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    className="flex flex-col items-center py-7"
                  >
                    <div
                      className="
                        flex
                        h-20
                        w-20
                        items-center
                        justify-center
                        rounded-full
                        bg-emerald-50
                        text-emerald-600
                        ring-8
                        ring-emerald-50/60
                      "
                    >
                      <CheckCircle className="h-10 w-10" />
                    </div>

                    <h4
                      className="
                        mt-5
                        text-lg
                        font-black
                        text-emerald-950
                      "
                    >
                      Download Complete
                    </h4>

                    <p
                      className="
                        mt-2
                        text-xs
                        font-medium
                        leading-5
                        text-slate-500
                      "
                    >
                      Your official document is ready.
                    </p>
                  </m.div>
                ) : (
                  <>
                    <div
                      className={`
                        mx-auto
                        flex
                        h-20
                        w-20
                        items-center
                        justify-center
                        rounded-2xl
                        bg-linear-to-br
                        ${activeService.color}
                        text-white
                        shadow-xl
                      `}
                    >
                      <FileText className="h-9 w-9" />
                    </div>

                    <h4
                      className="
                        mt-5
                        text-lg
                        font-black
                        text-emerald-950
                      "
                    >
                      Official Document Ready
                    </h4>

                    <p
                      className="
                        mx-auto
                        mt-2
                        max-w-sm
                        text-xs
                        font-medium
                        leading-5
                        text-slate-600
                      "
                    >
                      Download the official application form
                      for{" "}
                      <span className="font-bold text-emerald-700">
                        {activeService.name}
                      </span>{" "}
                      issued for Nagar Panchayat Goverdhan.
                    </p>

                    <div
                      className="
                        mt-4
                        inline-flex
                        max-w-full
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-emerald-100
                        bg-emerald-50/70
                        px-3
                        py-2
                      "
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-600" />

                      <span
                        className="
                          truncate
                          font-mono
                          text-[10px]
                          font-bold
                          text-emerald-800
                        "
                      >
                        {activeService.pdfName}
                      </span>
                    </div>

                    {/* Buttons */}

                    <div
                      className="
                        mt-6
                        flex
                        items-center
                        justify-center
                        gap-3
                        border-t
                        border-slate-100
                        pt-5
                      "
                    >
                      <button
                        type="button"
                        onClick={() => setActiveService(null)}
                        className="
                          cursor-pointer
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-5
                          py-2.5
                          text-xs
                          font-bold
                          text-slate-600
                          transition-all
                          hover:border-slate-300
                          hover:bg-slate-50
                        "
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        className={`
                          flex
                          min-w-[145px]
                          cursor-pointer
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-gradient-to-r
                          ${activeService.color}
                          px-5
                          py-2.5
                          text-xs
                          font-black
                          text-white
                          shadow-lg
                          transition-all
                          hover:-translate-y-0.5
                          hover:shadow-xl
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        `}
                      >
                        {downloading ? (
                          <>
                            <span
                              className="
                                h-3.5
                                w-3.5
                                animate-spin
                                rounded-full
                                border-2
                                border-white
                                border-t-transparent
                              "
                            />
                            <span>
                              Preparing...
                            </span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            <span>
                              Download PDF
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* =========================================================
   SMALL LANDMARK ICON
========================================================= */

function LandmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3.5 w-3.5 text-emerald-600"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M5 21V10" />
      <path d="M19 21V10" />
      <path d="M4 10h16" />
      <path d="M6 10 12 4l6 6" />
      <path d="M8 21v-7" />
      <path d="M12 21v-7" />
      <path d="M16 21v-7" />
    </svg>
  )
}
