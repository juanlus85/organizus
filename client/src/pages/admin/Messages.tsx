import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Mail, Phone, Check, Trash2 } from "lucide-react";

export default function Messages() {
  const utils = trpc.useUtils();
  const { data: messages, isLoading } = trpc.admin.getContactMessages.useQuery();
  const markRead = trpc.admin.markMessageRead.useMutation({
    onSuccess: () => utils.admin.getContactMessages.invalidate(),
  });
  const deleteMsg = trpc.admin.deleteMessage.useMutation({
    onSuccess: () => { utils.admin.getContactMessages.invalidate(); toast.success("Mensaje eliminado"); },
  });

  return (
    <AdminLayout title="Mensajes de contacto">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Mensajes recibidos desde el formulario de contacto de la web.</p>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay mensajes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl border p-5 transition-all ${msg.read ? "border-gray-100" : "border-orange-200 shadow-sm shadow-orange-50"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${msg.read ? "bg-gray-300" : "bg-orange-500"}`} />
                      <h3 className="font-bold text-gray-900 truncate">{msg.name}</h3>
                      {msg.subject && <span className="text-xs text-gray-400 truncate">— {msg.subject}</span>}
                      <span className="text-xs text-gray-400 ml-auto shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <a href={`mailto:${msg.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <Mail className="w-3 h-3" /> {msg.email}
                      </a>
                      {msg.phone && (
                        <a href={`tel:${msg.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:underline">
                          <Phone className="w-3 h-3" /> {msg.phone}
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {!msg.read && (
                      <Button size="sm" variant="outline" onClick={() => markRead.mutate({ id: msg.id })} className="gap-1 text-xs h-8">
                        <Check className="w-3 h-3" /> Leído
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { if (confirm("¿Eliminar este mensaje?")) deleteMsg.mutate({ id: msg.id }); }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
