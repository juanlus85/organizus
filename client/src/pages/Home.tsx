import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import {
  Mail, Phone, MapPin, Menu, X, ArrowRight, CheckCircle,
  Calendar, BookOpen, Laptop, Users, ChevronDown
} from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type ContactForm = z.infer<typeof contactSchema>;

const LOGO_URL = "/manus-storage/organizus-logo_0f569d60.png";

const serviceIcons: Record<string, React.ReactNode> = {
  default: <BookOpen className="w-6 h-6" />,
  eventos: <Calendar className="w-6 h-6" />,
  digital: <Laptop className="w-6 h-6" />,
  investigacion: <BookOpen className="w-6 h-6" />,
  usuarios: <Users className="w-6 h-6" />,
};

function getServiceIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("event") || lower.includes("congres")) return serviceIcons.eventos;
  if (lower.includes("digital") || lower.includes("web") || lower.includes("software")) return serviceIcons.digital;
  if (lower.includes("invest") || lower.includes("academ")) return serviceIcons.investigacion;
  return serviceIcons.default;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: content } = trpc.public.getSiteContent.useQuery();
  const { data: services } = trpc.public.getPublicServices.useQuery();
  const submitContact = trpc.public.submitContact.useMutation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      await submitContact.mutateAsync(data);
      setSubmitted(true);
      reset();
      toast.success("¡Mensaje enviado! Te contactaremos pronto.");
    } catch {
      toast.error("Error al enviar el mensaje. Inténtalo de nuevo.");
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const heroTitle = content?.["hero_title"] || "Soluciones integrales para la gestión de congresos, eventos e investigación";
  const heroSubtitle = content?.["hero_subtitle"] || "Apoyamos a empresas, universidades y grupos de investigación en la planificación, ejecución y digitalización de sus proyectos.";
  const aboutTitle = content?.["about_title"] || "Sobre OrganizUS";
  const aboutText = content?.["about_text"] || "";
  const contactEmail = content?.["contact_email"] || "hi@organizus.es";

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-center justify-between h-16">
            <img src={LOGO_URL} alt="OrganizUS" className="h-8 w-auto" />
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo("servicios")} className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Servicios</button>
              <button onClick={() => scrollTo("sobre-nosotros")} className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Sobre nosotros</button>
              <button onClick={() => scrollTo("contacto")} className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Contacto</button>
              <Link href="/admin">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
                  Panel Admin
                </Button>
              </Link>
            </div>
            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
            <button onClick={() => scrollTo("servicios")} className="text-sm font-medium text-gray-700 text-left">Servicios</button>
            <button onClick={() => scrollTo("sobre-nosotros")} className="text-sm font-medium text-gray-700 text-left">Sobre nosotros</button>
            <button onClick={() => scrollTo("contacto")} className="text-sm font-medium text-gray-700 text-left">Contacto</button>
            <Link href="/admin"><Button size="sm" className="bg-orange-500 text-white w-full">Panel Admin</Button></Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 pb-24 px-6 bg-gradient-to-br from-gray-50 via-white to-orange-50/30 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Gestión integral de proyectos
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-gray-900 mb-6">
              {heroTitle.split(" ").slice(0, 3).join(" ")}{" "}
              <span className="brand-gradient">{heroTitle.split(" ").slice(3).join(" ")}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => scrollTo("contacto")}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
              >
                Contáctanos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => scrollTo("servicios")}
                size="lg"
                variant="outline"
                className="rounded-full px-8 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Ver servicios <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="servicios" className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Nuestros servicios</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Soluciones adaptadas a las necesidades de organizaciones académicas y empresariales.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services && services.length > 0 ? services.map((service) => (
              <div
                key={service.id}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300 bg-white"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4 group-hover:bg-orange-100 transition-colors">
                  {getServiceIcon(service.name)}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-500 text-sm leading-relaxed">{service.description}</p>
                )}
              </div>
            )) : (
              // Fallback services
              [
                { icon: <Calendar className="w-6 h-6" />, title: "Gestión de eventos y congresos", desc: "Planificación y ejecución integral de eventos académicos y corporativos." },
                { icon: <Laptop className="w-6 h-6" />, title: "Soluciones digitales", desc: "Desarrollo de herramientas digitales adaptadas a proyectos académicos y empresariales." },
                { icon: <BookOpen className="w-6 h-6" />, title: "Apoyo a la investigación", desc: "Servicios orientados a facilitar la ejecución de proyectos científicos y académicos." },
              ].map((s, i) => (
                <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">{s.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="sobre-nosotros" className="py-24 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">{aboutTitle}</h2>
              <div className="space-y-4">
                {aboutText.split("\n\n").map((para, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed">{para}</p>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Experiencia académica</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Soluciones a medida</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-500 to-green-500 rounded-3xl p-1 shadow-2xl">
                <div className="bg-white rounded-3xl p-8">
                  <img src={LOGO_URL} alt="OrganizUS" className="h-12 mb-6" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-sm text-gray-700">{contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-sm text-gray-700">Sevilla, España</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contacto" className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Hablemos</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                ¿Tienes un proyecto en mente? Cuéntanos qué necesitas y te ayudamos a hacerlo realidad.
              </p>
              <div className="space-y-4">
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-200 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-800">{contactEmail}</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h3>
                  <p className="text-gray-600 mb-6">Nos pondremos en contacto contigo pronto.</p>
                  <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-full">
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre *</label>
                      <Input {...register("name")} placeholder="Tu nombre" className="bg-white border-gray-200" />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
                      <Input {...register("email")} type="email" placeholder="tu@email.com" className="bg-white border-gray-200" />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Teléfono</label>
                      <Input {...register("phone")} placeholder="+34 600 000 000" className="bg-white border-gray-200" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Asunto</label>
                      <Input {...register("subject")} placeholder="¿En qué podemos ayudarte?" className="bg-white border-gray-200" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Mensaje *</label>
                    <Textarea {...register("message")} placeholder="Cuéntanos tu proyecto..." rows={5} className="bg-white border-gray-200 resize-none" />
                    {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || submitContact.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-3 font-semibold shadow-lg shadow-orange-200"
                  >
                    {isSubmitting || submitContact.isPending ? "Enviando..." : "Enviar mensaje"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={LOGO_URL} alt="OrganizUS" className="h-8 w-auto opacity-80" />
            <p className="text-sm text-center">
              © {new Date().getFullYear()} OrganizUS. Todos los derechos reservados.
            </p>
            <a href={`mailto:${contactEmail}`} className="text-sm hover:text-orange-400 transition-colors">
              {contactEmail}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
