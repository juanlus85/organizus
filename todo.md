# OrganizUS - Todo List

## Base & Infrastructure
- [x] Database schema: users, site_content, services, quotes, invoices, quote_items, invoice_items, linkpages, contact_messages
- [x] Push DB migrations
- [x] Upload static assets (logo organizUS)
- [x] Configure email notifications (SMTP - configurable from admin panel)

## Public Website
- [x] Hero section with headline, subheadline and CTA button (editable)
- [x] Services section with cards (editable from admin)
- [x] About Us section (editable)
- [x] Contact form with email notification to admin
- [x] Header with logo and navigation
- [x] Footer with company info
- [x] Responsive design (mobile-first)

## Authentication & Admin Layout
- [x] Login page for admin panel (/admin)
- [x] Admin dashboard layout with sidebar navigation
- [x] Protected routes (admin only)
- [x] Role-based access control (admin / user)

## Admin - Content Management
- [x] Edit hero section (title, subtitle, CTA text)
- [x] Edit about section (text, image)
- [x] Manage services shown on public web
- [x] View contact messages received
- [x] Configure company data (name, address, IBAN, SMTP, etc.)

## Admin - Services Catalog
- [x] List all services
- [x] Create service (name, description, price, IVA %)
- [x] Edit service
- [x] Delete service

## Admin - Quotes (Presupuestos)
- [x] List all quotes with status
- [x] Create quote (client data, add services from catalog, custom items)
- [x] Auto-numbering: YYYY + sequential (e.g. 20261001)
- [x] Edit quote
- [x] Generate PDF matching provided format (logo, client data, items table, totals)
- [x] Store PDF in S3 cloud storage
- [x] Download PDF from admin
- [x] Convert quote to invoice

## Admin - Invoices (Facturas)
- [x] List all invoices with status
- [x] Create invoice from scratch or from quote
- [x] Auto-numbering: YYYY + sequential (e.g. 20261001)
- [x] Edit invoice
- [x] Generate PDF matching provided format (logo, client data, items table, subtotal/IVA/total, payment info)
- [x] Store PDF in S3 cloud storage
- [x] Download/re-download PDF from admin

## Admin - Linkstack Pages
- [x] List all linkstack pages
- [x] Create page (slug, name, bio, photo, links with title/url/icon)
- [x] Edit page
- [x] Delete page
- [x] Public URL: /[slug] accessible without login

## Admin - User Management
- [x] List registered users
- [x] Change user role (admin / user)
- [x] Delete user

## Email Notifications
- [x] Send email to admin when contact form is submitted
- [x] Email includes sender name, email, message content
- [x] SMTP configurable from admin panel (Contenido web section)

## PDF Generation
- [x] Quote PDF: organizUS logo, sender info, client info, items table (qty, desc, unit price, base, IVA%, line total), grand total
- [x] Invoice PDF: same as quote + subtotal/IVA breakdown + payment method box
- [x] PDF stored in S3 with retrievable URL

## Tests
- [x] Vitest: quote numbering logic
- [x] Vitest: PDF HTML generation (quote + invoice)
- [x] Vitest: auth middleware (logout + me)

## Mejoras v2
- [x] Separar servicios web (vitrina pública) de conceptos de facturación (catálogo interno)
- [x] Renombrar sección admin "Servicios" a "Conceptos de facturación" (catálogo interno)
- [x] Añadir gestión de "Servicios web" en Contenido web (los que se muestran en la web pública)
- [x] Campo unidades en facturas igual que en presupuestos

## Mejoras v3 - Link Pages Rediseño
- [x] Subida de foto de perfil desde el admin
- [x] Selector de tamaño de foto (pequeña, mediana, grande, muy grande)
- [x] Selector de forma de foto (círculo, redondeada, cuadrada)
- [x] 8 temas predefinidos con degradados modernos
- [x] Fondo sólido o degradado CSS personalizable
- [x] 6 estilos de botón (redondeado, píldora, cuadrado, contorno, sombra, cristal)
- [x] Selector de color de botón y texto
- [x] Selector de tipografía (Inter, Poppins, Playfair, Mono)
- [x] Vista previa en tiempo real en el editor
- [x] Página pública rediseñada con soporte de todos los nuevos campos

## Despliegue autohospedado en VPS
- [x] Auditar las dependencias administradas y definir sus equivalentes autohospedados
- [x] Adaptar autenticación, almacenamiento y configuración de producción para el VPS
- [x] Crear configuración de Nginx, servicio systemd y plantilla de variables de producción
- [x] Documentar la instalación y actualización por SSH desde GitHub
- [ ] Crear y publicar un repositorio privado de GitHub
- [ ] Instalar, configurar HTTPS y validar el servicio en el VPS
