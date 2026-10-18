import { rupeesInWords } from "./rupees-in-words"

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
  totalPayable: string
  amountReceived: string
  paymentMode: string
  remaining: string
  amountInWords: string
  cashierName: string
  counterCode: string
  allocationText: string
}

const MODE_LABEL: Record<string, string> = {
  CASH: "Cash / नकद",
  CHEQUE: "Cheque / चेक",
  DD: "Demand draft / डिमांड ड्राफ्ट",
  UPI_MANUAL: "Manual UPI / मैनुअल यूपीआई",
  OTHER: "Bank transfer / बैंक अंतरण",
}

function esc(value: unknown): string {
  return String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function money(value: string): string {
  const parsed = Number(value)
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : esc(value)
}

function copy(snapshot: ReceiptSnapshot, title: string): string {
  const mode = MODE_LABEL[snapshot.paymentMode] ?? snapshot.paymentMode
  return `<section class="copy">
    <header>
      <p class="muni">${esc(snapshot.municipality)}</p>
      <h1>Property Tax Receipt / संपत्ति कर रसीद</h1>
      <p class="copy-title">${esc(title)}</p>
    </header>
    <table>
      <tr><th>Receipt No. / रसीद संख्या</th><td>${esc(snapshot.receiptNumber)}</td><th>Date / दिनांक</th><td>${esc(snapshot.receiptAt)}</td></tr>
      <tr><th>Property ID / संपत्ति क्रमांक</th><td>${esc(snapshot.propertyId)}</td><th>Assessment year / निर्धारण वर्ष</th><td>${esc(snapshot.assessmentYear)}</td></tr>
      <tr><th>Owner / स्वामी</th><td>${esc(snapshot.ownerName)}</td><th>Ward / वार्ड</th><td>${esc(snapshot.ward)}</td></tr>
      <tr><th>Address / पता</th><td colspan="3">${esc(snapshot.address)}</td></tr>
      <tr><th>Demand reference / मांग संदर्भ</th><td colspan="3">${esc(snapshot.demandReference)}</td></tr>
      <tr><th>Year allocation / वर्ष आवंटन</th><td colspan="3">${esc(snapshot.allocationText)}</td></tr>
    </table>
    <table class="amounts">
      <tr><th>Current-year property tax / संपत्ति कर</th><td class="r">₹ ${money(snapshot.propertyTax)}</td></tr>
      <tr><th>Current-year water tax / जल कर</th><td class="r">₹ ${money(snapshot.waterTax)}</td></tr>
      <tr><th>Current-year drainage tax / नाली कर</th><td class="r">₹ ${money(snapshot.drainageTax)}</td></tr>
      <tr><th>Previous dues / पूर्व बकाया</th><td class="r">₹ ${money(snapshot.previousDues)}</td></tr>
      <tr><th>Rebate / छूट</th><td class="r">₹ ${money(snapshot.rebate)}</td></tr>
      <tr><th>Penalty / शास्ति</th><td class="r">₹ ${money(snapshot.penalty)}</td></tr>
      <tr><th>Interest and other charges / ब्याज एवं अन्य</th><td class="r">₹ ${money(snapshot.interest)}</td></tr>
      <tr><th>Total payable / कुल देय</th><td class="r">₹ ${money(snapshot.totalPayable)}</td></tr>
      <tr class="strong"><th>Amount received / प्राप्त राशि</th><td class="r">₹ ${money(snapshot.amountReceived)}</td></tr>
      <tr><th>Payment method / भुगतान का प्रकार</th><td>${esc(mode)}</td></tr>
      <tr class="strong"><th>Remaining outstanding / शेष बकाया</th><td class="r">₹ ${money(snapshot.remaining)}</td></tr>
    </table>
    <p class="words">${esc(snapshot.amountInWords || rupeesInWords(snapshot.amountReceived))}</p>
    <div class="foot">
      <div>
        <p>Cashier / संग्रहकर्ता: ${esc(snapshot.cashierName)}</p>
        <p>Counter / काउंटर: ${esc(snapshot.counterCode || "—")}</p>
      </div>
      <div class="sign">
        <div class="line"></div>
        <p>Authorized signature / अधिकृत हस्ताक्षर</p>
      </div>
    </div>
    <p class="note">This receipt is valid only after the payment is recorded as successful. A cheque or bank transfer remains pending until it is confirmed. Reprinting does not create a new payment.</p>
  </section>`
}

export function renderReceiptHtml(snapshot: ReceiptSnapshot): string {
  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${esc(snapshot.receiptNumber)}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body {
      font-family: "Segoe UI", "Noto Sans Devanagari", "Noto Sans", Lato, Tahoma, sans-serif;
      color: #0f172a;
      font-size: 10px;
      line-height: 1.3;
    }
    .sheet {
      width: 194mm;
      min-height: 281mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      page-break-after: avoid;
      page-break-inside: avoid;
    }
    .copy { flex: 1 1 0; padding: 3mm 0; overflow: hidden; }
    .cut {
      border-top: 1px dashed #334155;
      text-align: center;
      font-size: 8px;
      letter-spacing: 0.08em;
      color: #475569;
      padding: 1mm 0;
    }
    header { text-align: center; margin-bottom: 2mm; }
    .muni { font-weight: 700; font-size: 12px; }
    h1 { font-size: 12px; font-weight: 650; margin: 0; }
    .copy-title { font-weight: 700; margin: 1mm 0 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5mm; }
    th, td { border: 1px solid #94a3b8; padding: 1.5px 4px; vertical-align: top; text-align: left; }
    th { font-weight: 600; width: 28%; background: #f8fafc; }
    .amounts th { width: 70%; }
    .r { text-align: right; font-variant-numeric: tabular-nums; }
    .strong th, .strong td { font-weight: 700; }
    .words { margin: 1.5mm 0; font-weight: 600; }
    .foot { display: flex; justify-content: space-between; gap: 8mm; margin-top: 2mm; }
    .sign { width: 48mm; text-align: center; }
    .line { border-bottom: 1px solid #0f172a; height: 8mm; margin-bottom: 1mm; }
    .note { margin-top: 1.5mm; font-size: 8px; color: #334155; }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${copy(snapshot, "OFFICE COPY / कार्यालय प्रति")}
    <div class="cut">— — — cut here / यहाँ से काटें — — —</div>
    ${copy(snapshot, "CUSTOMER COPY / ग्राहक प्रति")}
  </div>
</body>
</html>`
}
