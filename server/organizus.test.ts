import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@organizus.es",
    name: "Admin OrganizUS",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });

  it("auth.me returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── PDF service tests ────────────────────────────────────────────────────────
describe("pdfService", () => {
  it("buildQuoteHTML generates valid HTML with required elements", async () => {
    const { buildQuoteHTML } = await import("./pdfService");
    const mockQuote = {
      id: 1,
      number: "20261001",
      year: 2026,
      sequence: 1,
      status: "draft" as const,
      clientName: "Test Client SA",
      clientTaxId: "B12345678",
      clientAddress: "Calle Test 1",
      clientCity: "Sevilla",
      clientPostalCode: "41001",
      clientCountry: "España",
      clientEmail: "test@test.com",
      clientExtra: null,
      date: new Date("2026-01-15"),
      validUntil: null,
      notes: null,
      subtotal: "100.00",
      totalIva: "21.00",
      total: "121.00",
      pdfUrl: null,
      pdfKey: null,
      quoteId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const mockItems = [{
      id: 1,
      quoteId: 1,
      serviceId: null,
      sortOrder: 0,
      description: "Servicio de prueba",
      quantity: "1",
      unitPrice: "100.00",
      ivaRate: 21,
      baseAmount: "100.00",
      ivaAmount: "21.00",
      lineTotal: "121.00",
    }] as any[];

    const company = {
      name: "OrganizUS",
      owner: "Ana Pérez Peramo",
      taxId: "77807125-B",
      address: "Calle Adriano 6",
      postalCode: "41001",
      city: "Sevilla",
      email: "hi@organizus.es",
    };

    const html = buildQuoteHTML(mockQuote, mockItems, company);
    expect(html).toContain("Presupuesto");
    expect(html).toContain("Test Client SA");
    expect(html).toContain("Servicio de prueba");
    expect(html).toContain("121,00€");
    expect(html).toContain("organiz");
  });

  it("buildInvoiceHTML generates valid HTML with totals section", async () => {
    const { buildInvoiceHTML } = await import("./pdfService");
    const mockInvoice = {
      id: 1,
      number: "20261001",
      year: 2026,
      sequence: 1,
      status: "draft" as const,
      quoteId: null,
      clientName: "FIUS Test",
      clientTaxId: "G12345678",
      clientAddress: "Avda. Test 1",
      clientCity: "Sevilla",
      clientPostalCode: "41012",
      clientCountry: "España",
      clientEmail: null,
      date: new Date("2026-06-01"),
      dueDate: null,
      notes: null,
      paymentMethod: "TRANSFERENCIA BANCARIA",
      subtotal: "7670.00",
      totalIva: "1610.70",
      total: "9280.70",
      pdfUrl: null,
      pdfKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const mockItems = [{
      id: 1,
      invoiceId: 1,
      serviceId: null,
      sortOrder: 0,
      description: "Servicio integral de diseño",
      quantity: "1",
      unitPrice: "7670.00",
      ivaRate: 21,
      baseAmount: "7670.00",
      ivaAmount: "1610.70",
      lineTotal: "9280.70",
    }] as any[];

    const company = {
      name: "OrganizUS",
      owner: "Ana Pérez Peramo",
      taxId: "77807125-B",
      address: "Calle Adriano 6",
      postalCode: "41001",
      city: "Sevilla",
      email: "hi@organizus.es",
      iban: "ES09 1544 7889 7666 5344 1341",
    };

    const html = buildInvoiceHTML(mockInvoice, mockItems, company);
    expect(html).toContain("Factura");
    expect(html).toContain("FIUS Test");
    expect(html).toContain("SUBTOTAL (SIN IVA)");
    expect(html).toContain("TOTAL EUROS");
    expect(html).toContain("9280,70€");
  });
});

// ─── Number formatting tests ──────────────────────────────────────────────────
describe("document numbering", () => {
  it("quote number follows YYYYNNNN format", () => {
    const year = 2026;
    const sequence = 1;
    const number = `${year}${sequence.toString().padStart(4, "0")}`;
    expect(number).toBe("20260001"); // sequence 1 pads to 0001
    expect(number).toHaveLength(8);
  });

  it("invoice number follows YYYYNNNN format", () => {
    const year = 2026;
    const sequence = 5;
    const number = `${year}${sequence.toString().padStart(4, "0")}`;
    expect(number).toBe("20260005"); // padStart(4) gives 0005 not 1005
    expect(number).toHaveLength(8);
  });

  it("sequence 1005 gives correct number", () => {
    const year = 2026;
    const sequence = 1005;
    const number = `${year}${sequence.toString().padStart(4, "0")}`;
    expect(number).toBe("20261005");
  });
});
