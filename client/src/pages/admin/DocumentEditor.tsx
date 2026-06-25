/**
 * Shared document editor for Quotes and Invoices
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Download, Printer } from "lucide-react";
import { toast } from "sonner";

export interface DocumentItem {
  serviceId?: number;
  quantity: number;
  description: string;
  unitPrice: number;
  ivaRate: number;
}

interface DocumentEditorProps {
  type: "quote" | "invoice";
  initialData?: {
    clientName?: string;
    clientTaxId?: string;
    clientAddress?: string;
    clientCity?: string;
    clientPostalCode?: string;
    clientCountry?: string;
    clientEmail?: string;
    clientExtra?: string;
    date?: string;
    validUntil?: string;
    dueDate?: string;
    notes?: string;
    paymentMethod?: string;
    items?: DocumentItem[];
  };
  onSave: (data: any) => Promise<{ id: number; number: string }>;
  onGeneratePdf?: (id: number) => Promise<{ html: string; url?: string; key?: string; isPdfFallback?: boolean }>;
  isSaving?: boolean;
  documentNumber?: string;
  documentId?: number;
}

const IVA_RATES = [0, 4, 10, 21];

function computeItem(item: DocumentItem) {
  const base = item.quantity * item.unitPrice;
  const iva = base * item.ivaRate / 100;
  return { base, iva, total: base + iva };
}

export default function DocumentEditor({
  type,
  initialData,
  onSave,
  onGeneratePdf,
  isSaving,
  documentNumber,
  documentId,
}: DocumentEditorProps) {
  const { data: services } = trpc.services.list.useQuery();

  const [clientName, setClientName] = useState(initialData?.clientName || "");
  const [clientTaxId, setClientTaxId] = useState(initialData?.clientTaxId || "");
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress || "");
  const [clientCity, setClientCity] = useState(initialData?.clientCity || "");
  const [clientPostalCode, setClientPostalCode] = useState(initialData?.clientPostalCode || "");
  const [clientCountry, setClientCountry] = useState(initialData?.clientCountry || "España");
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || "");
  const [clientExtra, setClientExtra] = useState(initialData?.clientExtra || "");
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(initialData?.validUntil || "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || "");
  const [items, setItems] = useState<DocumentItem[]>(
    initialData?.items || [{ quantity: 1, description: "", unitPrice: 0, ivaRate: 21 }]
  );
  const [savedId, setSavedId] = useState<number | undefined>(documentId);
  const [savedNumber, setSavedNumber] = useState<string | undefined>(documentNumber);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);

  const addItem = () => setItems([...items, { quantity: 1, description: "", unitPrice: 0, ivaRate: 21 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (i: number, field: keyof DocumentItem, value: any) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const selectService = (i: number, serviceId: number) => {
    const svc = services?.find((s) => s.id === serviceId);
    if (!svc) return;
    const updated = [...items];
    updated[i] = {
      ...updated[i],
      serviceId,
      description: svc.name + (svc.description ? `\n${svc.description}` : ""),
      unitPrice: parseFloat(svc.price as string),
      ivaRate: svc.ivaRate,
    };
    setItems(updated);
  };

  const subtotal = items.reduce((s, item) => s + computeItem(item).base, 0);
  const totalIva = items.reduce((s, item) => s + computeItem(item).iva, 0);
  const total = subtotal + totalIva;

  const handleSave = async () => {
    if (!clientName.trim()) { toast.error("El nombre del cliente es requerido"); return; }
    if (items.some((i) => !i.description.trim())) { toast.error("Todos los conceptos deben tener descripción"); return; }

    try {
      const result = await onSave({
        clientName, clientTaxId, clientAddress, clientCity, clientPostalCode,
        clientCountry, clientEmail, clientExtra, date,
        ...(type === "quote" ? { validUntil } : { dueDate, paymentMethod }),
        notes,
        items,
      });
      setSavedId(result.id);
      setSavedNumber(result.number);
      toast.success(`${type === "quote" ? "Presupuesto" : "Factura"} ${result.number} guardado`);
    } catch {
      toast.error("Error al guardar");
    }
  };

  const handleGeneratePdf = async () => {
    if (!savedId || !onGeneratePdf) return;
    setIsGenerating(true);
    try {
      const result = await onGeneratePdf(savedId);
      setPdfHtml(result.html);

      if (result.isPdfFallback) {
        // Fallback: open in new window for browser print
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(result.html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        }
        toast.success("PDF generado. Usa Ctrl+P para guardar como PDF.");
      } else {
        // Real PDF: download directly
        const docType = type === "quote" ? "Presupuesto" : "Factura";
        const fileName = `${docType}-${savedNumber || savedId}.pdf`;
        const a = document.createElement("a");
        a.href = result.url ?? "";
        a.download = fileName;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`PDF descargado: ${fileName}`);
      }
    } catch {
      toast.error("Error al generar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      {savedNumber && (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-orange-800">
            {type === "quote" ? "Presupuesto" : "Factura"} Nº {savedNumber}
          </span>
          {onGeneratePdf && savedId && (
            <Button
              size="sm"
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            >
              <Printer className="w-4 h-4" />
              {isGenerating ? "Generando..." : "Generar PDF"}
            </Button>
          )}
        </div>
      )}

      {/* Client data */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Datos del cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre / Razón social *</label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">CIF / NIF</label>
            <Input value={clientTaxId} onChange={(e) => setClientTaxId(e.target.value)} placeholder="B12345678" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Dirección</label>
            <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Calle, número, piso..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Ciudad</label>
            <Input value={clientCity} onChange={(e) => setClientCity(e.target.value)} placeholder="Ciudad" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Código postal</label>
            <Input value={clientPostalCode} onChange={(e) => setClientPostalCode(e.target.value)} placeholder="41001" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">País</label>
            <Input value={clientCountry} onChange={(e) => setClientCountry(e.target.value)} placeholder="España" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
            <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" placeholder="cliente@email.com" />
          </div>
          {type === "quote" && (
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Información adicional (BIP, facultad, etc.)</label>
              <Textarea value={clientExtra} onChange={(e) => setClientExtra(e.target.value)} rows={2} className="resize-none" placeholder="Información adicional del cliente..." />
            </div>
          )}
        </div>
      </div>

      {/* Document dates */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Fechas del documento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha *</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {type === "quote" ? (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Válido hasta</label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha de vencimiento</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Conceptos</h3>
          <Button size="sm" variant="outline" onClick={addItem} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Añadir línea
          </Button>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
            <div className="col-span-1">Cant.</div>
            <div className="col-span-4">Descripción</div>
            <div className="col-span-2">Servicio</div>
            <div className="col-span-2">Precio unit.</div>
            <div className="col-span-1">IVA</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item, i) => {
            const { base, iva, total: lineTotal } = computeItem(item);
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start p-2 rounded-xl bg-gray-50/50 border border-gray-100">
                <div className="col-span-12 md:col-span-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                    className="text-sm h-8"
                    placeholder="1"
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    className="text-sm resize-none min-h-[32px]"
                    rows={2}
                    placeholder="Descripción del concepto..."
                  />
                </div>
                <div className="col-span-12 md:col-span-2">
                  <Select onValueChange={(v) => selectService(i, parseInt(v))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Servicio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-12 md:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="text-sm h-8"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-12 md:col-span-1">
                  <Select
                    value={item.ivaRate.toString()}
                    onValueChange={(v) => updateItem(i, "ivaRate", parseInt(v))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IVA_RATES.map((r) => (
                        <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-11 md:col-span-1 flex items-center justify-end">
                  <span className="text-sm font-bold text-gray-800">{lineTotal.toFixed(2)}€</span>
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal (sin IVA)</span>
              <span className="font-medium">{subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA</span>
              <span className="font-medium">{totalIva.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes / Payment */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Notas / Observaciones</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none" placeholder="Notas adicionales..." />
          </div>
          {type === "invoice" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Forma de pago</label>
              <Textarea value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} rows={3} className="resize-none" placeholder="Transferencia bancaria a la finalización del servicio..." />
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-3">
        {onGeneratePdf && savedId && (
          <Button
            variant="outline"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            {isGenerating ? "Generando..." : "Generar PDF"}
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8"
        >
          {isSaving ? "Guardando..." : savedId ? "Actualizar" : `Crear ${type === "quote" ? "presupuesto" : "factura"}`}
        </Button>
      </div>
    </div>
  );
}
