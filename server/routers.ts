import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAllUsers, updateUserRole, deleteUser,
  getSiteContent, setSiteContentBatch,
  getServices, getServiceById, createService, updateService, deleteService,
  getClients, getClientById, upsertClient, updateClient,
  getQuotes, getQuoteById, getQuoteItems, createQuote, updateQuote, deleteQuote, getNextQuoteNumber,
  getInvoices, getInvoiceById, getInvoiceItems, createInvoice, updateInvoice, deleteInvoice, getNextInvoiceNumber,
  getLinkPages, getLinkPageBySlug, getLinkPageById, createLinkPage, updateLinkPage, deleteLinkPage,
  getContactMessages, createContactMessage, markContactMessageRead, deleteContactMessage,
  getWebServices, createWebService, updateWebService, deleteWebService,
} from "./db";
import { sendContactNotification } from "./emailService";
import { buildQuoteHTML, buildInvoiceHTML } from "./pdfService";
import { htmlToPdf } from "./puppeteerPdf";
import { storagePut, storageGet } from "./storage";
import { readFileSync } from "fs";
import { join } from "path";

// ─── Admin middleware ─────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Item schema ──────────────────────────────────────────────────────────────
const documentItemSchema = z.object({
  serviceId: z.number().optional(),
  quantity: z.number().min(0),
  description: z.string().min(1),
  unitPrice: z.number().min(0),
  ivaRate: z.number().int().min(0).max(100),
});

// ─── Helper: compute totals ───────────────────────────────────────────────────
function computeItemTotals(item: { quantity: number; unitPrice: number; ivaRate: number }) {
  const baseAmount = parseFloat((item.quantity * item.unitPrice).toFixed(2));
  const ivaAmount = parseFloat((baseAmount * item.ivaRate / 100).toFixed(2));
  const lineTotal = parseFloat((baseAmount + ivaAmount).toFixed(2));
  return { baseAmount, ivaAmount, lineTotal };
}

function computeDocumentTotals(items: Array<{ baseAmount: number; ivaAmount: number; lineTotal: number }>) {
  const subtotal = parseFloat(items.reduce((s, i) => s + i.baseAmount, 0).toFixed(2));
  const totalIva = parseFloat(items.reduce((s, i) => s + i.ivaAmount, 0).toFixed(2));
  const total = parseFloat(items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
  return { subtotal, totalIva, total };
}

// ─── Helper: get logo as base64 ───────────────────────────────────────────────
async function getLogoBase64(): Promise<string | undefined> {
  try {
    // Try to read from local static assets
    const logoPath = join(process.cwd(), "client", "public", "logo.png");
    const data = readFileSync(logoPath);
    return data.toString("base64");
  } catch {
    return undefined;
  }
}

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ─────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Public Site Content ──────────────────────────────────────────────────
  public: router({
    getSiteContent: publicProcedure.query(async () => {
      return getSiteContent();
    }),

    getPublicServices: publicProcedure.query(async () => {
      return getWebServices(true);
    }),

    getLinkPage: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const page = await getLinkPageBySlug(input.slug);
        if (!page) throw new TRPCError({ code: "NOT_FOUND" });
        return page;
      }),

    submitContact: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().optional(),
        message: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const id = await createContactMessage(input);
        // Send email notification using SMTP config from site content
        const content = await getSiteContent();
        const adminEmail = content["admin_email"] || content["contact_email"] || "hi@organizus.es";
        const smtpHost = content["smtp_host"];
        const smtpPort = content["smtp_port"] ? parseInt(content["smtp_port"]) : 587;
        const smtpUser = content["smtp_user"];
        const smtpPass = content["smtp_pass"];
        const smtpFrom = content["smtp_from"];
        const smtpConfig = smtpHost && smtpUser && smtpPass
          ? { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass, from: smtpFrom }
          : undefined;
        await sendContactNotification({ ...input, adminEmail, smtpConfig });
        return { success: true, id };
      }),
  }),

  // ─── Admin: Content Management ────────────────────────────────────────────
  admin: router({
    updateSiteContent: adminProcedure
      .input(z.record(z.string(), z.string()))
      .mutation(async ({ input }) => {
        await setSiteContentBatch(input);
        return { success: true };
      }),

    // Users
    getUsers: adminProcedure.query(async () => getAllUsers()),
    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    deleteUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteUser(input.userId);
        return { success: true };
      }),

    // Contact messages
    getContactMessages: adminProcedure.query(async () => getContactMessages()),
    markMessageRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markContactMessageRead(input.id);
        return { success: true };
      }),
    deleteMessage: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContactMessage(input.id);
        return { success: true };
      }),
  }),

  // ─── Services Catalog ─────────────────────────────────────────────────────
  services: router({
    list: adminProcedure.query(async () => getServices()),
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getServiceById(input.id)),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().min(0),
        ivaRate: z.number().int().min(0).max(100),
        active: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await createService({
          ...input,
          price: input.price.toString(),
        });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        ivaRate: z.number().int().min(0).max(100).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, price, ...rest } = input;
        await updateService(id, {
          ...rest,
          ...(price !== undefined ? { price: price.toString() } : {}),
        });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteService(input.id);
        return { success: true };
      }),
  }),

  // ─── Web Public Services (vitrina pública) ─────────────────────────────────
  webServices: router({
    list: adminProcedure.query(async () => getWebServices()),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().int().default(0),
        active: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await createWebService(input);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().int().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        await updateWebService(id, rest);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteWebService(input.id);
        return { success: true };
      }),
  }),

  // ─── Clients ──────────────────────────────────────────────────────────────
  clients: router({
    list: adminProcedure.query(async () => getClients()),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        taxId: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await upsertClient(input);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        taxId: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        await updateClient(id, rest);
        return { success: true };
      }),
  }),

  // ─── Quotes ───────────────────────────────────────────────────────────────
  quotes: router({
    list: adminProcedure.query(async () => getQuotes()),
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const quote = await getQuoteById(input.id);
        if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
        const items = await getQuoteItems(input.id);
        return { quote, items };
      }),
    getNextNumber: adminProcedure
      .input(z.object({ year: z.number().int() }))
      .query(async ({ input }) => getNextQuoteNumber(input.year)),
    create: adminProcedure
      .input(z.object({
        clientName: z.string().min(1),
        clientTaxId: z.string().optional(),
        clientAddress: z.string().optional(),
        clientCity: z.string().optional(),
        clientPostalCode: z.string().optional(),
        clientCountry: z.string().optional(),
        clientEmail: z.string().optional(),
        clientExtra: z.string().optional(),
        date: z.string(),
        validUntil: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(documentItemSchema),
      }))
      .mutation(async ({ input }) => {
        const { items: rawItems, date, validUntil, ...quoteData } = input;
        const year = new Date(date).getFullYear();
        const { number, sequence } = await getNextQuoteNumber(year);

        const computedItems = rawItems.map((item) => {
          const { baseAmount, ivaAmount, lineTotal } = computeItemTotals(item);
          return {
            quoteId: 0, // placeholder, createQuote sets the real id
            ...item,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            baseAmount: baseAmount.toString(),
            ivaAmount: ivaAmount.toString(),
            lineTotal: lineTotal.toString(),
          };
        });

        const totals = computeDocumentTotals(
          computedItems.map((i) => ({
            baseAmount: parseFloat(i.baseAmount),
            ivaAmount: parseFloat(i.ivaAmount),
            lineTotal: parseFloat(i.lineTotal),
          }))
        );

        const id = await createQuote(
          {
            ...quoteData,
            number,
            year,
            sequence,
            date: new Date(date),
            validUntil: validUntil ? new Date(validUntil) : undefined,
            subtotal: totals.subtotal.toString(),
            totalIva: totals.totalIva.toString(),
            total: totals.total.toString(),
          },
          computedItems
        );
        return { id, number };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        clientName: z.string().min(1).optional(),
        clientTaxId: z.string().optional(),
        clientAddress: z.string().optional(),
        clientCity: z.string().optional(),
        clientPostalCode: z.string().optional(),
        clientCountry: z.string().optional(),
        clientEmail: z.string().optional(),
        clientExtra: z.string().optional(),
        date: z.string().optional(),
        validUntil: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["draft", "sent", "accepted", "rejected", "invoiced"]).optional(),
        items: z.array(documentItemSchema).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, items: rawItems, date, validUntil, ...rest } = input;
        let computedItems: any[] | undefined;
        let totals: any = {};

        if (rawItems !== undefined) {
          computedItems = rawItems.map((item) => {
            const { baseAmount, ivaAmount, lineTotal } = computeItemTotals(item);
            return {
              ...item,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              baseAmount: baseAmount.toString(),
              ivaAmount: ivaAmount.toString(),
              lineTotal: lineTotal.toString(),
            };
          });
          const t = computeDocumentTotals(
            computedItems.map((i) => ({
              baseAmount: parseFloat(i.baseAmount),
              ivaAmount: parseFloat(i.ivaAmount),
              lineTotal: parseFloat(i.lineTotal),
            }))
          );
          totals = {
            subtotal: t.subtotal.toString(),
            totalIva: t.totalIva.toString(),
            total: t.total.toString(),
          };
        }

        await updateQuote(
          id,
          {
            ...rest,
            ...totals,
            ...(date ? { date: new Date(date) } : {}),
            ...(validUntil ? { validUntil: new Date(validUntil) } : {}),
          },
          computedItems
        );
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteQuote(input.id);
        return { success: true };
      }),
    generatePdf: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const quote = await getQuoteById(input.id);
        if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
        const items = await getQuoteItems(input.id);
        const content = await getSiteContent();

        const company = {
          name: content["company_name"] || "OrganizUS",
          owner: content["company_owner"] || "Ana Pérez Peramo",
          taxId: content["company_taxid"] || "77807125-B",
          address: content["company_address"] || "Calle Adriano 6",
          postalCode: content["company_postal_code"] || "41001",
          city: content["company_city"] || "Sevilla",
          email: content["contact_email"] || "hi@organizus.es",
          iban: content["company_iban"] || "",
          footerText: content["invoice_footer_text"] || "",
        };

        // Try to load logo from file system
        let logoBase64: string | undefined;
        try {
          const { readFileSync } = await import("fs");
          const { join } = await import("path");
          const logoPath = join(process.cwd(), "server", "assets", "logo.png");
          logoBase64 = readFileSync(logoPath).toString("base64");
        } catch { /* use text logo */ }

        const html = buildQuoteHTML(quote, items, company, logoBase64);

        // Generate real PDF binary using Puppeteer
        let pdfBuffer: Buffer;
        try {
          pdfBuffer = await htmlToPdf(html);
        } catch (err) {
          console.error("[PDF] Puppeteer failed, storing HTML fallback:", err);
          // Fallback: store HTML so user can print from browser
          const htmlBuffer = Buffer.from(html, "utf-8");
          const { url: htmlUrl } = await storagePut(`quotes/quote-${quote.number}.html`, htmlBuffer, "text/html");
          await updateQuote(input.id, { pdfUrl: htmlUrl, pdfKey: `quotes/quote-${quote.number}.html` });
          return { url: htmlUrl, key: `quotes/quote-${quote.number}.html`, html, isPdfFallback: true };
        }

        const key = `quotes/quote-${quote.number}.pdf`;
        const { url } = await storagePut(key, pdfBuffer, "application/pdf");

        await updateQuote(input.id, { pdfUrl: url, pdfKey: key });
        return { url, key, html, isPdfFallback: false };
      }),
  }),

  // ─── Invoices ─────────────────────────────────────────────────────────────
  invoices: router({
    list: adminProcedure.query(async () => getInvoices()),
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const invoice = await getInvoiceById(input.id);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
        const items = await getInvoiceItems(input.id);
        return { invoice, items };
      }),
    getNextNumber: adminProcedure
      .input(z.object({ year: z.number().int() }))
      .query(async ({ input }) => getNextInvoiceNumber(input.year)),
    createFromQuote: adminProcedure
      .input(z.object({ quoteId: z.number() }))
      .mutation(async ({ input }) => {
        const quote = await getQuoteById(input.quoteId);
        if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
        const quoteItemsList = await getQuoteItems(input.quoteId);
        const year = new Date().getFullYear();
        const { number, sequence } = await getNextInvoiceNumber(year);

        const invoiceItemsList = quoteItemsList.map((qi) => ({
          invoiceId: 0, // will be replaced by createInvoice
          serviceId: qi.serviceId ?? undefined,
          quantity: qi.quantity,
          description: qi.description,
          unitPrice: qi.unitPrice,
          ivaRate: qi.ivaRate,
          baseAmount: qi.baseAmount,
          ivaAmount: qi.ivaAmount,
          lineTotal: qi.lineTotal,
          sortOrder: qi.sortOrder,
        }));

        const id = await createInvoice(
          {
            number,
            year,
            sequence,
            quoteId: input.quoteId,
            clientName: quote.clientName,
            clientTaxId: quote.clientTaxId ?? undefined,
            clientAddress: quote.clientAddress ?? undefined,
            clientCity: quote.clientCity ?? undefined,
            clientPostalCode: quote.clientPostalCode ?? undefined,
            clientCountry: quote.clientCountry ?? undefined,
            clientEmail: quote.clientEmail ?? undefined,
            date: new Date(),
            subtotal: quote.subtotal,
            totalIva: quote.totalIva,
            total: quote.total,
          },
          invoiceItemsList
        );

        // Mark quote as invoiced
        await updateQuote(input.quoteId, { status: "invoiced" });
        return { id, number };
      }),
    create: adminProcedure
      .input(z.object({
        clientName: z.string().min(1),
        clientTaxId: z.string().optional(),
        clientAddress: z.string().optional(),
        clientCity: z.string().optional(),
        clientPostalCode: z.string().optional(),
        clientCountry: z.string().optional(),
        clientEmail: z.string().optional(),
        date: z.string(),
        dueDate: z.string().optional(),
        notes: z.string().optional(),
        paymentMethod: z.string().optional(),
        items: z.array(documentItemSchema),
      }))
      .mutation(async ({ input }) => {
        const { items: rawItems, date, dueDate, ...invoiceData } = input;
        const year = new Date(date).getFullYear();
        const { number, sequence } = await getNextInvoiceNumber(year);

        const computedItems = rawItems.map((item) => {
          const { baseAmount, ivaAmount, lineTotal } = computeItemTotals(item);
          return {
            invoiceId: 0, // placeholder, createInvoice sets the real id
            ...item,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            baseAmount: baseAmount.toString(),
            ivaAmount: ivaAmount.toString(),
            lineTotal: lineTotal.toString(),
          };
        });

        const totals = computeDocumentTotals(
          computedItems.map((i) => ({
            baseAmount: parseFloat(i.baseAmount),
            ivaAmount: parseFloat(i.ivaAmount),
            lineTotal: parseFloat(i.lineTotal),
          }))
        );

        const id = await createInvoice(
          {
            ...invoiceData,
            number,
            year,
            sequence,
            date: new Date(date),
            dueDate: dueDate ? new Date(dueDate) : undefined,
            subtotal: totals.subtotal.toString(),
            totalIva: totals.totalIva.toString(),
            total: totals.total.toString(),
          },
          computedItems
        );
        return { id, number };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        clientName: z.string().min(1).optional(),
        clientTaxId: z.string().optional(),
        clientAddress: z.string().optional(),
        clientCity: z.string().optional(),
        clientPostalCode: z.string().optional(),
        clientCountry: z.string().optional(),
        clientEmail: z.string().optional(),
        date: z.string().optional(),
        dueDate: z.string().optional(),
        notes: z.string().optional(),
        paymentMethod: z.string().optional(),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
        items: z.array(documentItemSchema).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, items: rawItems, date, dueDate, ...rest } = input;
        let computedItems: any[] | undefined;
        let totals: any = {};

        if (rawItems !== undefined) {
          computedItems = rawItems.map((item) => {
            const { baseAmount, ivaAmount, lineTotal } = computeItemTotals(item);
            return {
              invoiceId: id,
              ...item,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              baseAmount: baseAmount.toString(),
              ivaAmount: ivaAmount.toString(),
              lineTotal: lineTotal.toString(),
            };
          });
          const t = computeDocumentTotals(
            computedItems.map((i) => ({
              baseAmount: parseFloat(i.baseAmount),
              ivaAmount: parseFloat(i.ivaAmount),
              lineTotal: parseFloat(i.lineTotal),
            }))
          );
          totals = {
            subtotal: t.subtotal.toString(),
            totalIva: t.totalIva.toString(),
            total: t.total.toString(),
          };
        }

        await updateInvoice(
          id,
          {
            ...rest,
            ...totals,
            ...(date ? { date: new Date(date) } : {}),
            ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
          },
          computedItems
        );
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteInvoice(input.id);
        return { success: true };
      }),
    generatePdf: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const invoice = await getInvoiceById(input.id);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
        const items = await getInvoiceItems(input.id);
        const content = await getSiteContent();

        const company = {
          name: content["company_name"] || "OrganizUS",
          owner: content["company_owner"] || "Ana Pérez Peramo",
          taxId: content["company_taxid"] || "77807125-B",
          address: content["company_address"] || "Calle Adriano 6",
          postalCode: content["company_postal_code"] || "41001",
          city: content["company_city"] || "Sevilla",
          email: content["contact_email"] || "hi@organizus.es",
          iban: content["company_iban"] || "",
          footerText: content["invoice_footer_text"] || "",
        };

        // Try to load logo from file system
        let logoBase64: string | undefined;
        try {
          const { readFileSync } = await import("fs");
          const { join } = await import("path");
          const logoPath = join(process.cwd(), "server", "assets", "logo.png");
          logoBase64 = readFileSync(logoPath).toString("base64");
        } catch { /* use text logo */ }

        const html = buildInvoiceHTML(invoice, items, company, logoBase64);

        // Generate real PDF binary using Puppeteer
        let pdfBuffer: Buffer;
        try {
          pdfBuffer = await htmlToPdf(html);
        } catch (err) {
          console.error("[PDF] Puppeteer failed, storing HTML fallback:", err);
          const htmlBuffer = Buffer.from(html, "utf-8");
          const { url: htmlUrl } = await storagePut(`invoices/invoice-${invoice.number}.html`, htmlBuffer, "text/html");
          await updateInvoice(input.id, { pdfUrl: htmlUrl, pdfKey: `invoices/invoice-${invoice.number}.html` });
          return { url: htmlUrl, key: `invoices/invoice-${invoice.number}.html`, html, isPdfFallback: true };
        }

        const key = `invoices/invoice-${invoice.number}.pdf`;
        const { url } = await storagePut(key, pdfBuffer, "application/pdf");

        await updateInvoice(input.id, { pdfUrl: url, pdfKey: key });
        return { url, key, html, isPdfFallback: false };
      }),
  }),

  // ─── Link Pages ───────────────────────────────────────────────────────────
  linkPages: router({
    list: adminProcedure.query(async () => getLinkPages()),
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getLinkPageById(input.id)),
    create: adminProcedure
      .input(z.object({
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
        name: z.string().min(1),
        bio: z.string().optional(),
        photoUrl: z.string().optional(),
        theme: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        accentColor: z.string().optional(),
        links: z.array(z.object({
          title: z.string(),
          url: z.string(),
          icon: z.string().optional(),
          active: z.boolean(),
        })).optional(),
        active: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await createLinkPage(input);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
        name: z.string().min(1).optional(),
        bio: z.string().optional(),
        photoUrl: z.string().optional(),
        theme: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        accentColor: z.string().optional(),
        links: z.array(z.object({
          title: z.string(),
          url: z.string(),
          icon: z.string().optional(),
          active: z.boolean(),
        })).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        await updateLinkPage(id, rest);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteLinkPage(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
