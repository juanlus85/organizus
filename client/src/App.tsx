import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LinkPage from "./pages/LinkPage";
import Dashboard from "./pages/admin/Dashboard";
import Services from "./pages/admin/Services";
import { QuoteList, QuoteNew, QuoteDetail } from "./pages/admin/Quotes";
import { InvoiceList, InvoiceNew, InvoiceDetail } from "./pages/admin/Invoices";
import LinkPages from "./pages/admin/LinkPages";
import Messages from "./pages/admin/Messages";
import Users from "./pages/admin/Users";
import WebContent from "./pages/admin/WebContent";
import WebServices from "./pages/admin/WebServices";
import Login from "./pages/Login";
import { useParams } from "wouter";

function QuoteDetailWrapper() {
  const params = useParams<{ id: string }>();
  return <QuoteDetail id={parseInt(params.id || "0")} />;
}

function InvoiceDetailWrapper() {
  const params = useParams<{ id: string }>();
  return <InvoiceDetail id={parseInt(params.id || "0")} />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />

      {/* Admin routes */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/servicios" component={Services} />
      <Route path="/admin/presupuestos" component={QuoteList} />
      <Route path="/admin/presupuestos/nuevo" component={QuoteNew} />
      <Route path="/admin/presupuestos/:id" component={QuoteDetailWrapper} />
      <Route path="/admin/facturas" component={InvoiceList} />
      <Route path="/admin/facturas/nueva" component={InvoiceNew} />
      <Route path="/admin/facturas/:id" component={InvoiceDetailWrapper} />
      <Route path="/admin/linkpages" component={LinkPages} />
      <Route path="/admin/mensajes" component={Messages} />
      <Route path="/admin/usuarios" component={Users} />
      <Route path="/admin/contenido" component={WebContent} />
      <Route path="/admin/servicios-web" component={WebServices} />

      {/* Link pages - must be last to avoid conflicts */}
      <Route path="/404" component={NotFound} />
      <Route path="/:slug" component={LinkPage} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
