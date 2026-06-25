/**
 * PDF Generation Service for Quotes and Invoices
 * Generates HTML-based PDFs matching the OrganizUS brand format exactly
 */

import { Quote, QuoteItem, Invoice, InvoiceItem } from "../drizzle/schema";

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toFixed(2).replace(".", ",") + "€";
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface CompanyInfo {
  name: string;
  owner: string;
  taxId: string;
  address: string;
  city: string;
  postalCode?: string;
  email: string;
  iban?: string;
  footerText?: string;
}

const LOGO_HTML = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 900; line-height: 1; letter-spacing: -0.5px;"><span style="color: #f97316;">organiz</span><span style="color: #22c55e;">US</span></div>`;

function buildQuoteHTML(
  quote: Quote,
  items: QuoteItem[],
  company: CompanyInfo,
  logoBase64?: string
): string {
  const logoSrc = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" alt="OrganizUS" style="height:45px;" />`
    : LOGO_HTML;

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; text-align:center; vertical-align:top; width:65px;">${parseFloat(item.quantity as string)}</td>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; vertical-align:top;">${(item.description || "").replace(/\n/g, "<br>")}</td>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; text-align:right; vertical-align:top; white-space:nowrap; width:90px;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; text-align:right; vertical-align:top; white-space:nowrap; width:90px;">${formatCurrency(item.baseAmount)}</td>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; text-align:center; vertical-align:top; width:55px;">${item.ivaRate}%</td>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; text-align:right; vertical-align:top; white-space:nowrap; width:90px; font-weight:600;">${formatCurrency(item.lineTotal)}</td>
    </tr>
  `).join("");

  const footerText = company.footerText ||
    `${company.name} · ${company.owner} · ${company.address} · ${company.postalCode || ""} ${company.city} · ${company.email}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #333; background: #fff; padding: 40px 45px; }
  @page { margin: 0; }
</style>
</head>
<body>
  <!-- Header: Logo + Doc type -->
  <table width="100%" style="margin-bottom:28px;">
    <tr>
      <td>${logoSrc}</td>
      <td style="text-align:right; font-size:38px; font-weight:300; color:#c8c8c8; font-family:Arial,sans-serif;">Presupuesto</td>
    </tr>
  </table>

  <!-- Sender + Date/Number -->
  <table width="100%" style="margin-bottom:24px;">
    <tr>
      <td style="vertical-align:top; width:50%;">
        <p style="line-height:1.7;">${company.owner}</p>
        <p style="line-height:1.7;">${company.taxId}</p>
        <p style="line-height:1.7;">${company.address}</p>
        <p style="line-height:1.7;">${company.postalCode ? company.postalCode + " " : ""}${company.city}</p>
      </td>
      <td style="text-align:right; vertical-align:top;">
        <p style="line-height:1.8;">Fecha: ${formatDate(quote.date)}</p>
        <p style="line-height:1.8;">Presupuesto Nº ${quote.number.replace(/^\d{4}/, "")}</p>
      </td>
    </tr>
  </table>

  <!-- Client (right-aligned) -->
  <table width="100%" style="margin-bottom:28px;">
    <tr>
      <td></td>
      <td style="text-align:right; vertical-align:top; width:50%;">
        <p style="line-height:1.7; font-weight:600;">${quote.clientName}</p>
        ${quote.clientTaxId ? `<p style="line-height:1.7;">CIF ${quote.clientTaxId}</p>` : ""}
        ${quote.clientExtra ? `<p style="line-height:1.7;">${quote.clientExtra.replace(/\n/g, "<br>")}</p>` : ""}
        ${quote.clientAddress ? `<p style="line-height:1.7;">${quote.clientAddress}</p>` : ""}
        ${quote.clientPostalCode || quote.clientCity ? `<p style="line-height:1.7;">${quote.clientPostalCode ? quote.clientPostalCode + ", " : ""}${quote.clientCity || ""}</p>` : ""}
        ${quote.clientCountry && quote.clientCountry !== "España" ? `<p style="line-height:1.7;">${quote.clientCountry}</p>` : ""}
      </td>
    </tr>
  </table>

  <!-- Items table -->
  <table width="100%" style="border-collapse:collapse; margin-bottom:16px;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:8px 10px; text-align:center; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db; width:65px;">Cantidad</th>
        <th style="padding:8px 10px; text-align:left; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db;">Descripción</th>
        <th style="padding:8px 10px; text-align:right; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db; width:90px;">Precio Unitario</th>
        <th style="padding:8px 10px; text-align:right; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db; width:90px;">Importe base</th>
        <th style="padding:8px 10px; text-align:center; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db; width:55px;">IVA</th>
        <th style="padding:8px 10px; text-align:right; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db; width:90px;">Total de línea</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Total -->
  <table width="100%" style="margin-bottom:20px;">
    <tr>
      <td></td>
      <td style="text-align:right; padding-right:0;">
        <table style="border-collapse:collapse; margin-left:auto;">
          <tr>
            <td style="padding:8px 20px; border:2px solid #333; font-size:13px; font-weight:700;">Total</td>
            <td style="padding:8px 20px; border:2px solid #333; border-left:none; font-size:13px; font-weight:700; text-align:right; white-space:nowrap;">${formatCurrency(quote.total)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  ${quote.validUntil ? `<p style="font-size:10px; color:#666; margin-bottom:8px;">Válido hasta: ${formatDate(quote.validUntil)}</p>` : ""}
  ${quote.notes ? `<p style="font-size:10px; color:#666; margin-top:12px; line-height:1.6;">${quote.notes.replace(/\n/g, "<br>")}</p>` : ""}

  <!-- Footer -->
  <div style="position:fixed; bottom:20px; left:45px; right:45px; text-align:center; font-size:9px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:8px;">
    ${footerText}
  </div>
</body>
</html>`;
}

function buildInvoiceHTML(
  invoice: Invoice,
  items: InvoiceItem[],
  company: CompanyInfo,
  logoBase64?: string
): string {
  const logoSrc = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" alt="OrganizUS" style="height:45px;" />`
    : LOGO_HTML;

  // Group IVA by rate for the totals section
  const ivaGroups: Record<number, number> = {};
  items.forEach((item) => {
    const rate = item.ivaRate;
    const amount = parseFloat(item.ivaAmount as string);
    ivaGroups[rate] = (ivaGroups[rate] || 0) + amount;
  });

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; vertical-align:top;">${(item.description || "").replace(/\n/g, "<br>")}</td>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; text-align:right; vertical-align:top; white-space:nowrap; width:110px;">${formatCurrency(item.baseAmount)}</td>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; text-align:center; vertical-align:top; width:60px;">${item.ivaRate}%</td>
      <td style="padding:12px 10px; border-bottom:1px solid #e5e7eb; text-align:right; vertical-align:top; white-space:nowrap; width:110px; font-weight:600;">${formatCurrency(item.lineTotal)}</td>
    </tr>
  `).join("");

  const ivaRows = Object.entries(ivaGroups).map(([rate, amount]) => `
    <tr>
      <td style="padding:6px 15px; border:1px solid #e5e7eb; border-top:none; font-weight:600; text-transform:uppercase; font-size:10px;">IVA (${rate}%)</td>
      <td style="padding:6px 15px; border:1px solid #e5e7eb; border-top:none; border-left:none; text-align:right; font-weight:600;">${formatCurrency(amount)}</td>
    </tr>
  `).join("");

  const paymentInfo = invoice.paymentMethod || (company.iban ? `TRANSFERENCIA BANCARIA A LA FINALIZACIÓN DEL SERVICIO.\nIBAN: ${company.iban}` : "");

  const footerText = company.footerText ||
    `${company.name} · ${company.owner} · ${company.address} · ${company.postalCode || ""} ${company.city} · ${company.email}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #333; background: #fff; padding: 40px 45px; }
  @page { margin: 0; }
</style>
</head>
<body>
  <!-- Header: Logo + Doc type -->
  <table width="100%" style="margin-bottom:28px;">
    <tr>
      <td>${logoSrc}</td>
      <td style="text-align:right; font-size:38px; font-weight:300; color:#c8c8c8; font-family:Arial,sans-serif;">Factura</td>
    </tr>
  </table>

  <!-- Sender + Date/Number -->
  <table width="100%" style="margin-bottom:24px;">
    <tr>
      <td style="vertical-align:top; width:50%;">
        <p style="line-height:1.7;">${company.owner}</p>
        <p style="line-height:1.7;">${company.taxId}</p>
        <p style="line-height:1.7;">${company.address}</p>
        <p style="line-height:1.7;">${company.postalCode ? company.postalCode + " " : ""}${company.city}</p>
      </td>
      <td style="text-align:right; vertical-align:top;">
        <p style="line-height:1.8;">Fecha: ${formatDate(invoice.date)}</p>
        <p style="line-height:1.8;">Factura ${invoice.number}</p>
      </td>
    </tr>
  </table>

  <!-- Client (right-aligned) -->
  <table width="100%" style="margin-bottom:28px;">
    <tr>
      <td></td>
      <td style="text-align:right; vertical-align:top; width:55%;">
        <p style="line-height:1.7; font-weight:600;">${invoice.clientName}</p>
        ${invoice.clientTaxId ? `<p style="line-height:1.7;">CIF ${invoice.clientTaxId}</p>` : ""}
        ${invoice.clientAddress ? `<p style="line-height:1.7;">${invoice.clientAddress}</p>` : ""}
        ${invoice.clientPostalCode || invoice.clientCity ? `<p style="line-height:1.7;">${invoice.clientPostalCode ? invoice.clientPostalCode + " " : ""}${invoice.clientCity || ""}</p>` : ""}
        ${invoice.clientCountry && invoice.clientCountry !== "España" ? `<p style="line-height:1.7;">${invoice.clientCountry}</p>` : ""}
      </td>
    </tr>
  </table>

  <!-- Items table (no Cantidad column for invoices, matching example) -->
  <table width="100%" style="border-collapse:collapse; margin-bottom:16px;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:8px 10px; text-align:left; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db;">Descripción</th>
        <th style="padding:8px 10px; text-align:right; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db; width:110px;">Importe base</th>
        <th style="padding:8px 10px; text-align:center; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db; width:60px;">IVA</th>
        <th style="padding:8px 10px; text-align:right; font-size:10px; font-weight:600; color:#555; border-bottom:2px solid #d1d5db; width:110px;">Total de línea</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <table width="100%" style="margin-bottom:24px;">
    <tr>
      <td></td>
      <td style="text-align:right;">
        <table style="border-collapse:collapse; margin-left:auto; min-width:260px;">
          <tr>
            <td style="padding:6px 15px; border:1px solid #e5e7eb; font-weight:600; text-transform:uppercase; font-size:10px;">SUBTOTAL (SIN IVA)</td>
            <td style="padding:6px 15px; border:1px solid #e5e7eb; border-left:none; text-align:right; font-weight:600;">${formatCurrency(invoice.subtotal)}</td>
          </tr>
          ${ivaRows}
          <tr style="background:#f3f4f6;">
            <td style="padding:7px 15px; border:1px solid #e5e7eb; border-top:none; font-weight:700; text-transform:uppercase; font-size:11px;">TOTAL EUROS</td>
            <td style="padding:7px 15px; border:1px solid #e5e7eb; border-top:none; border-left:none; text-align:right; font-weight:700; font-size:11px;">${formatCurrency(invoice.total)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  ${paymentInfo ? `
  <div style="border:1px solid #e5e7eb; padding:12px 14px; margin-top:20px; max-width:360px;">
    <div style="font-weight:700; font-size:10px; margin-bottom:6px; text-transform:uppercase;">FORMA DE PAGO</div>
    <div style="font-size:10px; line-height:1.6;">${paymentInfo.replace(/\n/g, "<br>")}</div>
  </div>` : ""}

  ${invoice.notes ? `<p style="font-size:10px; color:#666; margin-top:16px; line-height:1.6;">${invoice.notes.replace(/\n/g, "<br>")}</p>` : ""}

  <!-- Footer -->
  <div style="position:fixed; bottom:20px; left:45px; right:45px; text-align:center; font-size:9px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:8px;">
    ${footerText}
  </div>
</body>
</html>`;
}

export { buildQuoteHTML, buildInvoiceHTML };
