import { Header } from '@/components/Header';
import { BookingsList } from '@/components/BookingsList';
import { Clock } from 'lucide-react';

const MyBookings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Header Section */}
        <section className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            <Clock className="h-4 w-4" />
            Your Schedule
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            My Bookings
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            View and manage your scheduled interviews. You can reschedule or cancel 
            your bookings at any time.
          </p>
        </section>

        {/* Bookings List */}
        <section className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
          <BookingsList />
        </section>
      </main>
    </div>
  );
};

export default MyBookings;
