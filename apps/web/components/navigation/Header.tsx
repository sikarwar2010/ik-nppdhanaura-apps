"use client"

import React, { useState, useRef, useEffect } from "react"
import { MapPin, Search, X } from "lucide-react"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <header className="relative z-40 border-b border-[#D9D3C8] bg-[#F7F5F0]">
      {/* =========================================================
          MAIN HEADER
      ========================================================== */}
      <div className="relative overflow-hidden">
        {/* Subtle architectural grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #243746 1px, transparent 1px), linear-gradient(#243746 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-7 px-4 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-6">
          {/* =====================================================
              BRAND IDENTITY
          ====================================================== */}
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {/* Government Emblem */}
            <div className="group relative shrink-0">
              {/* Gold outer ring */}
              <div className="absolute -inset-1 rounded-full border border-[#B88A3B]/30 transition-all duration-300 group-hover:border-[#B88A3B]/60" />

              <div className="relative flex h-18 w-18 items-center justify-center rounded-full border border-[#D9D3C8] bg-white p-2 shadow-[0_8px_24px_rgba(36,55,70,0.09)] transition-transform duration-300 group-hover:scale-[1.03] sm:h-20 sm:w-20">
                <img
                  src="/governmentlogo.png"
                  alt="Government Emblem of India"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Brand Text */}
            <div className="min-w-0">
              {/* Government Badge */}
              <div className="mb-1.5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#B88A3B]/25 bg-[#B88A3B]/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#96702F]">
                  Uttar Pradesh Government
                </span>
              </div>

              {/* Hindi Name */}
              <h1 className="font-serif text-[20px] font-black leading-tight tracking-tight text-[#1E3342] sm:text-[23px] md:text-[26px]">
                नगर पालिका परिषद, मैनपुरी
              </h1>

              {/* English Name */}
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#526571] sm:text-xs md:text-sm">
                Nagar Palika Parishad, Mainpuri
              </p>

              {/* Location / Tagline */}
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-[#7A8790] sm:text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#B88A3B]" />
                  Mainpuri, Uttar Pradesh, India
                </span>

                <span className="hidden text-[#D0CBC2] sm:inline">
                  •
                </span>

                <span className="font-semibold italic text-[#96702F]">
                  स्वच्छ मैनपुरी, सुंदर मैनपुरी
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              SEARCH INPUT
          ====================================================== */}
          <div className="flex w-full items-center gap-3 lg:w-auto">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="group relative flex h-11 w-full items-center rounded-xl border border-[#D9D3C8] bg-white px-3 shadow-[0_4px_16px_rgba(36,55,70,0.04)] transition-all duration-200 focus-within:border-[#B88A3B] focus-within:ring-2 focus-within:ring-[#B88A3B]/20 hover:border-[#B88A3B]/50 sm:w-70 lg:w-75"
            >
              {/* Search Icon Badge */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7F5F0] transition-colors group-focus-within:bg-[#B88A3B]/10 group-hover:bg-[#B88A3B]/10">
                <Search className="h-3.5 w-3.5 text-[#B88A3B]" />
              </div>

              {/* Real Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, pages..."
                aria-label="Search services and pages"
                className="h-full w-full bg-transparent px-2.5 text-xs font-semibold text-[#243746] placeholder-[#89949B] outline-none"
              />

              {/* Clear button if text exists, otherwise shortcut indicator */}
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    inputRef.current?.focus()
                  }}
                  aria-label="Clear search query"
                  className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#89949B] hover:bg-[#F7F5F0] hover:text-[#243746]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="hidden shrink-0 rounded-md border border-[#E4DFD5] bg-[#F7F5F0] px-1.5 py-0.5 text-[9px] font-bold text-[#89949B] sm:inline">
                  /
                </span>
              )}
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
