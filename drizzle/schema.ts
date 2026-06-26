import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Site Content (editable sections) ────────────────────────────────────────
export const siteContent = mysqlTable("site_content", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;

// ─── Services Catalog ─────────────────────────────────────────────────────────
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  ivaRate: int("ivaRate").notNull().default(21), // IVA percentage: 0, 4, 10, 21
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  taxId: varchar("taxId", { length: 50 }), // CIF/NIF
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("España"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Quotes (Presupuestos) ────────────────────────────────────────────────────
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(), // e.g. 20261001
  year: int("year").notNull(),
  sequence: int("sequence").notNull(),
  clientId: int("clientId"),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientTaxId: varchar("clientTaxId", { length: 50 }),
  clientAddress: text("clientAddress"),
  clientCity: varchar("clientCity", { length: 100 }),
  clientPostalCode: varchar("clientPostalCode", { length: 20 }),
  clientCountry: varchar("clientCountry", { length: 100 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientExtra: text("clientExtra"), // BIP code, faculty, etc.
  date: timestamp("date").defaultNow().notNull(),
  validUntil: timestamp("validUntil"),
  notes: text("notes"),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "invoiced"]).default("draft").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  totalIva: decimal("totalIva", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  pdfUrl: text("pdfUrl"),
  pdfKey: text("pdfKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

// ─── Quote Items ──────────────────────────────────────────────────────────────
export const quoteItems = mysqlTable("quote_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  serviceId: int("serviceId"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  description: text("description").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  ivaRate: int("ivaRate").notNull().default(21),
  baseAmount: decimal("baseAmount", { precision: 10, scale: 2 }).notNull().default("0"),
  ivaAmount: decimal("ivaAmount", { precision: 10, scale: 2 }).notNull().default("0"),
  lineTotal: decimal("lineTotal", { precision: 10, scale: 2 }).notNull().default("0"),
  sortOrder: int("sortOrder").notNull().default(0),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

// ─── Invoices (Facturas) ──────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(), // e.g. 20261001
  year: int("year").notNull(),
  sequence: int("sequence").notNull(),
  quoteId: int("quoteId"), // optional: created from quote
  clientId: int("clientId"),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientTaxId: varchar("clientTaxId", { length: 50 }),
  clientAddress: text("clientAddress"),
  clientCity: varchar("clientCity", { length: 100 }),
  clientPostalCode: varchar("clientPostalCode", { length: 20 }),
  clientCountry: varchar("clientCountry", { length: 100 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  date: timestamp("date").defaultNow().notNull(),
  dueDate: timestamp("dueDate"),
  notes: text("notes"),
  paymentMethod: text("paymentMethod"),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  totalIva: decimal("totalIva", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  pdfUrl: text("pdfUrl"),
  pdfKey: text("pdfKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── Invoice Items ────────────────────────────────────────────────────────────
export const invoiceItems = mysqlTable("invoice_items", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  serviceId: int("serviceId"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  description: text("description").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  ivaRate: int("ivaRate").notNull().default(21),
  baseAmount: decimal("baseAmount", { precision: 10, scale: 2 }).notNull().default("0"),
  ivaAmount: decimal("ivaAmount", { precision: 10, scale: 2 }).notNull().default("0"),
  lineTotal: decimal("lineTotal", { precision: 10, scale: 2 }).notNull().default("0"),
  sortOrder: int("sortOrder").notNull().default(0),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

// ─── Linkstack Pages ──────────────────────────────────────────────────────────
export const linkPages = mysqlTable("link_pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  bio: text("bio"),
  photoUrl: text("photoUrl"),
  photoKey: text("photoKey"),
  theme: varchar("theme", { length: 50 }).default("default"),
  backgroundColor: varchar("backgroundColor", { length: 20 }).default("#ffffff"),
  textColor: varchar("textColor", { length: 20 }).default("#000000"),
  accentColor: varchar("accentColor", { length: 20 }).default("#f97316"),
  links: json("links").$type<Array<{ title: string; url: string; icon?: string; active: boolean }>>(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LinkPage = typeof linkPages.$inferSelect;
export type InsertLinkPage = typeof linkPages.$inferInsert;

// ─── Contact Messages ─────────────────────────────────────────────────────────
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// ─── Web Public Services (vitrina pública) ────────────────────────────────────
// Separate from billing concepts (services table). These are shown on the public website.
export const webServices = mysqlTable("web_services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).default("Calendar"), // lucide icon name
  sortOrder: int("sortOrder").notNull().default(0),
  images: json("images").$type<Array<{ key: string; url: string; caption?: string }>>(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebService = typeof webServices.$inferSelect;
export type InsertWebService = typeof webServices.$inferInsert;
