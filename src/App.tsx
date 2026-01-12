import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InterviewProvider } from "@/contexts/InterviewContext";
import Index from "./pages/Index";
import InterviewerDashboard from "./pages/InterviewerDashboard";
import MyBookings from "./pages/MyBookings";
import CalendarPage from "./pages/CalendarPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <InterviewProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/interviewer" element={<InterviewerDashboard />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </InterviewProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
