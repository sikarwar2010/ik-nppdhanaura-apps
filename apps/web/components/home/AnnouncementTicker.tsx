"use client"

import { ArrowUpRight, Megaphone } from "lucide-react"

export default function AnnouncementTicker() {
  const notices = [
    {
      id: "property-tax",
      text: "संपत्ति कर सूचना: नगर पालिका परिषद, मैनपुरी द्वारा संपत्ति कर भुगतान की सुविधा ऑनलाइन उपलब्ध है। नागरिक समय से अपना कर जमा करें।",
      link: "/propertytax",
    },
    {
      id: "water-tax",
      text: "जल कर सूचना: मैनपुरी नगर क्षेत्र के नागरिकों के लिए जल कर भुगतान एवं जल संबंधी सेवाएं ऑनलाइन उपलब्ध हैं।",
      link: "/services",
    },
    {
      id: "public-grievance",
      text: "जन शिकायत सूचना: नागरिक अपनी शिकायतें ऑनलाइन दर्ज कर सकते हैं तथा शिकायत की स्थिति की जानकारी प्राप्त कर सकते हैं।",
      link: "/public-grievance",
    },
    {
      id: "municipal-services",
      text: "नागरिक सेवा सूचना: जन्म प्रमाण पत्र, मृत्यु प्रमाण पत्र, व्यापार लाइसेंस एवं अन्य नगर पालिका सेवाओं के लिए ऑनलाइन आवेदन करें।",
      link: "/services",
    },
    {
      id: "cleanliness",
      text: "स्वच्छता सूचना: नगर पालिका परिषद, मैनपुरी द्वारा स्वच्छ एवं स्वस्थ मैनपुरी के लिए नागरिकों से सहयोग की अपील की जाती है।",
      link: "/about",
    },
    {
      id: "development",
      text: "विकास सूचना: नगर क्षेत्र में सड़क, प्रकाश व्यवस्था, जलापूर्ति एवं अन्य नागरिक सुविधाओं के विकास कार्य निरंतर किए जा रहे हैं।",
      link: "#news-notices",
    },
    {
      id: "tender",
      text: "निविदा सूचना: नगर पालिका परिषद, मैनपुरी द्वारा विभिन्न विकास एवं नागरिक सुविधाओं से संबंधित कार्यों हेतु निविदाएं आमंत्रित की जाती हैं।",
      link: "#news-notices",
    },
    {
      id: "schemes",
      text: "योजना सूचना: नागरिकों के हित में संचालित विभिन्न सरकारी एवं नगर पालिका योजनाओं की जानकारी आधिकारिक पोर्टल पर उपलब्ध है।",
      link: "/schemes",
    },
  ]

  return (
    <section
      aria-label="Latest announcements"
      className="relative z-30 flex w-full flex-col overflow-hidden border-y border-[#A96F22]/40 bg-[#123247] text-white shadow-[0_5px_20px_rgba(18,50,71,0.12)] md:flex-row"
    >
      {/* =====================================================
          ANNOUNCEMENT TITLE
      ====================================================== */}

      <div className="relative z-20 flex shrink-0 items-center border-b border-white/10 bg-[#0B2637] px-5 py-3 md:border-b-0 md:border-r md:px-7">
        <div className="flex items-center gap-3">
          {/* Icon */}

          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8B26A]/20 bg-[#C69A45]/10">
            <span className="absolute inset-0 animate-ping rounded-lg bg-[#C69A45]/10" />

            <Megaphone className="relative h-4 w-4 text-[#D8B26A]" />
          </div>

          {/* Text */}

          <div className="whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white sm:text-[11px]">
                Announcements
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-[#C69A45]" />
            </div>

            <p className="mt-0.5 text-[8px] font-semibold text-[#D8B26A] sm:text-[9px]">
              नवीनतम सूचनाएं
            </p>
          </div>
        </div>

        {/* Decorative edge */}

        <div className="absolute right-0 top-0 hidden h-full w-px bg-linear-to-b from-transparent via-[#C69A45]/50 to-transparent md:block" />
      </div>

      {/* =====================================================
          TICKER CONTENT
      ====================================================== */}

      <div className="relative flex min-w-0 flex-1 items-center overflow-hidden bg-[#123247]">
        {/* Left fade */}

        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-linear-to-r from-[#123247] to-transparent" />

        {/* Right fade */}

        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-linear-to-l from-[#123247] to-transparent" />

        {/* Marquee */}

        <div
          className="announcement-marquee flex min-w-max items-center gap-12 whitespace-nowrap py-3.5 pl-8 pr-12"
          style={{
            animationDuration: "70s",
          }}
        >
          {/* First Loop */}

          {notices.map((notice) => (
            <a
              key={notice.id}
              href={notice.link}
              className="group flex items-center gap-2.5 text-[10px] font-semibold text-slate-200 transition-colors hover:text-white sm:text-[11px]"
            >
              {/* Bullet */}

              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C69A45]/40" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D8B26A]" />
              </span>

              {/* Notice */}

              <span className="transition-colors group-hover:text-[#F0D49B]">
                {notice.text}
              </span>

              {/* Arrow */}

              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/4 transition-all duration-200 group-hover:border-[#C69A45]/40 group-hover:bg-[#C69A45]/10">
                <ArrowUpRight className="h-3 w-3 text-[#D8B26A] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}

          {/* Second Loop - seamless */}

          {notices.map((notice) => (
            <a
              key={`${notice.id}-duplicate`}
              href={notice.link}
              aria-hidden="true"
              tabIndex={-1}
              className="group flex items-center gap-2.5 text-[10px] font-semibold text-slate-200 transition-colors hover:text-white sm:text-[11px]"
            >
              {/* Bullet */}

              <span className="relative flex h-2 w-2 shrink-0">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D8B26A]" />
              </span>

              {/* Notice */}

              <span className="transition-colors group-hover:text-[#F0D49B]">
                {notice.text}
              </span>

              {/* Arrow */}

              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/4">
                <ArrowUpRight className="h-3 w-3 text-[#D8B26A]" />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* =====================================================
          INLINE STYLE FOR MARQUEE
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
