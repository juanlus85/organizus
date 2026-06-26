import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const ICON_OPTIONS = [
  "Calendar", "Users", "Monitor", "BookOpen", "Briefcase", "Globe",
  "Star", "Zap", "Heart", "Award", "Target", "Layers", "Settings",
  "MessageSquare", "Camera", "Music", "Map", "Coffee", "Smile",
];

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
        <Input
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Gestión de eventos y congresos"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          className="resize-none"
          placeholder="Descripción breve del servicio..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Icono</label>
          <select
            value={form.icon}
            onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            {ICON_OPTIONS.map(icon => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Orden</label>
          <Input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={form.active} onCheckedChange={(v) => setForm(f => ({ ...f, active: v }))} />
        <label className="text-sm text-gray-700">Visible en la web pública</label>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WebServices() {
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.webServices.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const createMutation = trpc.webServices.create.useMutation({
    onSuccess: () => {
      utils.webServices.list.invalidate();
      utils.public.getPublicServices.invalidate();
      setShowCreate(false);
      setForm(emptyForm);
      toast.success("Servicio creado");
    },
    onError: () => toast.error("Error al crear"),
  });

  const updateMutation = trpc.webServices.update.useMutation({
    onSuccess: () => {
      utils.webServices.list.invalidate();
      utils.public.getPublicServices.invalidate();
      setEditingId(null);
      toast.success("Servicio actualizado");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = trpc.webServices.delete.useMutation({
    onSuccess: () => {
      utils.webServices.list.invalidate();
      utils.public.getPublicServices.invalidate();
      toast.success("Servicio eliminado");
    },
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

  return (
    <AdminLayout title="Servicios web">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Servicios que se muestran en la <strong>vitrina pública</strong> de organizus.es.
            Independientes del catálogo de conceptos de facturación.
          </p>
          <Button
            onClick={() => { setForm(emptyForm); setShowCreate(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo servicio
          </Button>
        </div>

        {/* Info banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Globe className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-800">
            Estos servicios aparecen en la sección <strong>"Nuestros servicios"</strong> de la web pública.
            Para gestionar los conceptos que usas en presupuestos y facturas, ve a <strong>Conceptos</strong> en el menú.
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Icono</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Orden</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{svc.name}</td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell max-w-xs truncate">{svc.description || "—"}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{svc.icon}</td>
                    <td className="px-6 py-4 text-gray-500">{svc.sortOrder}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${svc.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${svc.active ? "bg-green-500" : "bg-gray-400"}`} />
                        {svc.active ? "Visible" : "Oculto"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(svc)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id, svc.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
            <Button
              onClick={handleCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={createMutation.isPending}
            >
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
            <Button
              onClick={handleUpdate}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
