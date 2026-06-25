import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Plus, Receipt, ArrowLeft } from "lucide-react";
import DocumentEditor from "./DocumentEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};
const statusLabels: Record<string, string> = {
  draft: "Borrador", sent: "Enviada", paid: "Pagada",
  overdue: "Vencida", cancelled: "Cancelada",
};

export function InvoiceList() {
  const { data: invoices, isLoading } = trpc.invoices.list.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.invoices.update.useMutation({
    onSuccess: () => utils.invoices.list.invalidate(),
  });

  return (
    <AdminLayout title="Facturas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Gestiona las facturas de OrganizUS.</p>
          <Link href="/admin/facturas/nueva">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2">
              <Plus className="w-4 h-4" /> Nueva factura
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : invoices?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay facturas</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices?.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/facturas/${inv.id}`}>
                        <span className="text-sm font-bold text-orange-600 hover:underline cursor-pointer">{inv.number}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{inv.clientName}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{new Date(inv.date).toLocaleDateString("es-ES")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={inv.status}
                        onValueChange={(v) => updateStatus.mutate({ id: inv.id, status: v as any })}
                      >
                        <SelectTrigger className={`h-7 text-xs w-32 border-0 ${statusColors[inv.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-800">{parseFloat(inv.total as string).toFixed(2)}€</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/facturas/${inv.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs text-orange-500 hover:text-orange-600">
                          Editar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export function InvoiceNew() {
  const [, navigate] = useLocation();
  const createInvoice = trpc.invoices.create.useMutation();
  const generatePdf = trpc.invoices.generatePdf.useMutation();

  const handleSave = async (data: any) => {
    const result = await createInvoice.mutateAsync(data);
    navigate(`/admin/facturas/${result.id}`);
    return result;
  };

  return (
    <AdminLayout title="Nueva factura">
      <div className="space-y-4">
        <Link href="/admin/facturas">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </Link>
        <DocumentEditor
          type="invoice"
          onSave={handleSave}
          isSaving={createInvoice.isPending}
        />
      </div>
    </AdminLayout>
  );
}

export function InvoiceDetail({ id }: { id: number }) {
  const utils = trpc.useUtils();
  const { data: invoice, isLoading } = trpc.invoices.getById.useQuery({ id });
  const updateInvoice = trpc.invoices.update.useMutation({
    onSuccess: () => utils.invoices.getById.invalidate({ id }),
  });
  const generatePdf = trpc.invoices.generatePdf.useMutation();

  if (isLoading) return <AdminLayout title="Factura"><div className="text-center py-12 text-gray-400">Cargando...</div></AdminLayout>;
  if (!invoice) return <AdminLayout title="Factura"><div className="text-center py-12 text-gray-400">No encontrada</div></AdminLayout>;

  const inv = invoice.invoice;
  const items = (invoice.items as any[]) || [];

  const handleSave = async (data: any) => {
    await updateInvoice.mutateAsync({ id, ...data });
    return { id, number: inv.number };
  };

  const handleGeneratePdf = async (docId: number) => {
    const result = await generatePdf.mutateAsync({ id: docId });
    return result;
  };

  return (
    <AdminLayout title={`Factura ${inv.number}`}>
      <div className="space-y-4">
        <Link href="/admin/facturas">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </Link>
        <DocumentEditor
          type="invoice"
          documentId={id}
          documentNumber={inv.number}
          initialData={{
            clientName: inv.clientName,
            clientTaxId: inv.clientTaxId || "",
            clientAddress: inv.clientAddress || "",
            clientCity: inv.clientCity || "",
            clientPostalCode: inv.clientPostalCode || "",
            clientCountry: inv.clientCountry || "España",
            clientEmail: inv.clientEmail || "",
            date: new Date(inv.date).toISOString().split("T")[0],
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "",
            notes: inv.notes || "",
            paymentMethod: inv.paymentMethod || "",
            items: items.map((item: any) => ({
              serviceId: item.serviceId,
              quantity: parseFloat(item.quantity),
              description: item.description,
              unitPrice: parseFloat(item.unitPrice),
              ivaRate: item.ivaRate,
            })),
          }}
          onSave={handleSave}
          onGeneratePdf={handleGeneratePdf}
          isSaving={updateInvoice.isPending}
        />
      </div>
    </AdminLayout>
  );
}
