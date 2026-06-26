import { useState, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe, ImagePlus, X, Images, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const ICON_OPTIONS = [
  "Calendar", "Users", "Monitor", "BookOpen", "Briefcase", "Globe",
  "Star", "Zap", "Heart", "Award", "Target", "Layers", "Settings",
  "MessageSquare", "Camera", "Music", "Map", "Coffee", "Smile",
];

interface ServiceImage { key: string; url: string; caption?: string; }

interface ServiceForm {
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  active: boolean;
}

const emptyForm: ServiceForm = { name: "", description: "", icon: "Calendar", sortOrder: 0, active: true };

// ─── FormFields defined OUTSIDE the parent to prevent remount on every render ─
interface FormFieldsProps {
  form: ServiceForm;
  setForm: React.Dispatch<React.SetStateAction<ServiceForm>>;
}

function FormFields({ form, setForm }: FormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
        <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Gestión de eventos y congresos" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
        <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="resize-none" placeholder="Descripción breve del servicio..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Icono</label>
          <select value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
            {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Orden</label>
          <Input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={form.active} onCheckedChange={(v) => setForm(f => ({ ...f, active: v }))} />
        <label className="text-sm text-gray-700">Visible en la web pública</label>
      </div>
    </div>
  );
}

// ─── Gallery manager dialog ───────────────────────────────────────────────────
interface GalleryDialogProps {
  service: any;
  onClose: () => void;
}

function GalleryDialog({ service, onClose }: GalleryDialogProps) {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<ServiceImage | null>(null);

  const images: ServiceImage[] = (service.images as ServiceImage[]) || [];

  const uploadMutation = trpc.webServices.uploadImage.useMutation({
    onSuccess: () => { utils.webServices.list.invalidate(); utils.public.getPublicServices.invalidate(); toast.success("Imagen subida"); },
    onError: (e) => toast.error(e.message || "Error al subir"),
    onSettled: () => setUploading(false),
  });

  const updateImagesMutation = trpc.webServices.updateImages.useMutation({
    onSuccess: () => { utils.webServices.list.invalidate(); utils.public.getPublicServices.invalidate(); toast.success("Galería actualizada"); },
    onError: () => toast.error("Error al actualizar"),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          await uploadMutation.mutateAsync({
            id: service.id,
            filename: file.name,
            mimeType: file.type,
            dataBase64: base64,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (key: string) => {
    const updated = images.filter((img) => img.key !== key);
    updateImagesMutation.mutate({ id: service.id, images: updated });
  };

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="w-4 h-4 text-orange-500" />
              Galería: {service.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload area */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all"
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-orange-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Subiendo imágenes...</span>
                </div>
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-orange-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Haz clic para subir imágenes</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Puedes seleccionar varias a la vez</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Grid of images */}
            {images.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.key} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={img.url}
                      alt={img.caption || ""}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => setLightbox(img)}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(img.key); }}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 py-4">No hay imágenes aún. Sube la primera.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.caption || ""}
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
              {lightbox.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WebServices() {
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.webServices.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [galleryService, setGalleryService] = useState<any | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const createMutation = trpc.webServices.create.useMutation({
    onSuccess: () => { utils.webServices.list.invalidate(); utils.public.getPublicServices.invalidate(); setShowCreate(false); setForm(emptyForm); toast.success("Servicio creado"); },
    onError: () => toast.error("Error al crear"),
  });
  const updateMutation = trpc.webServices.update.useMutation({
    onSuccess: () => { utils.webServices.list.invalidate(); utils.public.getPublicServices.invalidate(); setEditingId(null); toast.success("Servicio actualizado"); },
    onError: () => toast.error("Error al actualizar"),
  });
  const deleteMutation = trpc.webServices.delete.useMutation({
    onSuccess: () => { utils.webServices.list.invalidate(); utils.public.getPublicServices.invalidate(); toast.success("Servicio eliminado"); },
    onError: () => toast.error("Error al eliminar"),
  });

  const openEdit = (svc: any) => {
    setEditingId(svc.id);
    setForm({ name: svc.name, description: svc.description || "", icon: svc.icon || "Calendar", sortOrder: svc.sortOrder, active: svc.active });
  };

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    createMutation.mutate(form);
  };
  const handleUpdate = () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    updateMutation.mutate({ id: editingId!, ...form });
  };
  const handleDelete = (id: number, name: string) => {
    if (!confirm(`¿Eliminar el servicio "${name}"?`)) return;
    deleteMutation.mutate({ id });
  };

  // Sync gallery dialog with latest data
  const galleryServiceLive = galleryService ? services?.find((s) => s.id === galleryService.id) ?? galleryService : null;

  return (
    <AdminLayout title="Servicios web">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Servicios que se muestran en la <strong>vitrina pública</strong> de organizus.es.
            Independientes del catálogo de conceptos de facturación.
          </p>
          <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2">
            <Plus className="w-4 h-4" /> Nuevo servicio
          </Button>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Globe className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-800">
            Estos servicios aparecen en la sección <strong>"Nuestros servicios"</strong> de la web pública.
            Puedes añadir imágenes a cada servicio haciendo clic en el icono de galería.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : !services?.length ? (
          <div className="text-center py-16 text-gray-400">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay servicios web</p>
            <p className="text-sm mt-1">Crea el primero para mostrarlo en la web pública.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Descripción</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Imágenes</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map((svc) => {
                  const imgs = (svc.images as ServiceImage[]) || [];
                  return (
                    <tr key={svc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{svc.name}</td>
                      <td className="px-6 py-4 text-gray-500 hidden md:table-cell max-w-xs truncate">{svc.description || "—"}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setGalleryService(svc)}
                          className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-500 transition-colors group"
                        >
                          {imgs.length > 0 ? (
                            <div className="flex -space-x-2">
                              {imgs.slice(0, 3).map((img, i) => (
                                <img key={i} src={img.url} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                              ))}
                            </div>
                          ) : (
                            <ImagePlus className="w-4 h-4 text-gray-300 group-hover:text-orange-400" />
                          )}
                          <span className="group-hover:underline">{imgs.length > 0 ? `${imgs.length} foto${imgs.length > 1 ? "s" : ""}` : "Añadir"}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${svc.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${svc.active ? "bg-green-500" : "bg-gray-400"}`} />
                          {svc.active ? "Visible" : "Oculto"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setGalleryService(svc)} className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors" title="Gestionar imágenes">
                            <Images className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openEdit(svc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(svc.id, svc.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo servicio web</DialogTitle></DialogHeader>
          <FormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creando..." : "Crear servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar servicio web</DialogTitle></DialogHeader>
          <FormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} className="bg-orange-500 hover:bg-orange-600 text-white" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery dialog */}
      {galleryServiceLive && (
        <GalleryDialog service={galleryServiceLive} onClose={() => setGalleryService(null)} />
      )}
    </AdminLayout>
  );
}
