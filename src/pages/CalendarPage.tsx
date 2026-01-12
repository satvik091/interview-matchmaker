import { Header } from '@/components/Header';
import { CalendarView } from '@/components/CalendarView';
import { Calendar } from 'lucide-react';

const CalendarPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
            <Calendar className="h-4 w-4" />
            <span>Calendar Overview</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Interview Calendar
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            View all interview slots and bookings in a visual calendar format. 
            Click on any day to see detailed slot information.
          </p>
        </section>

        {/* Calendar View */}
        <section className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
          <CalendarView />
        </section>
      </main>
    </div>
  );
};

export default CalendarPage;
