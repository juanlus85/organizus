/**
 * Real PDF generation using Puppeteer + system Chromium
 * Converts HTML to binary PDF for quotes and invoices
 */

import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

let _browserPath: string | null = null;

function getChromiumPath(): string {
  if (_browserPath) return _browserPath;
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/local/bin/chromium",
  ];
  for (const p of candidates) {
    if (p && existsSync(p)) {
      _browserPath = p;
      return p;
    }
  }
  throw new Error("No Chromium/Chrome binary found on this system");
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const executablePath = getChromiumPath();

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
