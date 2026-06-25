import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  siteContent, SiteContent,
  services, Service, InsertService,
  clients, Client, InsertClient,
  quotes, Quote, InsertQuote,
  quoteItems, QuoteItem, InsertQuoteItem,
  invoices, Invoice, InsertInvoice,
  invoiceItems, InvoiceItem, InsertInvoiceItem,
  linkPages, LinkPage, InsertLinkPage,
  contactMessages, ContactMessage, InsertContactMessage,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    });
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "user") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

// ─── Site Content ─────────────────────────────────────────────────────────────
export async function getSiteContent(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(siteContent);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSiteContent(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(siteContent).values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function setSiteContentBatch(entries: Record<string, string>) {
  const db = await getDb();
  if (!db) return;
  for (const [key, value] of Object.entries(entries)) {
    await db.insert(siteContent).values({ key, value })
      .onDuplicateKeyUpdate({ set: { value } });
  }
}

// ─── Services ─────────────────────────────────────────────────────────────────
export async function getServices(activeOnly = false): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(services).where(eq(services.active, true)).orderBy(services.name);
  }
  return db.select().from(services).orderBy(services.name);
}

export async function getServiceById(id: number): Promise<Service | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

export async function createService(data: InsertService): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(services).values(data);
  return (result[0] as any).insertId;
}

export async function updateService(id: number, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) return;
  await db.update(services).set(data).where(eq(services.id, id));
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(services).where(eq(services.id, id));
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export async function getClients(): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).orderBy(clients.name);
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function upsertClient(data: InsertClient): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clients).values(data);
  return (result[0] as any).insertId;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set(data).where(eq(clients.id, id));
}

// ─── Quote Numbering ──────────────────────────────────────────────────────────
export async function getNextQuoteNumber(year: number): Promise<{ number: string; sequence: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.select({ maxSeq: sql<number>`MAX(sequence)` })
    .from(quotes)
    .where(eq(quotes.year, year));
  const maxSeq = result[0]?.maxSeq ?? 0;
  const sequence = maxSeq + 1;
  const number = `${year}${String(sequence).padStart(4, '0')}`;
  return { number, sequence };
}

export async function getNextInvoiceNumber(year: number): Promise<{ number: string; sequence: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.select({ maxSeq: sql<number>`MAX(sequence)` })
    .from(invoices)
    .where(eq(invoices.year, year));
  const maxSeq = result[0]?.maxSeq ?? 0;
  const sequence = maxSeq + 1;
  const number = `${year}${String(sequence).padStart(4, '0')}`;
  return { number, sequence };
}

// ─── Quotes ───────────────────────────────────────────────────────────────────
export async function getQuotes(): Promise<Quote[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotes).orderBy(desc(quotes.createdAt));
}

export async function getQuoteById(id: number): Promise<Quote | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result[0];
}

export async function getQuoteItems(quoteId: number): Promise<QuoteItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId)).orderBy(quoteItems.sortOrder);
}

export async function createQuote(data: InsertQuote, items: InsertQuoteItem[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(quotes).values(data);
  const quoteId = (result[0] as any).insertId;
  if (items.length > 0) {
    await db.insert(quoteItems).values(items.map((item, i) => ({ ...item, quoteId, sortOrder: i })));
  }
  return quoteId;
}

export async function updateQuote(id: number, data: Partial<InsertQuote>, items?: InsertQuoteItem[]) {
  const db = await getDb();
  if (!db) return;
  await db.update(quotes).set(data).where(eq(quotes.id, id));
  if (items !== undefined) {
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    if (items.length > 0) {
      await db.insert(quoteItems).values(items.map((item, i) => ({ ...item, quoteId: id, sortOrder: i })));
    }
  }
}

export async function deleteQuote(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
  await db.delete(quotes).where(eq(quotes.id, id));
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export async function getInvoices(): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: number): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}

export async function getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)).orderBy(invoiceItems.sortOrder);
}

export async function createInvoice(data: InsertInvoice, items: InsertInvoiceItem[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(invoices).values(data);
  const invoiceId = (result[0] as any).insertId;
  if (items.length > 0) {
    await db.insert(invoiceItems).values(items.map((item, i) => ({ ...item, invoiceId, sortOrder: i })));
  }
  return invoiceId;
}

export async function updateInvoice(id: number, data: Partial<InsertInvoice>, items?: InsertInvoiceItem[]) {
  const db = await getDb();
  if (!db) return;
  await db.update(invoices).set(data).where(eq(invoices.id, id));
  if (items !== undefined) {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    if (items.length > 0) {
      await db.insert(invoiceItems).values(items.map((item, i) => ({ ...item, invoiceId: id, sortOrder: i })));
    }
  }
}

export async function deleteInvoice(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  await db.delete(invoices).where(eq(invoices.id, id));
}

// ─── Link Pages ───────────────────────────────────────────────────────────────
export async function getLinkPages(): Promise<LinkPage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(linkPages).orderBy(desc(linkPages.createdAt));
}

export async function getLinkPageBySlug(slug: string): Promise<LinkPage | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(linkPages)
    .where(and(eq(linkPages.slug, slug), eq(linkPages.active, true))).limit(1);
  return result[0];
}

export async function getLinkPageById(id: number): Promise<LinkPage | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(linkPages).where(eq(linkPages.id, id)).limit(1);
  return result[0];
}

export async function createLinkPage(data: InsertLinkPage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(linkPages).values(data);
  return (result[0] as any).insertId;
}

export async function updateLinkPage(id: number, data: Partial<InsertLinkPage>) {
  const db = await getDb();
  if (!db) return;
  await db.update(linkPages).set(data).where(eq(linkPages.id, id));
}

export async function deleteLinkPage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(linkPages).where(eq(linkPages.id, id));
}

// ─── Contact Messages ─────────────────────────────────────────────────────────
export async function getContactMessages(): Promise<ContactMessage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function createContactMessage(data: InsertContactMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contactMessages).values(data);
  return (result[0] as any).insertId;
}

export async function markContactMessageRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(contactMessages).set({ read: true }).where(eq(contactMessages.id, id));
}

export async function deleteContactMessage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
}
