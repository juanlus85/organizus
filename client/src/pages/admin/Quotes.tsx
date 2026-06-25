import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Plus, FileText, ArrowLeft, Receipt } from "lucide-react";
import { toast } from "sonner";
import DocumentEditor from "./DocumentEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  invoiced: "bg-purple-100 text-purple-700",
};
const statusLabels: Record<string, string> = {
  draft: "Borrador", sent: "Enviado", accepted: "Aceptado",
  rejected: "Rechazado", invoiced: "Facturado",
};

export function QuoteList() {
  const { data: quotes, isLoading } = trpc.quotes.list.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.quotes.update.useMutation({
    onSuccess: () => utils.quotes.list.invalidate(),
  });

  return (
    <AdminLayout title="Presupuestos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Gestiona los presupuestos de OrganizUS.</p>
          <Link href="/admin/presupuestos/nuevo">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full gap-2">
              <Plus className="w-4 h-4" /> Nuevo presupuesto
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : quotes?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay presupuestos</p>
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
                {quotes?.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/presupuestos/${q.id}`}>
                        <span className="text-sm font-bold text-orange-600 hover:underline cursor-pointer">{q.number}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{q.clientName}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{new Date(q.date).toLocaleDateString("es-ES")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={q.status}
                        onValueChange={(v) => updateStatus.mutate({ id: q.id, status: v as any })}
                      >
                        <SelectTrigger className={`h-7 text-xs w-32 border-0 ${statusColors[q.status]}`}>
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
                      <span className="text-sm font-bold text-gray-800">{parseFloat(q.total as string).toFixed(2)}€</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/presupuestos/${q.id}`}>
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

export function QuoteNew() {
  const [, navigate] = useLocation();
  const createQuote = trpc.quotes.create.useMutation();
  const generatePdf = trpc.quotes.generatePdf.useMutation();

  const handleSave = async (data: any) => {
    const result = await createQuote.mutateAsync(data);
    navigate(`/admin/presupuestos/${result.id}`);
    return result;
  };

  return (
    <AdminLayout title="Nuevo presupuesto">
      <div className="space-y-4">
        <Link href="/admin/presupuestos">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </Link>
        <DocumentEditor
          type="quote"
          onSave={handleSave}
          isSaving={createQuote.isPending}
        />
      </div>
    </AdminLayout>
  );
}

export function QuoteDetail({ id }: { id: number }) {
  const utils = trpc.useUtils();
  const { data: quote, isLoading } = trpc.quotes.getById.useQuery({ id });
  const updateQuote = trpc.quotes.update.useMutation({
    onSuccess: () => utils.quotes.getById.invalidate({ id }),
  });
  const generatePdf = trpc.quotes.generatePdf.useMutation();
  const createInvoiceFromQuote = trpc.invoices.createFromQuote.useMutation({
    onSuccess: (result) => {
      toast.success(`Factura ${result.number} creada`);
    },
  });
  const [, navigate] = useLocation();

  if (isLoading) return <AdminLayout title="Presupuesto"><div className="text-center py-12 text-gray-400">Cargando...</div></AdminLayout>;
  if (!quote) return <AdminLayout title="Presupuesto"><div className="text-center py-12 text-gray-400">No encontrado</div></AdminLayout>;

  const handleSave = async (data: any) => {
    await updateQuote.mutateAsync({ id, ...data });
    return { id, number: quote.quote.number };
  };

  const handleGeneratePdf = async (docId: number) => {
    const result = await generatePdf.mutateAsync({ id: docId });
    return result;
  };

  const q = quote.quote;
  const items = (quote.items as any[]) || [];

  return (
    <AdminLayout title={`Presupuesto ${q.number}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/admin/presupuestos">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>
          </Link>
          {q.status !== "invoiced" && (
            <Button
              onClick={() => createInvoiceFromQuote.mutateAsync({ quoteId: id }).then((r) => navigate(`/admin/facturas/${r.id}`))}
              disabled={createInvoiceFromQuote.isPending}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white rounded-full"
            >
              <Receipt className="w-4 h-4" />
              Crear factura
            </Button>
          )}
        </div>
        <DocumentEditor
          type="quote"
          documentId={id}
          documentNumber={q.number}
          initialData={{
            clientName: q.clientName,
            clientTaxId: q.clientTaxId || "",
            clientAddress: q.clientAddress || "",
            clientCity: q.clientCity || "",
            clientPostalCode: q.clientPostalCode || "",
            clientCountry: q.clientCountry || "España",
            clientEmail: q.clientEmail || "",
            clientExtra: q.clientExtra || "",
            date: new Date(q.date).toISOString().split("T")[0],
            validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split("T")[0] : "",
            notes: q.notes || "",
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
          isSaving={updateQuote.isPending}
        />
      </div>
    </AdminLayout>
  );
}
