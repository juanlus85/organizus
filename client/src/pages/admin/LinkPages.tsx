import { useState, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Link2, X, Upload, Loader2, Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LinkItem { title: string; url: string; icon?: string; active: boolean; }

interface PageForm {
  slug: string;
  name: string;
  bio: string;
  photoUrl: string;
  photoSize: string;
  photoShape: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  backgroundType: string;
  backgroundGradient: string;
  buttonStyle: string;
  buttonBg: string;
  buttonTextColor: string;
  fontFamily: string;
  showBranding: boolean;
  active: boolean;
  links: LinkItem[];
}

const defaultForm: PageForm = {
  slug: "", name: "", bio: "", photoUrl: "",
  photoSize: "md", photoShape: "circle",
  backgroundColor: "#0f172a", textColor: "#ffffff", accentColor: "#f97316",
  backgroundType: "gradient", backgroundGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
  buttonStyle: "rounded", buttonBg: "#f97316", buttonTextColor: "#ffffff",
  fontFamily: "inter", showBranding: true, active: true, links: [],
};

// ─── Preset themes ────────────────────────────────────────────────────────────
const THEMES = [
  { label: "Noche Naranja", bg: "#0f172a", text: "#ffffff", accent: "#f97316", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", btnBg: "#f97316" },
  { label: "Aurora", bg: "#0d1117", text: "#ffffff", accent: "#a78bfa", gradient: "linear-gradient(135deg, #0d1117 0%, #1a0533 50%, #0d1117 100%)", btnBg: "#a78bfa" },
  { label: "Océano", bg: "#0c1445", text: "#ffffff", accent: "#38bdf8", gradient: "linear-gradient(135deg, #0c1445 0%, #0e4d8a 50%, #0c1445 100%)", btnBg: "#38bdf8" },
  { label: "Bosque", bg: "#0a1628", text: "#ffffff", accent: "#4ade80", gradient: "linear-gradient(135deg, #0a1628 0%, #14532d 50%, #0a1628 100%)", btnBg: "#4ade80" },
  { label: "Atardecer", bg: "#1c0a00", text: "#ffffff", accent: "#fb923c", gradient: "linear-gradient(135deg, #1c0a00 0%, #7c2d12 50%, #1c0a00 100%)", btnBg: "#fb923c" },
  { label: "Rosa Neón", bg: "#0f0f1a", text: "#ffffff", accent: "#f472b6", gradient: "linear-gradient(135deg, #0f0f1a 0%, #3b0764 50%, #0f0f1a 100%)", btnBg: "#f472b6" },
  { label: "Minimalista", bg: "#ffffff", text: "#111827", accent: "#111827", gradient: "", btnBg: "#111827" },
  { label: "Crema", bg: "#fdf6ec", text: "#1c1917", accent: "#d97706", gradient: "", btnBg: "#d97706" },
];

const BUTTON_STYLES = [
  { id: "rounded", label: "Redondeado" },
  { id: "pill", label: "Píldora" },
  { id: "square", label: "Cuadrado" },
  { id: "outline", label: "Contorno" },
  { id: "shadow", label: "Con sombra" },
  { id: "glass", label: "Cristal" },
];

const PHOTO_SIZES = [
  { id: "sm", label: "Pequeña", px: "64px" },
  { id: "md", label: "Mediana", px: "96px" },
  { id: "lg", label: "Grande", px: "128px" },
  { id: "xl", label: "Muy grande", px: "160px" },
];

const PHOTO_SHAPES = [
  { id: "circle", label: "Círculo" },
  { id: "rounded", label: "Redondeada" },
  { id: "square", label: "Cuadrada" },
];

const FONTS = [
  { id: "inter", label: "Inter (moderno)" },
  { id: "poppins", label: "Poppins (amigable)" },
  { id: "playfair", label: "Playfair (elegante)" },
  { id: "mono", label: "Mono (técnico)" },
];

// ─── Live preview ─────────────────────────────────────────────────────────────
function LivePreview({ form }: { form: PageForm }) {
  const bg = form.backgroundType === "gradient" && form.backgroundGradient
    ? form.backgroundGradient
    : form.backgroundColor;

  const getButtonClass = (style: string) => {
    const base = "w-full px-4 py-2.5 text-xs font-semibold transition-all text-center block truncate";
    switch (style) {
      case "pill": return `${base} rounded-full`;
      case "square": return `${base} rounded-none`;
      case "outline": return `${base} rounded-xl border-2 bg-transparent`;
      case "shadow": return `${base} rounded-xl shadow-lg`;
      case "glass": return `${base} rounded-xl backdrop-blur-sm bg-white/10 border border-white/20`;
      default: return `${base} rounded-xl`;
    }
  };

  const photoSizePx = PHOTO_SIZES.find(s => s.id === form.photoSize)?.px || "96px";
  const photoRadius = form.photoShape === "circle" ? "9999px" : form.photoShape === "rounded" ? "16px" : "8px";

  return (
    <div className="w-full h-full flex items-start justify-center overflow-auto py-4 px-2">
      <div
        className="w-[200px] min-h-[360px] rounded-2xl overflow-hidden p-4 flex flex-col items-center shadow-xl"
        style={{ background: bg }}
      >
        {/* Photo */}
        <div className="mb-3 mt-2">
          {form.photoUrl ? (
            <img
              src={form.photoUrl}
              alt={form.name}
              style={{ width: photoSizePx, height: photoSizePx, borderRadius: photoRadius, objectFit: "cover", border: `3px solid ${form.accentColor}` }}
            />
          ) : (
            <div
              style={{ width: photoSizePx, height: photoSizePx, borderRadius: photoRadius, backgroundColor: form.accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "bold", color: "#fff" }}
            >
              {form.name ? form.name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>
        {/* Name */}
        <p className="font-bold text-sm text-center mb-1" style={{ color: form.textColor }}>{form.name || "Tu nombre"}</p>
        {form.bio && <p className="text-xs text-center mb-3 opacity-70 leading-tight" style={{ color: form.textColor }}>{form.bio}</p>}
        {/* Links */}
        <div className="w-full space-y-1.5">
          {form.links.filter(l => l.active).slice(0, 4).map((link, i) => (
            <div
              key={i}
              className={getButtonClass(form.buttonStyle)}
              style={
                form.buttonStyle === "outline"
                  ? { borderColor: form.buttonBg || form.accentColor, color: form.buttonBg || form.accentColor }
                  : form.buttonStyle === "glass"
                  ? { color: form.buttonTextColor }
                  : { backgroundColor: form.buttonBg || form.accentColor, color: form.buttonTextColor }
              }
            >
              {link.title || "Enlace"}
            </div>
          ))}
          {form.links.filter(l => l.active).length === 0 && (
            <div className="rounded-xl px-4 py-2.5 text-xs font-semibold text-center opacity-50" style={{ backgroundColor: form.accentColor, color: "#fff" }}>
              Ejemplo de enlace
            </div>
          )}
        </div>
        {form.showBranding && (
          <p className="text-xs opacity-30 mt-4" style={{ color: form.textColor }}>Creado con OrganizUS</p>
        )}
      </div>
    </div>
  );
}

// ─── Form fields (OUTSIDE parent to prevent remount) ─────────────────────────
interface FormFieldsProps {
  form: PageForm;
  setForm: React.Dispatch<React.SetStateAction<PageForm>>;
  isEditing: boolean;
  pageId?: number;
  onPhotoUploaded?: (url: string) => void;
}

function PageFormFields({ form, setForm, isEditing, pageId, onPhotoUploaded }: FormFieldsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadPhoto = trpc.linkPages.uploadPhoto.useMutation({
    onSuccess: (data) => {
      setForm(f => ({ ...f, photoUrl: data.url }));
      onPhotoUploaded?.(data.url);
      toast.success("Foto subida");
    },
    onError: () => toast.error("Error al subir la foto"),
    onSettled: () => setUploading(false),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pageId) { toast.error("Guarda la página primero para subir una foto"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadPhoto.mutate({ id: pageId, filename: file.name, mimeType: file.type, dataBase64: base64 });
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyTheme = (t: typeof THEMES[0]) => {
    setForm(f => ({
      ...f,
      backgroundColor: t.bg,
      textColor: t.text,
      accentColor: t.accent,
      backgroundType: t.gradient ? "gradient" : "solid",
      backgroundGradient: t.gradient,
      buttonBg: t.btnBg,
    }));
  };

  const addLink = () => setForm(f => ({ ...f, links: [...f.links, { title: "", url: "", active: true }] }));
  const removeLink = (i: number) => setForm(f => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }));
  const updateLink = (i: number, field: keyof LinkItem, value: string | boolean) => {
    setForm(f => {
      const links = [...f.links];
      links[i] = { ...links[i], [field]: value };
      return { ...f, links };
    });
  };

  return (
    <div className="max-h-[65vh] overflow-y-auto pr-1">
      <Tabs defaultValue="perfil">
        <TabsList className="w-full mb-4 grid grid-cols-4">
          <TabsTrigger value="perfil" className="text-xs">Perfil</TabsTrigger>
          <TabsTrigger value="diseno" className="text-xs">Diseño</TabsTrigger>
          <TabsTrigger value="botones" className="text-xs">Botones</TabsTrigger>
          <TabsTrigger value="enlaces" className="text-xs">Enlaces</TabsTrigger>
        </TabsList>

        {/* ── Perfil ── */}
        <TabsContent value="perfil" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Slug (URL) *</label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))} placeholder="mi-pagina" disabled={isEditing} />
              <p className="text-xs text-gray-400 mt-1">organizus.es/{form.slug || "mi-pagina"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tu nombre" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Biografía / Descripción</label>
            <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={2} className="resize-none" placeholder="Una breve descripción..." />
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Foto de perfil</label>
            <div className="flex items-center gap-4">
              {form.photoUrl ? (
                <div className="relative">
                  <img src={form.photoUrl} alt="preview" className="w-16 h-16 rounded-full object-cover border-2 border-orange-200" />
                  <button onClick={() => setForm(f => ({ ...f, photoUrl: "" }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  <Upload className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || !pageId}
                >
                  {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Subiendo...</> : <><Upload className="w-3 h-3" /> Subir foto</>}
                </Button>
                {!pageId && <p className="text-xs text-amber-600">Crea la página primero para subir foto</p>}
                <Input value={form.photoUrl} onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))} placeholder="O pega una URL..." className="text-xs h-7" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {/* Photo size & shape */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Tamaño de foto</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PHOTO_SIZES.map(s => (
                  <button key={s.id} onClick={() => setForm(f => ({ ...f, photoSize: s.id }))}
                    className={`text-xs py-1.5 px-2 rounded-lg border transition-all ${form.photoSize === s.id ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Forma de foto</label>
              <div className="space-y-1.5">
                {PHOTO_SHAPES.map(s => (
                  <button key={s.id} onClick={() => setForm(f => ({ ...f, photoShape: s.id }))}
                    className={`w-full text-xs py-1.5 px-2 rounded-lg border transition-all ${form.photoShape === s.id ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
            <label className="text-sm text-gray-700">Página activa y visible</label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.showBranding} onCheckedChange={v => setForm(f => ({ ...f, showBranding: v }))} />
            <label className="text-sm text-gray-700">Mostrar "Creado con OrganizUS"</label>
          </div>
        </TabsContent>

        {/* ── Diseño ── */}
        <TabsContent value="diseno" className="space-y-4">
          {/* Preset themes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Temas predefinidos</label>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map(t => (
                <button key={t.label} onClick={() => applyTheme(t)} title={t.label}
                  className="h-10 rounded-xl border-2 border-transparent hover:border-orange-400 transition-all overflow-hidden"
                  style={{ background: t.gradient || t.bg }}>
                  <span className="text-[9px] font-bold" style={{ color: t.text, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background type */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Tipo de fondo</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setForm(f => ({ ...f, backgroundType: "solid" }))}
                className={`text-xs py-2 rounded-lg border transition-all ${form.backgroundType === "solid" ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold" : "border-gray-200 text-gray-500"}`}>
                Color sólido
              </button>
              <button onClick={() => setForm(f => ({ ...f, backgroundType: "gradient" }))}
                className={`text-xs py-2 rounded-lg border transition-all ${form.backgroundType === "gradient" ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold" : "border-gray-200 text-gray-500"}`}>
                Degradado
              </button>
            </div>
          </div>

          {form.backgroundType === "gradient" ? (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">CSS del degradado</label>
              <Input value={form.backgroundGradient} onChange={e => setForm(f => ({ ...f, backgroundGradient: e.target.value }))} placeholder="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" className="text-xs font-mono" />
              <div className="mt-2 h-8 rounded-lg border border-gray-200" style={{ background: form.backgroundGradient }} />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Color de fondo</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.backgroundColor} onChange={e => setForm(f => ({ ...f, backgroundColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                <Input value={form.backgroundColor} onChange={e => setForm(f => ({ ...f, backgroundColor: e.target.value }))} className="text-xs font-mono" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Color de texto</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                <Input value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} className="text-xs font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Color de acento</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.accentColor} onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                <Input value={form.accentColor} onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))} className="text-xs font-mono" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Tipografía</label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button key={f.id} onClick={() => setForm(fm => ({ ...fm, fontFamily: f.id }))}
                  className={`text-xs py-2 px-3 rounded-lg border transition-all text-left ${form.fontFamily === f.id ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold" : "border-gray-200 text-gray-500"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Botones ── */}
        <TabsContent value="botones" className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Estilo de botón</label>
            <div className="grid grid-cols-2 gap-2">
              {BUTTON_STYLES.map(s => (
                <button key={s.id} onClick={() => setForm(f => ({ ...f, buttonStyle: s.id }))}
                  className={`text-xs py-2 px-3 rounded-lg border transition-all ${form.buttonStyle === s.id ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold" : "border-gray-200 text-gray-500"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Color del botón</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.buttonBg || form.accentColor} onChange={e => setForm(f => ({ ...f, buttonBg: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                <Input value={form.buttonBg} onChange={e => setForm(f => ({ ...f, buttonBg: e.target.value }))} className="text-xs font-mono" placeholder={form.accentColor} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Texto del botón</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.buttonTextColor} onChange={e => setForm(f => ({ ...f, buttonTextColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                <Input value={form.buttonTextColor} onChange={e => setForm(f => ({ ...f, buttonTextColor: e.target.value }))} className="text-xs font-mono" />
              </div>
            </div>
          </div>
          {/* Button preview */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 mb-3">Vista previa del botón:</p>
            <div
              className={`px-5 py-3 text-sm font-semibold text-center transition-all ${
                form.buttonStyle === "pill" ? "rounded-full" :
                form.buttonStyle === "square" ? "rounded-none" :
                form.buttonStyle === "outline" ? "rounded-xl border-2 bg-transparent" :
                form.buttonStyle === "shadow" ? "rounded-xl shadow-lg" :
                form.buttonStyle === "glass" ? "rounded-xl backdrop-blur-sm bg-white/10 border border-white/20" :
                "rounded-xl"
              }`}
              style={
                form.buttonStyle === "outline"
                  ? { borderColor: form.buttonBg || form.accentColor, color: form.buttonBg || form.accentColor }
                  : { backgroundColor: form.buttonBg || form.accentColor, color: form.buttonTextColor }
              }
            >
              Ejemplo de enlace
            </div>
          </div>
        </TabsContent>

        {/* ── Enlaces ── */}
        <TabsContent value="enlaces" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{form.links.length} enlace(s)</p>
            <Button size="sm" variant="outline" onClick={addLink} className="text-xs gap-1 h-7">
              <Plus className="w-3 h-3" /> Añadir enlace
            </Button>
          </div>
          <div className="space-y-2">
            {form.links.map((link, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input value={link.title} onChange={e => updateLink(i, "title", e.target.value)} placeholder="Título del enlace" className="text-xs h-8" />
                  <Input value={link.url} onChange={e => updateLink(i, "url", e.target.value)} placeholder="https://..." className="text-xs h-8" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={link.active} onCheckedChange={v => updateLink(i, "active", v)} />
                    <span className="text-xs text-gray-500">{link.active ? "Visible" : "Oculto"}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeLink(i)} className="h-7 w-7 p-0 text-gray-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {form.links.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">
                <Link2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
                No hay enlaces. Añade el primero.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LinkPages() {
  const utils = trpc.useUtils();
  const { data: pages, isLoading } = trpc.linkPages.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [form, setForm] = useState<PageForm>(defaultForm);
  const [showPreview, setShowPreview] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const createMutation = trpc.linkPages.create.useMutation({
    onSuccess: (data) => {
      utils.linkPages.list.invalidate();
      toast.success("Página creada. Ahora puedes subir una foto.");
      setCreatedId(data.id);
    },
    onError: (e) => toast.error(e.message || "Error al crear"),
  });

  const updateMutation = trpc.linkPages.update.useMutation({
    onSuccess: () => {
      utils.linkPages.list.invalidate();
      toast.success("Página actualizada");
      setEditingPage(null);
    },
    onError: (e) => toast.error(e.message || "Error al actualizar"),
  });

  const deleteMutation = trpc.linkPages.delete.useMutation({
    onSuccess: () => { utils.linkPages.list.invalidate(); toast.success("Página eliminada"); },
  });

  const openCreate = () => { setForm(defaultForm); setCreatedId(null); setShowCreate(true); };
  const openEdit = (page: any) => {
    setEditingPage(page);
    setForm({
      slug: page.slug, name: page.name, bio: page.bio || "",
      photoUrl: page.photoUrl || "",
      photoSize: page.photoSize || "md", photoShape: page.photoShape || "circle",
      backgroundColor: page.backgroundColor || "#0f172a",
      textColor: page.textColor || "#ffffff",
      accentColor: page.accentColor || "#f97316",
      backgroundType: page.backgroundType || "gradient",
      backgroundGradient: page.backgroundGradient || "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      buttonStyle: page.buttonStyle || "rounded",
      buttonBg: page.buttonBg || page.accentColor || "#f97316",
      buttonTextColor: page.buttonTextColor || "#ffffff",
      fontFamily: page.fontFamily || "inter",
      showBranding: page.showBranding !== false,
      active: page.active,
      links: (page.links as LinkItem[]) || [],
    });
  };

  const handleSave = () => {
    if (!form.slug.trim()) { toast.error("El slug es requerido"); return; }
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleUpdateAfterCreate = () => {
    if (!createdId) return;
    updateMutation.mutate({ id: createdId, ...form });
    setShowCreate(false);
    setCreatedId(null);
    setForm(defaultForm);
  };

  return (
    <AdminLayout title="Link Pages">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Páginas de enlaces personalizadas accesibles en <strong>organizus.es/slug</strong>.
          </p>
          <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2">
            <Plus className="w-4 h-4" /> Nueva página
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : pages?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay páginas</p>
            <p className="text-sm text-gray-400 mt-1">Crea tu primera link page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages?.map((page) => {
              const links = (page.links as LinkItem[]) || [];
              const bg = page.backgroundType === "gradient" && page.backgroundGradient
                ? page.backgroundGradient
                : page.backgroundColor || "#0f172a";
              return (
                <div key={page.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-orange-200 hover:shadow-md transition-all">
                  {/* Preview header */}
                  <div className="h-28 flex flex-col items-center justify-center gap-2 relative" style={{ background: bg }}>
                    {page.photoUrl ? (
                      <img src={page.photoUrl} alt={page.name} className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: page.accentColor || "#f97316" }} />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow" style={{ backgroundColor: page.accentColor || "#f97316" }}>
                        {page.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-xs font-bold" style={{ color: page.textColor || "#fff" }}>{page.name}</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs text-gray-400">/{page.slug}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${page.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {page.active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">{links.filter(l => l.active).length} enlace(s) activo(s)</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(page)} className="flex-1 gap-1 text-xs">
                        <Pencil className="w-3 h-3" /> Editar
                      </Button>
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1 text-xs" title="Ver página">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("¿Eliminar esta página?")) deleteMutation.mutate({ id: page.id }); }} className="text-gray-400 hover:text-red-500 w-8 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setCreatedId(null); } }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <div className="grid grid-cols-[1fr_220px]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle>Nueva link page</DialogTitle>
              </DialogHeader>
              <PageFormFields form={form} setForm={setForm} isEditing={false} pageId={createdId || undefined} />
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => { setShowCreate(false); setCreatedId(null); }}>Cancelar</Button>
                {!createdId ? (
                  <Button onClick={handleSave} disabled={createMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                    {createMutation.isPending ? "Creando..." : "Crear página"}
                  </Button>
                ) : (
                  <Button onClick={handleUpdateAfterCreate} disabled={updateMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                    {updateMutation.isPending ? "Guardando..." : "Guardar y cerrar"}
                  </Button>
                )}
              </div>
            </div>
            {/* Live preview */}
            <div className="bg-gray-50 border-l border-gray-100 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500">Vista previa</span>
              </div>
              <div className="flex-1">
                <LivePreview form={form} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingPage} onOpenChange={(o) => !o && setEditingPage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <div className="grid grid-cols-[1fr_220px]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle>Editar: {editingPage?.name}</DialogTitle>
              </DialogHeader>
              <PageFormFields form={form} setForm={setForm} isEditing={true} pageId={editingPage?.id} />
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingPage(null)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                  {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 border-l border-gray-100 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500">Vista previa</span>
              </div>
              <div className="flex-1">
                <LivePreview form={form} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
