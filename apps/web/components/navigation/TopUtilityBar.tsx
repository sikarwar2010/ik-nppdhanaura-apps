"use client"

import React, { useState } from "react"
import {
  Accessibility,
  Mail,
  Phone,
  Minus,
  Plus,
} from "lucide-react"

export default function TopUtilityBar() {
  const [fontSize, setFontSize] = useState<
    "small" | "normal" | "large"
  >("normal")

  const changeFontSize = (
    size: "small" | "normal" | "large",
  ) => {
    setFontSize(size)

    if (size === "small") {
      document.documentElement.style.fontSize = "14px"
    } else if (size === "normal") {
      document.documentElement.style.fontSize = "16px"
    } else {
      document.documentElement.style.fontSize = "18px"
    }
  }

  const toggleScreenReader = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.")
      return
    }

    window.speechSynthesis.cancel()

    const speech = new SpeechSynthesisUtterance(
      "Screen Reader Access enabled. Welcome to Nagar Palika Parishad, Mainpuri, Uttar Pradesh.",
    )

    speech.rate = 1
    speech.pitch = 1

    window.speechSynthesis.speak(speech)
  }

  return (
    <div className="relative z-50 border-b border-white/10 bg-[#203746] text-slate-200">
      <div className="mx-auto flex min-h-[40px] max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        {/* =====================================================
            LEFT SIDE
        ====================================================== */}
        <div className="flex items-center">
          {/* Phone */}
          <a
            href="tel:+911212222040"
            className="group flex items-center gap-2 border-r border-white/10 pr-4 text-[10px] font-semibold text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B26A]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.07] transition-colors group-hover:bg-[#B88A3B]/20">
              <Phone className="h-3 w-3 text-[#D8B26A]" />
            </span>

            <span className="hidden sm:inline">
              +91 121 222 2040
            </span>
          </a>

          {/* Email */}
          <a
            href="mailto:official@mainpuri-npp.in"
            className="group hidden items-center gap-2 pl-4 text-[10px] font-semibold text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B26A] sm:flex"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.07] transition-colors group-hover:bg-[#B88A3B]/20">
              <Mail className="h-3 w-3 text-[#D8B26A]" />
            </span>

            <span>official@mainpuri-npp.in</span>
          </a>
        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}
        <div className="ml-auto flex items-center">
          {/* Skip */}
          <a
            href="#main-content"
            className="hidden border-r border-white/10 pr-4 text-[10px] font-bold text-slate-300 transition-colors hover:text-[#D8B26A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B26A] sm:inline-flex"
          >
            Skip to Main Content
          </a>

          {/* Screen Reader */}
          <button
            type="button"
            onClick={toggleScreenReader}
            title="Enable screen reader access"
            aria-label="Enable screen reader access"
            className="group flex cursor-pointer items-center gap-2 px-3 text-[10px] font-bold text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B26A]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.07] group-hover:bg-[#B88A3B]/20">
              <Accessibility className="h-3.5 w-3.5 text-[#D8B26A]" />
            </span>

            <span className="hidden md:inline">
              Screen Reader
            </span>
          </button>

          {/* Divider */}
          <div className="mx-1 hidden h-5 w-px bg-white/10 lg:block" />

          {/* Font controls */}
          <div
            className="hidden items-center gap-1 lg:flex"
            aria-label="Text size controls"
          >
            <button
              type="button"
              onClick={() => changeFontSize("small")}
              aria-label="Decrease text size"
              aria-pressed={fontSize === "small"}
              className={`flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md text-[9px] font-black transition-all ${
                fontSize === "small"
                  ? "bg-[#B88A3B] text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              A-
            </button>

            <button
              type="button"
              onClick={() => changeFontSize("normal")}
              aria-label="Normal text size"
              aria-pressed={fontSize === "normal"}
              className={`flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md text-[10px] font-black transition-all ${
                fontSize === "normal"
                  ? "bg-white/10 text-[#D8B26A]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              A
            </button>

            <button
              type="button"
              onClick={() => changeFontSize("large")}
              aria-label="Increase text size"
              aria-pressed={fontSize === "large"}
              className={`flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md text-[9px] font-black transition-all ${
                fontSize === "large"
                  ? "bg-[#B88A3B] text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Mobile accessibility */}
      <div className="border-t border-white/5 bg-[#1B303E] px-4 py-1.5 sm:hidden">
        <div className="flex items-center justify-between">
          <a
            href="#main-content"
            className="text-[9px] font-bold text-slate-400 hover:text-[#D8B26A]"
          >
            Skip to Main Content
          </a>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => changeFontSize("small")}
              className={`cursor-pointer text-[10px] font-black ${
                fontSize === "small"
                  ? "text-[#D8B26A]"
                  : "text-slate-400"
              }`}
            >
              A-
            </button>

            <button
              type="button"
              onClick={() => changeFontSize("normal")}
              className={`cursor-pointer text-[10px] font-black ${
                fontSize === "normal"
                  ? "text-[#D8B26A]"
                  : "text-slate-400"
              }`}
            >
              A
            </button>

            <button
              type="button"
              onClick={() => changeFontSize("large")}
              className={`cursor-pointer text-[10px] font-black ${
                fontSize === "large"
                  ? "text-[#D8B26A]"
                  : "text-slate-400"
              }`}
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
