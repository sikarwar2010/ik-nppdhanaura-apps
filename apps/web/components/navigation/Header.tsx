"use client"

import React, { useState } from "react"
import { Landmark, MapPin, Search, Sparkles, X } from "lucide-react"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <header className="relative z-40 overflow-hidden border-b border-[#D2E1CC] bg-[#EEF7EA]">
      {/* =========================================================
          PREMIUM LIGHT GREEN / GOVARDHAN BACKGROUND
      ========================================================== */}

      {/* Main soft green glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-107.5 w-107.5 rounded-full bg-[#8FBE82]/20 blur-[120px]"
      />

      {/* Warm sandstone/gold glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 h-107.5 w-107.5 rounded-full bg-[#DFA653]/12 blur-[120px]"
      />

      {/* Center white glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-75 w-150 -translate-x-1/2 rounded-full bg-white/55 blur-[100px]"
      />

      {/* =========================================================
          SUBTLE GRID
      ========================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #55784F 1px, transparent 1px), linear-gradient(#55784F 1px, transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />

      {/* =========================================================
          GOVARDHAN HILL INSPIRED SILHOUETTE
      ========================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 h-28 w-full opacity-[0.045]"
      >
        <svg
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="
              M0 160
              C90 150 140 138 220 145
              C300 152 350 125 425 130
              C505 136 555 108 630 115
              C710 122 755 92 835 100
              C915 108 965 78 1040 88
              C1120 98 1170 70 1240 82
              C1320 95 1365 72 1440 75
              L1440 180
              L0 180
              Z
            "
            fill="#55784F"
          />
        </svg>
      </div>

      {/* =========================================================
          DECORATIVE DOTS
      ========================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[13%] top-10 hidden h-2 w-2 rounded-full bg-[#D89A45]/45 md:block"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[17%] top-16 hidden h-1.5 w-1.5 rounded-full bg-[#6D9367]/45 md:block"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] bottom-14 hidden h-1.5 w-1.5 rounded-full bg-[#D89A45]/45 md:block"
      />

      {/* =========================================================
          MAIN HEADER
      ========================================================== */}

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:px-8 lg:py-7">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          {/* =====================================================
              BRAND IDENTITY
          ====================================================== */}

          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {/* =================================================
                GOVERNMENT EMBLEM
            ================================================== */}

            <div className="group relative shrink-0">
              {/* Gold outer ring */}

              <div className="absolute -inset-2 rounded-full border border-[#D39A48]/30 transition-all duration-500 group-hover:rotate-6 group-hover:border-[#D39A48]/65" />

              {/* Green heritage ring */}

              <div className="absolute -inset-3.5 rounded-full border border-dashed border-[#71936A]/20 transition-all duration-700 group-hover:-rotate-6 group-hover:border-[#71936A]/45" />

              {/* Emblem container */}

              <div className="relative flex h-18 w-18 items-center justify-center rounded-full border border-[#D3E0CE] bg-white/95 p-2 shadow-[0_10px_30px_rgba(73,96,66,0.10)] backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_16px_40px_rgba(73,96,66,0.17)] sm:h-20 sm:w-20">
                <img
                  src="/governmentlogo.png"
                  alt="Government Emblem"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* =================================================
                BRAND CONTENT
            ================================================== */}

            <div className="min-w-0">
              {/* Official Badges */}

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D39A48]/30 bg-[#FFF5E3] px-2.5 py-1 text-[9px] font-black tracking-[0.14em] text-[#916426] uppercase shadow-sm">
                  <Landmark className="h-3 w-3" />
                  Uttar Pradesh Government
                </span>

                <span className="hidden items-center gap-1.5 rounded-full border border-[#72956C]/25 bg-[#EDF5EA] px-2.5 py-1 text-[9px] font-bold tracking-wider text-[#557651] uppercase sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6D9367]" />
                  Official Portal
                </span>
              </div>

              {/* Hindi Name */}

              <h1 className="font-serif text-[21px] font-black leading-tight tracking-tight text-[#344638] sm:text-[24px] md:text-[28px]">
                नगर पंचायत, गोवर्धन, मथुरा
              </h1>

              {/* English Name */}

              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.13em] text-[#657466] sm:text-xs md:text-sm">
                Nagar Panchayat, Goverdhan, Mathura
              </p>

              {/* Location + Braj Identity */}

              <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[10px] font-medium text-[#788278] sm:text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#C58936]" />
                  Govardhan, Mathura, Uttar Pradesh
                </span>

                <span className="hidden text-[#C8D1C5] sm:inline">
                  •
                </span>

                <span className="inline-flex items-center gap-1.5 font-semibold italic text-[#63805E]">
                  <Sparkles className="h-3 w-3" />
                  ब्रज भूमि • गोवर्धन धाम
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              SEARCH INPUT
          ====================================================== */}

          <div className="relative z-10 flex w-full items-center lg:w-auto">
            <div className="group relative flex h-12 w-full items-center overflow-hidden rounded-2xl border border-[#D5DED0] bg-white/95 px-3 text-[#344638] shadow-[0_8px_30px_rgba(73,96,66,0.07)] backdrop-blur-xl transition-all duration-300 hover:border-[#D49A46]/60 focus-within:border-[#D49A46] focus-within:ring-2 focus-within:ring-[#D49A46]/30 focus-within:shadow-[0_16px_40px_rgba(73,96,66,0.14)] sm:w-[320px]">
              {/* Search Hover Background */}
              <span className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#FFF7E9] via-transparent to-[#F0F7ED] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10 flex w-full items-center gap-2.5">
                {/* Search Icon */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#E2A34C] to-[#C77A29] text-white shadow-md transition-all duration-300 group-hover:scale-105">
                  <Search className="h-4 w-4" />
                </span>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services & pages..."
                  className="w-full bg-transparent text-xs font-bold text-[#344638] placeholder-[#7E8B80] outline-none"
                />

                {/* Clear / Shortcut indicator */}
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-200 text-slate-600 transition-colors hover:bg-amber-100 hover:text-amber-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="hidden shrink-0 rounded-lg border border-[#DCE3D8] bg-[#F7FAF5] px-2 py-1 text-[9px] font-black text-[#89938A] shadow-sm transition-all duration-300 group-hover:border-[#D7C19B] group-hover:bg-[#FFF8EA] sm:inline-flex">
                    /
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          GOVARDHAN IDENTITY BAR
      ========================================================== */}

      <div className="relative border-t border-[#DDE5D9] bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:px-8">
          {/* Left Decorative Line */}

          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D49A46]" />

            <span className="h-px w-8 bg-linear-to-r from-[#D49A46] to-transparent" />
          </div>

          {/* Center Identity */}

          {/* <div className="mx-auto flex items-center gap-2 text-center">
            <span className="text-[9px] font-bold tracking-[0.16em] text-[#748073] uppercase sm:text-[10px]">
              Govardhan Dham
            </span>

            <span className="text-[#D19A4B]">•</span>

            <span className="text-[9px] font-bold tracking-[0.16em] text-[#64805F] uppercase sm:text-[10px]">
              Mathura
            </span>

            <span className="text-[#D19A4B]">•</span>

            <span className="text-[9px] font-bold tracking-[0.16em] text-[#748073] uppercase sm:text-[10px]">
              Braj Region
            </span>
          </div> */}

          {/* Right Decorative Line */}

          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-px w-8 bg-linear-to-l from-[#6F916A] to-transparent" />

            <span className="h-1.5 w-1.5 rounded-full bg-[#6F916A]" />
          </div>
        </div>
      </div>

      {/* =========================================================
          PREMIUM BOTTOM ACCENT
      ========================================================== */}

      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-0.5 w-full bg-linear-to-r from-[#D39A43] via-[#AFC18A] to-[#6F916A]"
      />
    </header>
  )
}
