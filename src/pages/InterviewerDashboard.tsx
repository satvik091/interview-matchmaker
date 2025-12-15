import { Header } from '@/components/Header';
import { AvailabilityManager } from '@/components/AvailabilityManager';
import { Settings } from 'lucide-react';

const InterviewerDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Header Section */}
        <section className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            <Settings className="h-4 w-4" />
            Interviewer Settings
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Manage Availability
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Configure your weekly availability and set the maximum number of interviews 
            you can conduct per week. Candidates will be able to book from these time slots.
          </p>
        </section>

        {/* Availability Manager */}
        <AvailabilityManager />
      </main>
    </div>
  );
};

export default InterviewerDashboard;
