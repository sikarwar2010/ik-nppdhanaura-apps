import { EMBLEM_DATA_URI } from "../common/emblem"
import { MUNICIPALITY } from "../common/municipality"
import { money as decimalMoney } from "../demands/money"
import { rupeesInWords } from "./rupees-in-words"

/**
 * Stored once when the receipt is issued (payment.receiptSnapshot) and never
 * rewritten. Fields marked optional were added later; receipts issued before
 * that print "—" for them.
 */
export type ReceiptSnapshot = {
  municipality: string
  receiptNumber: string
  receiptAt: string
  propertyId: string
  ownerName: string
  address: string
  ward: string
  assessmentYear: string
  demandReference: string
  propertyTax: string
  waterTax: string
  drainageTax: string
  previousDues: string
  rebate: string
  penalty: string
  interest: string
  /** Outstanding before this payment (all verified years). */
  totalPayable: string
  amountReceived: string
  paymentMode: string
  /** Outstanding after this payment. */
  remaining: string
  amountInWords: string
  cashierName: string
  counterCode: string
  allocationText: string
  fatherName?: string
  wardNumber?: string
  houseNo?: string
  locality?: string
  mobileMasked?: string
  paymentReference?: string
}

/** Reversal details are read from the payment row at print time, not stored in the snapshot. */
export type ReceiptReversal = { at: string; by: string; reason: string }

const MODE_LABEL: Record<string, string> = {
  CASH: "Cash / नकद",
  CHEQUE: "Cheque / चेक",
  DD: "Demand draft / डिमांड ड्राफ्ट",
  UPI_MANUAL: "UPI (manual) / यूपीआई",
  OTHER: "Bank transfer / बैंक अंतरण",
  ONLINE: "Online / ऑनलाइन",
}

function esc(value: unknown): string {
  const text = value === undefined || value === null || value === "" ? "—" : String(value)
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Indian grouping from the stored decimal string (no float round-trip). */
function inr(value: string | undefined): string {
  if (value === undefined || value === null || value === "") return "—"
  let fixed: string
  try {
    fixed = decimalMoney(value).toFixed(2)
  } catch {
    return esc(value)
  }
  const negative = fixed.startsWith("-")
  const [whole, paise] = fixed.replace("-", "").split(".") as [string, string]
  const last3 = whole.slice(-3)
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return `${negative ? "−" : ""}₹ ${rest ? `${rest},` : ""}${last3}.${paise}`
}

function row(labelEn: string, labelHi: string, value: string, cls = "") {
  return `<tr${cls ? ` class="${cls}"` : ""}><th>${labelEn}<span class="hi"> / ${labelHi}</span></th><td>${value}</td></tr>`
}

function copy(s: ReceiptSnapshot, title: string, reversal: ReceiptReversal | null): string {
  const mode = MODE_LABEL[s.paymentMode] ?? s.paymentMode
  const balance = decimalMoney(s.remaining)
  const status = reversal
    ? `<div class="status reversed">REVERSED / निरस्त — this receipt is not valid for payment. यह रसीद भुगतान हेतु मान्य नहीं है।</div>`
    : balance.gt(0)
      ? `<div class="status partial">PART PAYMENT — ${inr(s.remaining)} STILL DUE / आंशिक भुगतान — ${inr(s.remaining)} शेष बकाया</div>`
      : `<div class="status paid">FULLY PAID for the amounts shown / दर्शाई गई मांग का पूर्ण भुगतान</div>`

  return `<section class="copy${reversal ? " is-reversed" : ""}">
    ${reversal ? `<div class="stamp" aria-hidden="true">REVERSED<br/>निरस्त</div>` : ""}
    <header>
      <img class="emblem" src="${EMBLEM_DATA_URI}" alt="Uttar Pradesh Government emblem" />
      <div class="title">
        <p class="muni-hi">${esc(MUNICIPALITY.nameHi)}</p>
        <p class="muni-en">${esc(s.municipality || MUNICIPALITY.nameEn)}, ${esc(MUNICIPALITY.districtEn)}</p>
        <h1>संपत्ति कर रसीद <span>/ Property Tax Receipt</span></h1>
      </div>
      <p class="copy-title">${esc(title)}</p>
    </header>

    <table class="meta">
      <tr>
        <th>Receipt No. / रसीद सं.</th><td class="strong mono">${esc(s.receiptNumber)}</td>
        <th>Financial year / वित्तीय वर्ष</th><td class="strong">${esc(s.assessmentYear)}</td>
        <th>Date &amp; time / दिनांक</th><td>${esc(s.receiptAt)}</td>
      </tr>
    </table>

    <div class="cols">
      <table class="kv">
        <caption>Assessee details / करदाता विवरण</caption>
        ${row("PIN / Property ID", "संपत्ति क्रमांक", `<span class="mono">${esc(s.propertyId)}</span>`)}
        ${row("Owner / occupant", "स्वामी / अध्यासी", esc(s.ownerName))}
        ${row("Father / husband", "पिता / पति", esc(s.fatherName))}
        ${row("Ward", "वार्ड", esc(s.wardNumber ? `${s.wardNumber} — ${s.ward}` : s.ward))}
        ${row("House No.", "मकान नं.", esc(s.houseNo))}
        ${row("Locality / Mohalla", "मोहल्ला", esc(s.locality))}
        ${row("Mobile", "मोबाइल", esc(s.mobileMasked))}
        ${row("Demand ref.", "मांग संदर्भ", `<span class="mono">${esc(s.demandReference)}</span>`)}
      </table>
      <table class="kv amounts">
        <caption>Tax details / कर विवरण</caption>
        ${row("Previous dues (arrears)", "पूर्व बकाया", inr(s.previousDues))}
        ${row("Property tax", "संपत्ति कर", inr(s.propertyTax))}
        ${row("Water tax", "जल कर", inr(s.waterTax))}
        ${row("Drainage tax", "नाली कर", inr(s.drainageTax))}
        ${row("Penalty", "शास्ति", inr(s.penalty))}
        ${row("Interest", "ब्याज", inr(s.interest))}
        ${row("Rebate (less)", "छूट (घटाएँ)", inr(s.rebate))}
        ${row("Total payable before this payment", "इस भुगतान से पूर्व कुल देय", inr(s.totalPayable), "total")}
      </table>
    </div>

    <table class="pay">
      <caption>Payment summary / भुगतान सारांश</caption>
      <tr>
        <th>Outstanding before payment<br/><span class="hi">भुगतान से पूर्व बकाया</span></th>
        <th>Amount received<br/><span class="hi">प्राप्त राशि</span></th>
        <th>Balance due after payment<br/><span class="hi">भुगतान के बाद शेष</span></th>
        <th>Payment mode<br/><span class="hi">भुगतान का प्रकार</span></th>
      </tr>
      <tr class="figures">
        <td>${inr(s.totalPayable)}</td>
        <td class="received">${inr(s.amountReceived)}</td>
        <td class="${balance.gt(0) ? "due" : ""}">${inr(s.remaining)}</td>
        <td class="mode">${esc(mode)}${s.paymentReference ? `<br/><span class="mono small">Ref: ${esc(s.paymentReference)}</span>` : ""}</td>
      </tr>
    </table>
    ${status}
    <p class="words"><strong>Amount received in words / प्राप्त राशि शब्दों में:</strong> ${esc(s.amountInWords || rupeesInWords(s.amountReceived))}</p>
    <p class="alloc">Allocated to / आवंटन: ${esc(s.allocationText)}</p>
    ${
      reversal
        ? `<p class="reversal">Reversed on ${esc(reversal.at)} by ${esc(reversal.by)}. Reason: ${esc(reversal.reason)}</p>`
        : ""
    }
    <div class="foot">
      <div>
        <p>Received by / प्राप्तकर्ता: <strong>${esc(s.cashierName)}</strong></p>
        <p>Counter / काउंटर: ${esc(s.counterCode)}</p>
      </div>
      <div class="sign">
        <div class="line"></div>
        <p>Authorised signatory / अधिकृत हस्ताक्षर</p>
      </div>
    </div>
    <p class="note">This receipt is valid only for a payment recorded as successful. A cheque, draft or bank transfer is valid only after it is confirmed. A reprint is a copy of the original receipt and is not a new payment.</p>
  </section>`
}

export function renderReceiptHtml(
  snapshot: ReceiptSnapshot & { reversal?: ReceiptReversal | null }
): string {
  const reversal = snapshot.reversal ?? null
  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${esc(snapshot.receiptNumber)}</title>
  <style>
    @page { size: A4 portrait; margin: 7mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body {
      font-family: "Noto Sans Devanagari", "Nirmala UI", "Mangal", "Segoe UI", "Noto Sans", Arial, sans-serif;
      color: #111827;
      font-size: 9px;
      line-height: 1.3;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet { width: 196mm; margin: 0 auto; }
    .copy {
      position: relative;
      height: 137mm;
      overflow: hidden;
      padding: 2mm 3mm;
      border: 0.6pt solid #374151;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .cut {
      text-align: center;
      font-size: 7.5px;
      letter-spacing: 0.08em;
      color: #4b5563;
      margin: 0.8mm 0;
      border-top: 0.6pt dashed #6b7280;
      padding-top: 0.6mm;
    }
    header { display: grid; grid-template-columns: 14mm 1fr auto; align-items: center; gap: 3mm; border-bottom: 1.2pt solid #17324d; padding-bottom: 1mm; }
    .emblem { width: 13mm; height: 13mm; object-fit: contain; }
    .title p { margin: 0; }
    .muni-hi { font-size: 14px; font-weight: 700; color: #17324d; }
    .muni-en { font-size: 9px; color: #374151; }
    h1 { margin: 0.6mm 0 0; font-size: 11.5px; font-weight: 700; }
    h1 span { font-weight: 600; color: #374151; }
    .copy-title { margin: 0; font-size: 8.5px; font-weight: 700; border: 0.6pt solid #374151; padding: 0.8mm 2mm; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 0.5pt solid #9ca3af; padding: 0.55mm 1.4mm; vertical-align: top; text-align: left; }
    th { font-weight: 600; background: #f3f4f6; }
    caption { text-align: left; font-weight: 700; font-size: 8.8px; padding: 0.8mm 0 0.3mm; color: #17324d; }
    .meta { margin-top: 1.2mm; }
    .meta th { width: 15%; white-space: nowrap; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
    .kv th { width: 47%; }
    .amounts td { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .kv .total th, .kv .total td { font-weight: 700; background: #e5e7eb; }
    .hi { font-weight: 500; color: #4b5563; }
    .pay { margin-top: 0.8mm; }
    .pay th { text-align: center; font-size: 8.5px; width: 25%; }
    .pay .figures td { text-align: center; font-size: 11.5px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .pay .figures td.mode { font-size: 9.5px; font-weight: 600; }
    .pay .received { background: #f3f4f6; }
    .pay .due { text-decoration: underline; }
    .status { margin-top: 0.9mm; padding: 0.7mm 2mm; font-weight: 700; font-size: 9.5px; border: 0.8pt solid #111827; text-align: center; }
    .status.partial { border-style: dashed; }
    .status.reversed { border-width: 1.4pt; }
    .words, .alloc, .reversal { margin: 0.7mm 0 0; }
    .reversal { font-weight: 700; }
    .mono { font-family: "Consolas", "Courier New", monospace; }
    .small { font-size: 8px; font-weight: 500; }
    .strong { font-weight: 700; }
    .foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 8mm; margin-top: 1mm; }
    .foot p { margin: 0; }
    .sign { width: 52mm; text-align: center; }
    .line { border-bottom: 0.6pt solid #111827; height: 6.5mm; margin-bottom: 0.5mm; }
    .note { margin: 0.8mm 0 0; font-size: 7.2px; color: #374151; }
    .stamp {
      position: absolute; top: 46mm; left: 50%; transform: translateX(-50%) rotate(-14deg);
      font-size: 34px; font-weight: 800; letter-spacing: 0.12em; text-align: center; line-height: 1.1;
      color: rgba(17, 24, 39, 0.16); border: 3pt solid rgba(17, 24, 39, 0.16); padding: 2mm 6mm; pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${copy(snapshot, "OFFICE COPY / कार्यालय प्रति", reversal)}
    <div class="cut">✂ cut here / यहाँ से काटें</div>
    ${copy(snapshot, "CUSTOMER COPY / ग्राहक प्रति", reversal)}
  </div>
</body>
</html>`
}
