import { money, moneyString } from "../demands/money"

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
]

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
]

function twoDigits(value: number): string {
  if (value < 20) return ONES[value] ?? ""
  const ten = Math.floor(value / 10)
  const one = value % 10
  return [TENS[ten], one ? ONES[one] : ""].filter(Boolean).join(" ")
}

function threeDigits(value: number): string {
  const hundred = Math.floor(value / 100)
  const rest = value % 100
  return [
    hundred ? `${ONES[hundred]} Hundred` : "",
    rest ? twoDigits(rest) : "",
  ]
    .filter(Boolean)
    .join(" ")
}

function indianGroups(value: number): string {
  if (value === 0) return "Zero"
  const crore = Math.floor(value / 10000000)
  const lakh = Math.floor((value % 10000000) / 100000)
  const thousand = Math.floor((value % 100000) / 1000)
  const rest = value % 1000
  return [
    crore ? `${indianGroups(crore)} Crore` : "",
    lakh ? `${twoDigits(lakh)} Lakh` : "",
    thousand ? `${twoDigits(thousand)} Thousand` : "",
    rest ? threeDigits(rest) : "",
  ]
    .filter(Boolean)
    .join(" ")
}

/** Indian rupees in words. Paise are included only when they are not zero. */
export function rupeesInWords(amount: string): string {
  const value = money(amount)
  const rupees = value.trunc().toNumber()
  const paise = value.minus(value.trunc()).mul(100).toNumber()
  const rupeeWords = indianGroups(rupees)
  if (paise === 0) return `Rupees ${rupeeWords} Only`
  return `Rupees ${rupeeWords} and ${twoDigits(paise)} Paise Only`
}

export function rupeesLabel(amount: string): string {
  return `₹ ${moneyString(amount)}`
}
