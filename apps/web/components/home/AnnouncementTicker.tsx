"use client"

import { ArrowUpRight, Megaphone } from "lucide-react"

export default function AnnouncementTicker() {
  const notices = [
    {
      id: "property-tax",
      text: "संपत्ति कर सूचना: नगर पंचायत गोवर्धन के नागरिकों के लिए संपत्ति एवं गृह कर भुगतान की सुविधा ऑनलाइन उपलब्ध है। समय से अपना कर जमा करें।",
      link: "/propertytax",
    },
    {
      id: "water-supply",
      text: "जल आपूर्ति सूचना: गोवर्धन नगर क्षेत्र में जल आपूर्ति, जल बिल एवं जल संबंधी नागरिक सेवाओं के लिए ऑनलाइन सुविधा उपलब्ध है।",
      link: "/services",
    },
    {
      id: "public-grievance",
      text: "जन शिकायत सूचना: नागरिक सड़क, नाली, सफाई, स्ट्रीट लाइट, जल आपूर्ति एवं अन्य नागरिक समस्याओं की शिकायत ऑनलाइन दर्ज कर सकते हैं।",
      link: "/public-grievance",
    },
    {
      id: "citizen-services",
      text: "नागरिक सेवा सूचना: जन्म प्रमाण पत्र, मृत्यु प्रमाण पत्र, व्यापार लाइसेंस, भवन अनुमति एवं अन्य नगर पंचायत सेवाओं के लिए ऑनलाइन आवेदन करें।",
      link: "/services",
    },
    {
      id: "cleanliness",
      text: "स्वच्छता अभियान: स्वच्छ एवं सुंदर गोवर्धन के लिए नगर पंचायत द्वारा स्वच्छता, कचरा प्रबंधन एवं जन-जागरूकता गतिविधियां निरंतर संचालित की जा रही हैं।",
      link: "/about",
    },
    {
      id: "giriraj-dham",
      text: "गोवर्धन विशेष सूचना: गिरिराज जी की पवित्र नगरी में स्वच्छता, यातायात व्यवस्था एवं नागरिक सुविधाओं को बेहतर बनाने के लिए नगर पंचायत द्वारा निरंतर कार्य किए जा रहे हैं।",
      link: "/about",
    },
    {
      id: "development",
      text: "विकास सूचना: गोवर्धन क्षेत्र में सड़क, नाली, प्रकाश व्यवस्था, जलापूर्ति एवं अन्य आधारभूत नागरिक सुविधाओं के विकास कार्य निरंतर किए जा रहे हैं।",
      link: "#news-notices",
    },
    {
      id: "tender",
      text: "निविदा सूचना: नगर पंचायत गोवर्धन द्वारा विभिन्न विकास कार्यों एवं नागरिक सुविधाओं से संबंधित कार्यों हेतु निविदाएं समय-समय पर आमंत्रित की जाती हैं।",
      link: "#news-notices",
    },
  ]

  return (
    <section
      aria-label="Latest announcements"
      className="relative z-30 flex w-full flex-col overflow-hidden border-y border-emerald-900/20 bg-gradient-to-r from-[#123f35] via-[#145747] to-[#0d4b3c] text-white shadow-[0_8px_25px_rgba(16,80,60,0.12)] md:flex-row"
    >
      {/* =====================================================
          ANNOUNCEMENT TITLE
      ====================================================== */}

      <div className="relative z-20 flex shrink-0 items-center border-b border-white/10 bg-gradient-to-r from-[#0b3028] to-[#10473a] px-5 py-3 md:border-b-0 md:border-r md:px-7">
        <div className="flex items-center gap-3">

          {/* Icon */}

          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 shadow-inner">
            <span className="absolute inset-0 animate-ping rounded-xl bg-emerald-300/10" />

            <Megaphone className="relative h-4 w-4 text-emerald-300" />
          </div>

          {/* Text */}

          <div className="whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white sm:text-[11px]">
                Announcements
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(190,242,100,0.7)]" />
            </div>

            <p className="mt-0.5 text-[8px] font-semibold text-emerald-200 sm:text-[9px]">
              नवीनतम सूचनाएं • गोवर्धन
            </p>
          </div>
        </div>

        {/* Decorative edge */}

        <div className="absolute right-0 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-emerald-300/50 to-transparent md:block" />
      </div>

      {/* =====================================================
          TICKER CONTENT
      ====================================================== */}

      <div className="relative flex min-w-0 flex-1 items-center overflow-hidden bg-gradient-to-r from-[#145747] to-[#104d40]">

        {/* Left fade */}

        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#145747] to-transparent" />

        {/* Right fade */}

        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#104d40] to-transparent" />

        {/* Marquee */}

        <div
          className="announcement-marquee flex min-w-max items-center gap-12 whitespace-nowrap py-3.5 pl-8 pr-12"
          style={{
            animationDuration: "70s",
          }}
        >
          {/* =================================================
              FIRST LOOP
          ================================================== */}

          {notices.map((notice) => (
            <a
              key={notice.id}
              href={notice.link}
              className="group flex items-center gap-2.5 text-[10px] font-semibold text-emerald-50/85 transition-all duration-300 hover:text-white sm:text-[11px]"
            >
              {/* Bullet */}

              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300/30" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_7px_rgba(190,242,100,0.6)]" />
              </span>

              {/* Notice */}

              <span className="transition-colors duration-200 group-hover:text-lime-200">
                {notice.text}
              </span>

              {/* Arrow */}

              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] transition-all duration-200 group-hover:border-lime-300/40 group-hover:bg-lime-300/10">
                <ArrowUpRight className="h-3 w-3 text-emerald-300 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime-200" />
              </span>
            </a>
          ))}

          {/* =================================================
              SECOND LOOP
          ================================================== */}

          {notices.map((notice) => (
            <a
              key={`${notice.id}-duplicate`}
              href={notice.link}
              aria-hidden="true"
              tabIndex={-1}
              className="group flex items-center gap-2.5 text-[10px] font-semibold text-emerald-50/85 transition-colors hover:text-white sm:text-[11px]"
            >
              {/* Bullet */}

              <span className="relative flex h-2 w-2 shrink-0">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-300" />
              </span>

              {/* Notice */}

              <span className="transition-colors group-hover:text-lime-200">
                {notice.text}
              </span>

              {/* Arrow */}

              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] transition-all group-hover:border-lime-300/40 group-hover:bg-lime-300/10">
                <ArrowUpRight className="h-3 w-3 text-emerald-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* =====================================================
          MARQUEE ANIMATION
      ====================================================== */}

      <style jsx>{`
        .announcement-marquee {
          animation: announcement-scroll linear infinite;
          will-change: transform;
        }

        .announcement-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes announcement-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .announcement-marquee {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
