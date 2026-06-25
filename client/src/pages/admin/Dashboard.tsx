import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { FileText, Receipt, Briefcase, Link2, MessageSquare, Users, ArrowRight, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: quotes } = trpc.quotes.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: services } = trpc.services.list.useQuery();
  const { data: linkPages } = trpc.linkPages.list.useQuery();
  const { data: messages } = trpc.admin.getContactMessages.useQuery();

  const unreadMessages = messages?.filter((m) => !m.read).length || 0;
  const pendingQuotes = quotes?.filter((q) => q.status === "draft" || q.status === "sent").length || 0;
  const unpaidInvoices = invoices?.filter((i) => i.status === "sent" || i.status === "overdue").length || 0;

  const stats = [
    { label: "Presupuestos", value: quotes?.length || 0, sub: `${pendingQuotes} pendientes`, icon: FileText, href: "/admin/presupuestos", color: "bg-blue-50 text-blue-600" },
    { label: "Facturas", value: invoices?.length || 0, sub: `${unpaidInvoices} sin cobrar`, icon: Receipt, href: "/admin/facturas", color: "bg-green-50 text-green-600" },
    { label: "Servicios", value: services?.length || 0, sub: "en catálogo", icon: Briefcase, href: "/admin/servicios", color: "bg-orange-50 text-orange-600" },
    { label: "Link Pages", value: linkPages?.length || 0, sub: "páginas activas", icon: Link2, href: "/admin/linkpages", color: "bg-purple-50 text-purple-600" },
    { label: "Mensajes", value: messages?.length || 0, sub: `${unreadMessages} sin leer`, icon: MessageSquare, href: "/admin/mensajes", color: "bg-red-50 text-red-600" },
  ];

  const recentQuotes = quotes?.slice(0, 5) || [];
  const recentInvoices = invoices?.slice(0, 5) || [];

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    invoiced: "bg-purple-100 text-purple-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  const statusLabels: Record<string, string> = {
    draft: "Borrador",
    sent: "Enviado",
    accepted: "Aceptado",
    rejected: "Rechazado",
    invoiced: "Facturado",
    paid: "Pagado",
    overdue: "Vencido",
    cancelled: "Cancelado",
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <Link key={stat.href} href={stat.href}>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quotes */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Últimos presupuestos
              </h2>
              <Link href="/admin/presupuestos">
                <span className="text-xs text-orange-500 hover:underline flex items-center gap-1 cursor-pointer">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentQuotes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No hay presupuestos</p>
              ) : recentQuotes.map((q) => (
                <Link key={q.id} href={`/admin/presupuestos/${q.id}`}>
                  <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{q.number}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{q.clientName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[q.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[q.status] || q.status}
                      </span>
                      <span className="text-sm font-bold text-gray-700">{parseFloat(q.total as string).toFixed(2)}€</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-green-500" />
                Últimas facturas
              </h2>
              <Link href="/admin/facturas">
                <span className="text-xs text-orange-500 hover:underline flex items-center gap-1 cursor-pointer">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No hay facturas</p>
              ) : recentInvoices.map((inv) => (
                <Link key={inv.id} href={`/admin/facturas/${inv.id}`}>
                  <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{inv.number}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{inv.clientName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[inv.status] || inv.status}
                      </span>
                      <span className="text-sm font-bold text-gray-700">{parseFloat(inv.total as string).toFixed(2)}€</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Unread messages */}
        {unreadMessages > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-orange-900">Tienes {unreadMessages} mensaje{unreadMessages > 1 ? "s" : ""} sin leer</p>
                <p className="text-xs text-orange-600">Del formulario de contacto de la web</p>
              </div>
            </div>
            <Link href="/admin/mensajes">
              <button className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                Ver mensajes <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
