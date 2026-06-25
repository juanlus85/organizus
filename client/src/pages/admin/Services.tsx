import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Briefcase, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Precio debe ser positivo"),
  ivaRate: z.coerce.number().int().min(0).max(100),
  active: z.boolean().default(true),
});

type ServiceForm = z.infer<typeof serviceSchema>;

export default function Services() {
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.services.list.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      toast.success("Servicio creado");
      setShowCreate(false);
      reset();
    },
    onError: () => toast.error("Error al crear servicio"),
  });

  const updateMutation = trpc.services.update.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      toast.success("Servicio actualizado");
      setEditingId(null);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = trpc.services.delete.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      toast.success("Servicio eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { ivaRate: 21, active: true, price: 0 },
  });

  const editForm = useForm({ resolver: zodResolver(serviceSchema), defaultValues: { ivaRate: 21, active: true, price: 0 } });

  const onCreateSubmit = (data: any) => createMutation.mutate(data as ServiceForm);

  const startEdit = (service: any) => {
    setEditingId(service.id);
    editForm.reset({
      name: service.name,
      description: service.description || "",
      price: parseFloat(service.price),
      ivaRate: service.ivaRate,
      active: service.active,
    });
  };

  const onEditSubmit = (data: any) => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, ...data });
  };

  return (
    <AdminLayout title="Catálogo de servicios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Gestiona los servicios disponibles para añadir a presupuestos y facturas.</p>
          <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2">
            <Plus className="w-4 h-4" /> Nuevo servicio
          </Button>
        </div>

        {/* Services list */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : services?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay servicios</p>
            <p className="text-sm text-gray-400 mt-1">Crea tu primer servicio para empezar</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Descripción</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Precio</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">IVA</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services?.map((service) => (
                  editingId === service.id ? (
                    <tr key={service.id} className="bg-orange-50/30">
                      <td className="px-6 py-3" colSpan={6}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                            <Input {...editForm.register("name")} className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Precio (€)</label>
                            <Input {...editForm.register("price")} type="number" step="0.01" className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">IVA (%)</label>
                            <Input {...editForm.register("ivaRate")} type="number" className="text-sm" />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600 text-white flex-1">
                              <Check className="w-3 h-3 mr-1" /> Guardar
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="col-span-2 md:col-span-4">
                            <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                            <Input {...editForm.register("description")} className="text-sm" />
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-800">{service.name}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-gray-500 truncate max-w-xs">{service.description || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-800">{parseFloat(service.price as string).toFixed(2)}€</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{service.ivaRate}%</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => updateMutation.mutate({ id: service.id, active: !service.active })}
                          className="transition-colors"
                        >
                          {service.active
                            ? <ToggleRight className="w-5 h-5 text-green-500" />
                            : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(service)} className="h-8 w-8 p-0 text-gray-400 hover:text-orange-500">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("¿Eliminar este servicio?")) deleteMutation.mutate({ id: service.id });
                            }}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo servicio</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onCreateSubmit)(e); }} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
              <Input {...register("name")} placeholder="Nombre del servicio" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
              <Textarea {...register("description")} placeholder="Descripción del servicio" rows={3} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Precio (€)</label>
                <Input {...register("price")} type="number" step="0.01" placeholder="0.00" />
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">IVA (%)</label>
                <Input {...register("ivaRate")} type="number" placeholder="21" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset(); }}>Cancelar</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear servicio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
