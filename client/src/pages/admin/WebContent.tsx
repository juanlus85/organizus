import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Globe, Eye } from "lucide-react";

const CONTENT_FIELDS = [
  { key: "hero_title", label: "Título principal (Hero)", type: "textarea", placeholder: "Soluciones integrales para la gestión de congresos..." },
  { key: "hero_subtitle", label: "Subtítulo (Hero)", type: "textarea", placeholder: "Apoyamos a empresas, universidades y grupos de investigación..." },
  { key: "about_title", label: "Título sección 'Sobre nosotros'", type: "input", placeholder: "Sobre OrganizUS" },
  { key: "about_text", label: "Texto 'Sobre nosotros' (párrafos separados por línea en blanco)", type: "textarea", placeholder: "OrganizUS es una empresa especializada en..." },
  { key: "contact_email", label: "Email de contacto", type: "input", placeholder: "hi@organizus.es" },
  { key: "company_name", label: "Nombre de la empresa", type: "input", placeholder: "OrganizUS" },
  { key: "company_taxid", label: "CIF / NIF de la empresa", type: "input", placeholder: "B12345678" },
  { key: "company_address", label: "Dirección de la empresa", type: "input", placeholder: "Calle, número..." },
  { key: "company_city", label: "Ciudad", type: "input", placeholder: "Sevilla" },
  { key: "company_postal_code", label: "Código postal", type: "input", placeholder: "41001" },
  { key: "company_country", label: "País", type: "input", placeholder: "España" },
  { key: "company_phone", label: "Teléfono", type: "input", placeholder: "+34 600 000 000" },
  { key: "company_iban", label: "IBAN (para facturas)", type: "input", placeholder: "ES00 0000 0000 0000 0000 0000" },
  { key: "invoice_footer_text", label: "Texto pie de factura/presupuesto", type: "textarea", placeholder: "Gracias por confiar en OrganizUS..." },
  { key: "smtp_host", label: "SMTP Host (para emails)", type: "input", placeholder: "smtp.gmail.com" },
  { key: "smtp_port", label: "SMTP Puerto", type: "input", placeholder: "587" },
  { key: "smtp_user", label: "SMTP Usuario", type: "input", placeholder: "tu@email.com" },
  { key: "smtp_pass", label: "SMTP Contraseña", type: "input", placeholder: "••••••••" },
  { key: "smtp_from", label: "Email remitente", type: "input", placeholder: "OrganizUS <hi@organizus.es>" },
  { key: "admin_email", label: "Email admin (notificaciones)", type: "input", placeholder: "admin@organizus.es" },
];

export default function WebContent() {
  const utils = trpc.useUtils();
  const { data: content, isLoading } = trpc.public.getSiteContent.useQuery();
  const updateContent = trpc.admin.updateSiteContent.useMutation({
    onSuccess: () => { utils.public.getSiteContent.invalidate(); toast.success("Contenido guardado"); },
    onError: () => toast.error("Error al guardar"),
  });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (content) {
      setValues(content as Record<string, string>);
    }
  }, [content]);

  const handleSave = () => {
    updateContent.mutate(values);
  };

  if (isLoading) return <AdminLayout title="Contenido web"><div className="text-center py-12 text-gray-400">Cargando...</div></AdminLayout>;

  return (
    <AdminLayout title="Contenido web">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Edita el contenido de la web pública y la configuración de la empresa.</p>
          <div className="flex gap-3">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" /> Ver web
              </Button>
            </a>
            <Button onClick={handleSave} disabled={updateContent.isPending} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2">
              <Save className="w-4 h-4" />
              {updateContent.isPending ? "Guardando..." : "Guardar todo"}
            </Button>
          </div>
        </div>

        {/* Web content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-orange-500" /> Contenido de la web pública
          </h3>
          <p className="text-xs text-gray-400 mb-5">Estos textos se muestran en la página principal de organizus.es</p>
          <div className="space-y-5">
            {CONTENT_FIELDS.slice(0, 5).map((field) => (
              <div key={field.key}>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    className="resize-none"
                  />
                ) : (
                  <Input
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Company data */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-1">Datos de la empresa</h3>
          <p className="text-xs text-gray-400 mb-5">Estos datos aparecen en los presupuestos y facturas generados.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTENT_FIELDS.slice(5, 14).map((field) => (
              <div key={field.key} className={field.key === "invoice_footer_text" ? "md:col-span-2" : ""}>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={2}
                    className="resize-none"
                  />
                ) : (
                  <Input
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Email config */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-1">Configuración de email</h3>
          <p className="text-xs text-gray-400 mb-5">Configura el servidor SMTP para el envío de notificaciones del formulario de contacto.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTENT_FIELDS.slice(14).map((field) => (
              <div key={field.key}>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                <Input
                  value={values[field.key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  type={field.key === "smtp_pass" ? "password" : "text"}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateContent.isPending} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2 px-8">
            <Save className="w-4 h-4" />
            {updateContent.isPending ? "Guardando..." : "Guardar todo"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
