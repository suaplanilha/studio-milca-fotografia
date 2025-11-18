import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ClientArea from "./pages/ClientArea";
import PhotoshootGallery from "./pages/PhotoshootGallery";
import Cart from "./pages/Cart";
import OrderTracking from "./pages/OrderTracking";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminPhotoshoots from "./pages/AdminPhotoshoots";
import AdminClients from "./pages/AdminClients";
import LinkAccount from "./pages/LinkAccount";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/vincular" component={LinkAccount} />
      <Route path="/cliente" component={ClientArea} />
      <Route path="/cliente/ensaio/:id" component={PhotoshootGallery} />
      <Route path="/cliente/carrinho/:id" component={Cart} />
      <Route path="/cliente/pedido/:id" component={OrderTracking} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/pedidos" component={AdminOrders} />
      <Route path="/admin/ensaios" component={AdminPhotoshoots} />
      <Route path="/admin/clientes" component={AdminClients} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
