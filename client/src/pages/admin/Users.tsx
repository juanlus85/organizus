import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users as UsersIcon, Shield, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Users() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.getUsers.useQuery();
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { utils.admin.getUsers.invalidate(); toast.success("Rol actualizado"); },
    onError: () => toast.error("Error al actualizar rol"),
  });

  return (
    <AdminLayout title="Gestión de usuarios">
      <div className="space-y-6">
        <p className="text-sm text-gray-500">Listado de usuarios registrados en OrganizUS.</p>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : users?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay usuarios</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Último acceso</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{user.name || "Sin nombre"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-500">{user.email || "—"}</p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-sm text-gray-500">
                        {new Date(user.lastSignedIn).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={user.role}
                        onValueChange={(v) => updateRole.mutate({ userId: user.id, role: v as "admin" | "user" })}
                      >
                        <SelectTrigger className={`h-7 text-xs w-28 border-0 ${user.role === "admin" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center gap-1"><User className="w-3 h-3" /> Usuario</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
