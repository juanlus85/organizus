import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { ExternalLink, Loader2 } from "lucide-react";

export default function LinkPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: page, isLoading, error } = trpc.public.getLinkPage.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Página no encontrada</h1>
        <p className="text-gray-500">La página que buscas no existe o no está disponible.</p>
        <a href="/" className="mt-6 text-orange-500 hover:underline text-sm">Volver a OrganizUS</a>
      </div>
    );
  }

  const links = (page.links as Array<{ title: string; url: string; icon?: string; active: boolean }>) || [];
  const activeLinks = links.filter((l) => l.active);

  const bg = page.backgroundColor || "#ffffff";
  const textColor = page.textColor || "#000000";
  const accent = page.accentColor || "#f97316";

  return (
    <div
      className="min-h-screen flex flex-col items-center py-16 px-4"
      style={{ backgroundColor: bg, color: textColor }}
    >
      <div className="w-full max-w-sm">
        {/* Profile */}
        <div className="text-center mb-8">
          {page.photoUrl ? (
            <img
              src={page.photoUrl}
              alt={page.name}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-lg ring-4"
              style={{ outline: `3px solid ${accent}`, outlineOffset: '2px' }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold shadow-lg"
              style={{ backgroundColor: accent, color: "#fff" }}
            >
              {page.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2" style={{ color: textColor }}>{page.name}</h1>
          {page.bio && (
            <p className="text-sm leading-relaxed opacity-75" style={{ color: textColor }}>{page.bio}</p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {activeLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              style={{
                backgroundColor: accent,
                color: "#fff",
              }}
            >
              <span>{link.title}</span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <a
            href="https://organizus.es"
            className="text-xs opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: textColor }}
          >
            Creado con OrganizUS
          </a>
        </div>
      </div>
    </div>
  );
}
