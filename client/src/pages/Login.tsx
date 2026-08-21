import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { Loader2, LockKeyhole } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se ha podido iniciar sesión.");
      window.location.assign("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700">
          organiz<span className="text-slate-900">US</span>
        </Link>
        <div className="mt-8 mb-7">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Acceso al panel</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Introduce las credenciales de administración configuradas en el servidor.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Correo electrónico
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Contraseña
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Accediendo..." : "Acceder al panel"}
          </button>
        </form>
      </section>
    </main>
  );
}
