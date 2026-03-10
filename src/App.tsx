import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import StyleListPage from "./pages/StyleListPage";
import GeneratePage from "./pages/GeneratePage";
import PurchasePage from "./pages/PurchasePage";
import NotFound from "./pages/NotFound";
import TermsPage from "./pages/TermsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/category/:gender" element={<CategoryPage />} />
          <Route path="/styles/:gender/:category" element={<StyleListPage />} />
          <Route path="/generate/:styleId" element={<GeneratePage />} />
          <Route path="/purchase/:styleId" element={<PurchasePage />} />
          <Route path="/term" element={<TermsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
