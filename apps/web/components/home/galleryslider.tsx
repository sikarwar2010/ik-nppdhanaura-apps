"use client"

import React, { useEffect, useState } from "react"
import { m } from "framer-motion"
import {
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Landmark,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"

interface Achievement {
  id: number
  title: string
  category: string
  image: string
  description: string
}

const achievementsData: Achievement[] = [
  {
    id: 1,
    title: "Swachh Bharat Initiative",
    category: "Clean & Green Goverdhan",
    image:
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=85&w=1000",
    description:
      "नगर पंचायत गोवर्धन द्वारा स्वच्छता, कचरा प्रबंधन एवं स्वच्छ नगर अभियान को निरंतर बढ़ावा दिया जा रहा है।",
  },
  {
    id: 2,
    title: "Digital Citizen Services",
    category: "Digital Governance",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=85&w=1000",
    description:
      "नागरिकों को तेज, पारदर्शी और सुविधाजनक डिजिटल सेवाएं उपलब्ध कराने की दिशा में निरंतर प्रयास।",
  },
  {
    id: 3,
    title: "Urban Development",
    category: "Infrastructure Development",
    image:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=85&w=1000",
    description:
      "सड़क, नाली, सार्वजनिक सुविधाओं और अन्य नागरिक बुनियादी ढांचे के विकास एवं रखरखाव पर विशेष ध्यान।",
  },
  {
    id: 4,
    title: "Green Goverdhan Initiative",
    category: "Environment & Sustainability",
    image:
      "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&q=85&w=1000",
    description:
      "हरित क्षेत्र बढ़ाने, वृक्षारोपण और पर्यावरण संरक्षण के माध्यम से स्वच्छ एवं सुंदर गोवर्धन की दिशा में पहल।",
  },
  {
    id: 5,
    title: "Citizen Service Excellence",
    category: "Public Service",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=85&w=1000",
    description:
      "नागरिक शिकायतों, सेवाओं और स्थानीय प्रशासन से जुड़ी आवश्यकताओं के त्वरित समाधान के लिए बेहतर व्यवस्था।",
  },
  {
    id: 6,
    title: "Water Supply Development",
    category: "Water & Civic Utilities",
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=85&w=1000",
    description:
      "नागरिकों तक बेहतर पेयजल सुविधा पहुंचाने और जल आपूर्ति व्यवस्था को मजबूत करने के लिए निरंतर कार्य।",
  },
  {
    id: 7,
    title: "Smart Civic Infrastructure",
    category: "Modern Governance",
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=85&w=1000",
    description:
      "आधुनिक तकनीक और बेहतर शहरी प्रबंधन के माध्यम से गोवर्धन के नागरिक बुनियादी ढांचे को सुदृढ़ करना।",
  },
]

export default function CertificationsSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedImage, setSelectedImage] =
    useState<Achievement | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const itemsPerPage = 3

  const maxIndex = Math.max(
    0,
    achievementsData.length - itemsPerPage
  )

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? maxIndex : prev - 1
    )
  }

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev >= maxIndex ? 0 : prev + 1
    )
  }

  useEffect(() => {
    if (isPaused || selectedImage) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev >= maxIndex ? 0 : prev + 1
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [maxIndex, isPaused, selectedImage])

  return (
    <section
      id="achievements"
      className="
        relative
        overflow-hidden
        bg-gradient-to-br
        from-[#EFFAF2]
        via-[#FFFFFF]
        to-[#EAF7EE]
        px-4
        py-20
        font-sans
        sm:py-24
        md:px-8
      "
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-32
          top-10
          h-[400px]
          w-[400px]
          rounded-full
          bg-emerald-300/15
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-32
          bottom-0
          h-[450px]
          w-[450px]
          rounded-full
          bg-lime-300/15
          blur-[130px]
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
          w-[650px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-teal-200/10
          blur-[120px]
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
          opacity-70
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
          maskImage:
            "radial-gradient(ellipse 75% 70% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 70% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* =====================================================
            SECTION HEADER
        ====================================================== */}

        <div className="mx-auto mb-14 max-w-3xl text-center">

          <m.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
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
              shadow-[0_8px_30px_rgba(15,81,50,0.08)]
              backdrop-blur-xl
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
                to-green-600
                text-white
                shadow-md
              "
            >
              <Award className="h-3.5 w-3.5" />
            </span>

            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.16em]
                text-emerald-800
                sm:text-[10px]
              "
            >
              Nagar Panchayat Goverdhan
            </span>
          </m.div>

          <m.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="
              mt-5
              font-serif
              text-3xl
              font-black
              leading-tight
              tracking-tight
              text-[#143D2C]
              sm:text-4xl
              md:text-5xl
            "
          >
            उपलब्धियां एवं

            <span
              className="
                ml-2
                bg-gradient-to-r
                from-emerald-700
                via-green-600
                to-[#B58A3B]
                bg-clip-text
                text-transparent
              "
            >
              सम्मान
            </span>

            <span
              className="
                mt-1
                block
                text-xl
                font-bold
                text-[#52675B]
                sm:text-2xl
              "
            >
              Achievements & Recognitions
            </span>
          </m.h2>

          <m.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.14 }}
            className="
              mx-auto
              mt-4
              max-w-2xl
              text-sm
              font-medium
              leading-7
              text-[#5A6D63]
              md:text-base
            "
          >
            नगर पंचायत गोवर्धन, मथुरा द्वारा नागरिक सुविधाओं,
            स्वच्छता, पर्यावरण, डिजिटल शासन एवं शहरी विकास के
            क्षेत्र में किए जा रहे महत्वपूर्ण प्रयास।
          </m.p>

          {/* Divider */}

          <div className="mt-6 flex items-center justify-center gap-2">
            <span
              className="
                h-[3px]
                w-14
                rounded-full
                bg-gradient-to-r
                from-transparent
                to-emerald-500
              "
            />

            <Sparkles
              className="
                h-4
                w-4
                text-[#C69A45]
              "
            />

            <span
              className="
                h-[3px]
                w-14
                rounded-full
                bg-gradient-to-l
                from-transparent
                to-emerald-500
              "
            />
          </div>
        </div>

        {/* =====================================================
            SLIDER
        ====================================================== */}

        <div
          className="relative px-1 sm:px-4 md:px-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >

          {/* LEFT ARROW */}

          <button
            onClick={prevSlide}
            aria-label="Previous achievement"
            className="
              group
              absolute
              left-0
              top-1/2
              z-20
              flex
              h-11
              w-11
              -translate-x-1
              -translate-y-1/2
              cursor-pointer
              items-center
              justify-center
              rounded-full
              border
              border-emerald-100
              bg-white/95
              text-emerald-700
              shadow-[0_10px_30px_rgba(15,81,50,0.12)]
              backdrop-blur-xl
              transition-all
              duration-300
              hover:scale-110
              hover:border-emerald-500
              hover:bg-emerald-600
              hover:text-white
              hover:shadow-[0_15px_35px_rgba(16,185,129,0.25)]
              md:-translate-x-5
            "
          >
            <ChevronLeft
              className="
                h-5
                w-5
                transition-transform
                group-hover:-translate-x-0.5
              "
            />
          </button>

          {/* =================================================
              CARDS VIEWPORT
          ================================================== */}

          <div className="overflow-hidden rounded-3xl">
            <div
              className="
                flex
                gap-5
                transition-transform
                duration-700
                ease-out
              "
              style={{
                transform: `translateX(-${
                  currentIndex * (100 / itemsPerPage)
                }%)`,
              }}
            >

              {achievementsData.map((achievement, index) => (

                <div
                  key={achievement.id}
                  className="
                    min-w-full
                    flex-shrink-0
                    md:min-w-[calc(33.333%-13.333px)]
                  "
                >

                  <m.div
                    initial={{
                      opacity: 0,
                      y: 20,
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
                      delay: index * 0.05,
                    }}
                    onClick={() =>
                      setSelectedImage(achievement)
                    }
                    className="
                      group
                      flex
                      h-full
                      cursor-pointer
                      flex-col
                      overflow-hidden
                      rounded-[26px]
                      border
                      border-emerald-100
                      bg-white/90
                      p-4
                      shadow-[0_12px_35px_rgba(15,81,50,0.07)]
                      backdrop-blur-xl
                      transition-all
                      duration-500
                      hover:-translate-y-2
                      hover:border-emerald-300
                      hover:shadow-[0_25px_55px_rgba(15,81,50,0.16)]
                    "
                  >

                    {/* TOP ACCENT */}

                    <div
                      className="
                        absolute
                        left-0
                        right-0
                        top-0
                        h-1
                        rounded-t-[26px]
                        bg-linear-to-r
                        from-emerald-500
                        via-[#C69A45]
                        to-lime-500
                        opacity-80
                        transition-all
                        duration-300
                        group-hover:h-1.5
                        group-hover:opacity-100
                      "
                    />

                    {/* IMAGE */}

                    <div
                      className="
                        relative
                        mb-5
                        h-56
                        overflow-hidden
                        rounded-2xl
                        border
                        border-emerald-50
                        bg-emerald-50
                        sm:h-60
                      "
                    >

                      <img
                        src={achievement.image}
                        alt={achievement.title}
                        className="
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-700
                          group-hover:scale-110
                        "
                      />

                      {/* Image Gradient */}

                      <div
                        className="
                          absolute
                          inset-0
                          bg-linear-to-t
                          from-[#063D29]/70
                          via-transparent
                          to-transparent
                          opacity-60
                        "
                      />

                      {/* View Badge */}

                      <div
                        className="
                          absolute
                          bottom-3
                          left-3
                          flex
                          translate-y-2
                          items-center
                          gap-1.5
                          rounded-full
                          border
                          border-white/20
                          bg-black/40
                          px-3
                          py-1.5
                          text-[9px]
                          font-bold
                          text-white
                          opacity-0
                          backdrop-blur-md
                          transition-all
                          duration-300
                          group-hover:translate-y-0
                          group-hover:opacity-100
                        "
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Details
                      </div>

                      {/* Award Icon */}

                      <div
                        className="
                          absolute
                          right-3
                          top-3
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-white/20
                          bg-white/90
                          text-[#B58A3B]
                          shadow-lg
                          backdrop-blur-md
                          transition-transform
                          duration-300
                          group-hover:rotate-6
                          group-hover:scale-110
                        "
                      >
                        <Award className="h-4 w-4" />
                      </div>
                    </div>

                    {/* CONTENT */}

                    <div className="flex flex-1 flex-col">

                      <div
                        className="
                          mb-2
                          inline-flex
                          w-fit
                          items-center
                          gap-1.5
                          rounded-full
                          border
                          border-emerald-100
                          bg-emerald-50
                          px-2.5
                          py-1
                          text-[8px]
                          font-black
                          uppercase
                          tracking-[0.1em]
                          text-emerald-700
                        "
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {achievement.category}
                      </div>

                      <h3
                        className="
                          font-serif
                          text-lg
                          font-black
                          leading-tight
                          text-[#153D2C]
                          transition-colors
                          duration-300
                          group-hover:text-emerald-700
                        "
                      >
                        {achievement.title}
                      </h3>

                      <p
                        className="
                          mt-2
                          text-xs
                          font-medium
                          leading-6
                          text-slate-500
                        "
                      >
                        {achievement.description}
                      </p>

                    </div>

                    {/* FOOTER */}

                    <div
                      className="
                        mt-5
                        flex
                        items-center
                        justify-between
                        border-t
                        border-emerald-50
                        pt-3
                      "
                    >

                      <span
                        className="
                          text-[9px]
                          font-black
                          uppercase
                          tracking-[0.1em]
                          text-slate-400
                          transition-colors
                          group-hover:text-emerald-600
                        "
                      >
                        Nagar Panchayat Goverdhan
                      </span>

                      <span
                        className="
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          rounded-full
                          bg-emerald-50
                          text-emerald-600
                          transition-all
                          duration-300
                          group-hover:bg-emerald-600
                          group-hover:text-white
                          group-hover:translate-x-1
                        "
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>

                    </div>

                  </m.div>

                </div>

              ))}

            </div>
          </div>

          {/* RIGHT ARROW */}

          <button
            onClick={nextSlide}
            aria-label="Next achievement"
            className="
              group
              absolute
              right-0
              top-1/2
              z-20
              flex
              h-11
              w-11
              translate-x-1
              -translate-y-1/2
              cursor-pointer
              items-center
              justify-center
              rounded-full
              border
              border-emerald-100
              bg-white/95
              text-emerald-700
              shadow-[0_10px_30px_rgba(15,81,50,0.12)]
              backdrop-blur-xl
              transition-all
              duration-300
              hover:scale-110
              hover:border-emerald-500
              hover:bg-emerald-600
              hover:text-white
              hover:shadow-[0_15px_35px_rgba(16,185,129,0.25)]
              md:translate-x-5
            "
          >
            <ChevronRight
              className="
                h-5
                w-5
                transition-transform
                group-hover:translate-x-0.5
              "
            />
          </button>

        </div>

        {/* =====================================================
            PAGINATION
        ====================================================== */}

        <div className="mt-8 flex items-center justify-center gap-2">

          {Array.from({
            length: maxIndex + 1,
          }).map((_, index) => (

            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to achievement slide ${index + 1}`}
              className={`
                h-2
                cursor-pointer
                rounded-full
                transition-all
                duration-500
                ${
                  currentIndex === index
                    ? "w-9 bg-gradient-to-r from-emerald-500 to-green-600 shadow-md"
                    : "w-2 bg-emerald-200 hover:w-4 hover:bg-emerald-400"
                }
              `}
            />

          ))}

        </div>

        {/* =====================================================
            BOTTOM LOCATION STRIP
        ====================================================== */}

        <div
          className="
            mx-auto
            mt-8
            flex
            max-w-2xl
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-emerald-100
            bg-white/70
            px-4
            py-2.5
            shadow-sm
            backdrop-blur-xl
          "
        >
          <Landmark
            className="
              h-3.5
              w-3.5
              text-[#B58A3B]
            "
          />

          <span
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-[0.1em]
              text-[#50655A]
            "
          >
            Nagar Panchayat Goverdhan • Mathura • Uttar Pradesh
          </span>
        </div>

      </div>

      {/* =====================================================
          LIGHTBOX MODAL
      ====================================================== */}

      {selectedImage && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-[#05261B]/85
            p-4
            backdrop-blur-md
          "
          onClick={() => setSelectedImage(null)}
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
            transition={{
              duration: 0.3,
            }}
            className="
              relative
              w-full
              max-w-4xl
              overflow-hidden
              rounded-[28px]
              border
              border-emerald-100
              bg-white
              shadow-[0_35px_100px_rgba(0,0,0,0.35)]
            "
            onClick={(event) => event.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-emerald-100
                bg-gradient-to-r
                from-[#F0FAF3]
                to-white
                p-4
                sm:p-5
              "
            >

              <div>

                <div
                  className="
                    mb-1
                    flex
                    items-center
                    gap-1.5
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-emerald-700
                  "
                >
                  <Award className="h-3 w-3" />
                  {selectedImage.category}
                </div>

                <h3
                  className="
                    font-serif
                    text-lg
                    font-black
                    text-[#153D2C]
                    sm:text-xl
                  "
                >
                  {selectedImage.title}
                </h3>

              </div>

              <button
                onClick={() => setSelectedImage(null)}
                aria-label="Close achievement"
                className="
                  flex
                  h-9
                  w-9
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-500
                  shadow-sm
                  transition-all
                  duration-300
                  hover:rotate-90
                  hover:border-red-200
                  hover:bg-red-50
                  hover:text-red-500
                "
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            {/* MODAL IMAGE */}

            <div
              className="
                flex
                max-h-[68vh]
                items-center
                justify-center
                bg-[#08291E]
                p-4
                sm:p-6
              "
            >
              <img
                src={selectedImage.image}
                alt={selectedImage.title}
                className="
                  max-h-[62vh]
                  w-auto
                  max-w-full
                  rounded-xl
                  object-contain
                  shadow-2xl
                "
              />
            </div>

            {/* MODAL FOOTER */}

            <div
              className="
                border-t
                border-emerald-100
                bg-white
                p-5
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  max-w-2xl
                  items-start
                  gap-3
                "
              >

                <div
                  className="
                    mt-0.5
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-emerald-50
                    text-emerald-600
                  "
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <p
                  className="
                    text-sm
                    font-medium
                    leading-6
                    text-slate-600
                  "
                >
                  {selectedImage.description}
                </p>

              </div>
            </div>

          </m.div>

        </m.div>
      )}

    </section>
  )
}
