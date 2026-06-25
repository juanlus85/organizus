import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Link2, GripVertical, X, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

interface LinkItem {
  title: string;
  url: string;
  active: boolean;
}

interface PageForm {
  slug: string;
  name: string;
  bio: string;
  photoUrl: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  active: boolean;
  links: LinkItem[];
}

const defaultForm: PageForm = {
  slug: "",
  name: "",
  bio: "",
  photoUrl: "",
  backgroundColor: "#ffffff",
  textColor: "#111111",
  accentColor: "#f97316",
  active: true,
  links: [],
};

export default function LinkPages() {
  const utils = trpc.useUtils();
  const { data: pages, isLoading } = trpc.linkPages.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [form, setForm] = useState<PageForm>(defaultForm);

  const createMutation = trpc.linkPages.create.useMutation({
    onSuccess: () => { utils.linkPages.list.invalidate(); toast.success("Página creada"); setShowCreate(false); setForm(defaultForm); },
    onError: (e) => toast.error(e.message || "Error al crear"),
  });

  const updateMutation = trpc.linkPages.update.useMutation({
    onSuccess: () => { utils.linkPages.list.invalidate(); toast.success("Página actualizada"); setEditingPage(null); },
    onError: (e) => toast.error(e.message || "Error al actualizar"),
  });

  const deleteMutation = trpc.linkPages.delete.useMutation({
    onSuccess: () => { utils.linkPages.list.invalidate(); toast.success("Página eliminada"); },
  });

  const openCreate = () => { setForm(defaultForm); setShowCreate(true); };
  const openEdit = (page: any) => {
    setEditingPage(page);
    setForm({
      slug: page.slug,
      name: page.name,
      bio: page.bio || "",
      photoUrl: page.photoUrl || "",
      backgroundColor: page.backgroundColor || "#ffffff",
      textColor: page.textColor || "#111111",
      accentColor: page.accentColor || "#f97316",
      active: page.active,
      links: (page.links as LinkItem[]) || [],
    });
  };

  const addLink = () => setForm((f) => ({ ...f, links: [...f.links, { title: "", url: "", active: true }] }));
  const removeLink = (i: number) => setForm((f) => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }));
  const updateLink = (i: number, field: keyof LinkItem, value: any) => {
    setForm((f) => {
      const links = [...f.links];
      links[i] = { ...links[i], [field]: value };
      return { ...f, links };
    });
  };

  const handleSave = () => {
    if (!form.slug.trim()) { toast.error("El slug es requerido"); return; }
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    if (!/^[a-z0-9-]+$/.test(form.slug)) { toast.error("El slug solo puede contener letras minúsculas, números y guiones"); return; }

    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const PageForm = () => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Slug (URL) *</label>
          <Input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
            placeholder="mi-pagina"
            disabled={!!editingPage}
          />
          <p className="text-xs text-gray-400 mt-1">organizus.es/{form.slug || "mi-pagina"}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre *</label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tu nombre" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Biografía / Descripción</label>
        <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={2} className="resize-none" placeholder="Una breve descripción..." />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">URL de foto de perfil</label>
        <Input value={form.photoUrl} onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Fondo</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.backgroundColor} onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
            <Input value={form.backgroundColor} onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))} className="text-xs" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Texto</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.textColor} onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
            <Input value={form.textColor} onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))} className="text-xs" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Acento</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.accentColor} onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
            <Input value={form.accentColor} onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))} className="text-xs" />
          </div>
        </div>
      </div>

      {/* Links */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">Enlaces</label>
          <Button size="sm" variant="outline" onClick={addLink} className="text-xs gap-1 h-7">
            <Plus className="w-3 h-3" /> Añadir enlace
          </Button>
        </div>
        <div className="space-y-2">
          {form.links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input value={link.title} onChange={(e) => updateLink(i, "title", e.target.value)} placeholder="Título" className="text-xs h-8" />
                <Input value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} placeholder="https://..." className="text-xs h-8" />
              </div>
              <button
                onClick={() => updateLink(i, "active", !link.active)}
                className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${link.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
              >
                {link.active ? "On" : "Off"}
              </button>
              <Button size="sm" variant="ghost" onClick={() => removeLink(i)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {form.links.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">No hay enlaces. Añade el primero.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Link Pages">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Crea páginas de enlaces personalizadas accesibles en organizus.es/slug.</p>
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
              return (
                <div key={page.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-orange-200 hover:shadow-md transition-all">
                  {/* Preview header */}
                  <div
                    className="h-20 flex items-center justify-center"
                    style={{ backgroundColor: page.backgroundColor || "#f9fafb" }}
                  >
                    {page.photoUrl ? (
                      <img src={page.photoUrl} alt={page.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: page.accentColor || "#f97316" }}
                      >
                        {page.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{page.name}</h3>
                        <p className="text-xs text-gray-400">/{page.slug}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${page.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {page.active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{page.bio || "Sin descripción"}</p>
                    <p className="text-xs text-gray-400 mb-4">{links.filter((l) => l.active).length} enlace(s) activo(s)</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(page)} className="flex-1 gap-1 text-xs">
                        <Pencil className="w-3 h-3" /> Editar
                      </Button>
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { if (confirm("¿Eliminar esta página?")) deleteMutation.mutate({ id: page.id }); }}
                        className="text-gray-400 hover:text-red-500 w-8 p-0"
                      >
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
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva link page</DialogTitle></DialogHeader>
          <PageForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
              {createMutation.isPending ? "Creando..." : "Crear página"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingPage} onOpenChange={(o) => !o && setEditingPage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar: {editingPage?.name}</DialogTitle></DialogHeader>
          <PageForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
