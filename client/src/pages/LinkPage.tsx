import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { ExternalLink, Loader2 } from "lucide-react";

const FONT_MAP: Record<string, string> = {
  inter: "'Inter', sans-serif",
  poppins: "'Poppins', sans-serif",
  playfair: "'Playfair Display', serif",
  mono: "'JetBrains Mono', monospace",
};

const FONT_LINKS: Record<string, string> = {
  poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap",
  playfair: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap",
  mono: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap",
};

type PublicLink = { title: string; url: string; icon?: string; active: boolean };

function normalizeLinks(value: unknown): PublicLink[] {
  if (typeof value === "string") {
    try {
      return normalizeLinks(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "",
      url: typeof item.url === "string" ? item.url : "",
      icon: typeof item.icon === "string" ? item.icon : undefined,
      active: item.active !== false,
    }));
}

export default function LinkPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: page, isLoading, error } = trpc.public.getLinkPage.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }}>
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

  const links = normalizeLinks(page.links);
  const activeLinks = links.filter((l) => l.active);

  const bg = (page as any).backgroundType === "gradient" && (page as any).backgroundGradient
    ? (page as any).backgroundGradient
    : page.backgroundColor || "#0f172a";

  const textColor = page.textColor || "#ffffff";
  const accent = page.accentColor || "#f97316";
  const buttonStyle = (page as any).buttonStyle || "rounded";
  const buttonBg = (page as any).buttonBg || accent;
  const buttonTextColor = (page as any).buttonTextColor || "#ffffff";
  const fontFamily = (page as any).fontFamily || "inter";
  const photoSize = (page as any).photoSize || "md";
  const photoShape = (page as any).photoShape || "circle";
  const showBranding = (page as any).showBranding !== false;

  const sizeMap: Record<string, string> = { sm: "80px", md: "112px", lg: "144px", xl: "176px" };
  const photoSizePx = sizeMap[photoSize] || "112px";
  const photoRadius = photoShape === "circle" ? "9999px" : photoShape === "rounded" ? "20px" : "8px";
  const fontCss = FONT_MAP[fontFamily] || FONT_MAP.inter;
  const fontLink = FONT_LINKS[fontFamily];

  const getButtonStyle = (): React.CSSProperties => {
    if (buttonStyle === "outline") return { border: `2px solid ${buttonBg}`, color: buttonBg, backgroundColor: "transparent" };
    if (buttonStyle === "glass") return { backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", color: buttonTextColor };
    return { backgroundColor: buttonBg, color: buttonTextColor };
  };

  const getButtonClass = () => {
    const base = "flex items-center justify-between w-full px-5 py-3.5 font-semibold text-sm transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] no-underline";
    if (buttonStyle === "pill") return `${base} rounded-full`;
    if (buttonStyle === "square") return `${base} rounded-none`;
    if (buttonStyle === "shadow") return `${base} rounded-xl shadow-xl hover:shadow-2xl`;
    if (buttonStyle === "glass") return `${base} rounded-xl`;
    if (buttonStyle === "outline") return `${base} rounded-xl`;
    return `${base} rounded-xl`;
  };

  return (
    <>
      {/* Load font if needed */}
      {fontLink && (
        <link rel="stylesheet" href={fontLink} />
      )}

      <div
        className="min-h-screen flex flex-col items-center py-16 px-4"
        style={{ background: bg, fontFamily: fontCss, color: textColor }}
      >
        <div className="w-full max-w-sm">

          {/* ── Profile ── */}
          <div className="text-center mb-8">
            {page.photoUrl ? (
              <img
                src={page.photoUrl}
                alt={page.name}
                style={{
                  width: photoSizePx,
                  height: photoSizePx,
                  borderRadius: photoRadius,
                  objectFit: "cover",
                  margin: "0 auto 1rem",
                  display: "block",
                  border: `3px solid ${accent}`,
                  boxShadow: `0 0 0 6px ${accent}22, 0 20px 40px rgba(0,0,0,0.4)`,
                }}
              />
            ) : (
              <div
                style={{
                  width: photoSizePx,
                  height: photoSizePx,
                  borderRadius: photoRadius,
                  backgroundColor: accent,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  margin: "0 auto 1rem",
                  boxShadow: `0 0 0 6px ${accent}22, 0 20px 40px rgba(0,0,0,0.4)`,
                }}
              >
                {page.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-bold mb-2" style={{ color: textColor, fontFamily: fontCss }}>
              {page.name}
            </h1>
            {page.bio && (
              <p
                className="text-sm leading-relaxed max-w-xs mx-auto"
                style={{ color: textColor, opacity: 0.75, fontFamily: fontCss }}
              >
                {page.bio}
              </p>
            )}
          </div>

          {/* ── Links ── */}
          <div className="space-y-3">
            {activeLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={getButtonClass()}
                style={getButtonStyle()}
              >
                <span style={{ fontFamily: fontCss }}>{link.title}</span>
                <ExternalLink className="w-4 h-4 opacity-60 shrink-0" />
              </a>
            ))}
            {activeLinks.length === 0 && (
              <p className="text-center text-sm opacity-40 py-8" style={{ color: textColor }}>
                No hay enlaces disponibles.
              </p>
            )}
          </div>

          {/* ── Branding ── */}
          {showBranding && (
            <div className="mt-12 text-center">
              <a
                href="https://organizus.es"
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: textColor, opacity: 0.35, fontFamily: fontCss }}
              >
                Creado con <strong>OrganizUS</strong>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
