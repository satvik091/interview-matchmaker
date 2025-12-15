import { Header } from '@/components/Header';
import { SlotSelector } from '@/components/SlotSelector';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Hero Section */}
        <section className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            <Calendar className="h-4 w-4" />
            Schedule Your Interview
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Book Your Interview Slot
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select from available time slots for the next two weeks. 
            Pick a time that works best for you and confirm your booking in seconds.
          </p>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Calendar,
              title: 'Flexible Scheduling',
              description: 'Choose from multiple available slots across the next 2 weeks'
            },
            {
              icon: Clock,
              title: 'Real-time Availability',
              description: 'See instantly which slots are available and book with confidence'
            },
            {
              icon: CheckCircle,
              title: 'Instant Confirmation',
              description: 'Get immediate confirmation of your interview booking'
            }
          ].map((feature, index) => (
            <div 
              key={feature.title}
              className="p-6 rounded-xl bg-card shadow-soft animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex p-3 rounded-lg bg-accent mb-4">
                <feature.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        {/* Slot Selection */}
        <section className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
          <SlotSelector />
        </section>
      </main>
    </div>
  );
};

export default Index;
