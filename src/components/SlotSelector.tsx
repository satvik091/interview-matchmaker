import { useState, useCallback, useEffect } from 'react';
import { useInterview } from '@/contexts/InterviewContext';
import { InterviewSlot } from '@/types/interview';
import { SlotCard } from './SlotCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, parseISO, addDays } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const SLOTS_PER_PAGE = 8;

export function SlotSelector() {
  const { getPaginatedSlots, bookSlot, isLoading, settings } = useInterview();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [displayedSlots, setDisplayedSlots] = useState<InterviewSlot[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Debounce timer for date selection
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Load slots with debouncing
  const loadSlots = useCallback((dateFilter?: string, append = false) => {
    const currentCursor = append ? cursor : null;
    const result = getPaginatedSlots(currentCursor, SLOTS_PER_PAGE, dateFilter);
    
    if (append) {
      setDisplayedSlots(prev => [...prev, ...result.data]);
    } else {
      setDisplayedSlots(result.data);
    }
    
    setCursor(result.cursor);
    setHasMore(result.hasMore);
    setTotalCount(result.totalCount);
  }, [getPaginatedSlots, cursor]);

  // Initial load and date change with debouncing
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      const dateFilter = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
      loadSlots(dateFilter, false);
    }, 300); // 300ms debounce
    
    setDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [selectedDate]);

  // Load more slots
  const handleLoadMore = () => {
    const dateFilter = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    loadSlots(dateFilter, true);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: InterviewSlot) => {
    setSelectedSlot(slot);
  };

  // Open booking modal
  const handleBookClick = () => {
    if (!selectedSlot) return;
    setIsBookingModalOpen(true);
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !candidateName.trim() || !candidateEmail.trim()) return;
    
    const result = await bookSlot(selectedSlot.id, {
      name: candidateName.trim(),
      email: candidateEmail.trim(),
    });

    if (result.success) {
      setBookingSuccess(true);
      toast({
        title: "Booking Confirmed!",
        description: `Your interview is scheduled for ${format(parseISO(selectedSlot.date), 'EEEE, MMMM d')} at ${selectedSlot.startTime}`,
      });
      
      // Reset after showing success
      setTimeout(() => {
        setIsBookingModalOpen(false);
        setBookingSuccess(false);
        setSelectedSlot(null);
        setCandidateName('');
        setCandidateEmail('');
        loadSlots(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined, false);
      }, 2000);
    } else {
      toast({
        title: "Booking Failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  // Date constraints (next 2 weeks only)
  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 14);

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Available Interview Slots
          </h2>
          <p className="text-muted-foreground mt-1">
            {totalCount} slots available • Next 2 weeks
          </p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP') : 'Filter by date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < minDate || date > maxDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
            {selectedDate && (
              <div className="p-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedDate(undefined)}
                  className="w-full"
                >
                  Clear filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedSlots.map((slot, index) => (
          <div 
            key={slot.id} 
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <SlotCard
              slot={slot}
              isSelected={selectedSlot?.id === slot.id}
              onSelect={handleSlotSelect}
            />
          </div>
        ))}
      </div>

      {displayedSlots.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
            No slots available
          </h3>
          <p className="mt-2 text-muted-foreground">
            {selectedDate 
              ? 'No slots available on this date. Try another date.'
              : 'No interview slots are currently available.'}
          </p>
        </div>
      )}

      {/* Load More & Book Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4">
        {hasMore && (
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            Load more slots
          </Button>
        )}
        
        <Button
          onClick={handleBookClick}
          disabled={!selectedSlot}
          className="w-full sm:w-auto gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
          size="lg"
        >
          {selectedSlot ? `Book ${format(parseISO(selectedSlot.date), 'MMM d')} at ${selectedSlot.startTime}` : 'Select a slot to book'}
        </Button>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md">
          {!bookingSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Confirm Your Booking</DialogTitle>
                <DialogDescription>
                  {selectedSlot && (
                    <span className="block mt-2 p-3 bg-accent rounded-lg">
                      <strong>{format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy')}</strong>
                      <br />
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBookingModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={isLoading || !candidateName.trim() || !candidateEmail.trim()}
                  className="gradient-primary text-primary-foreground"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirm Booking
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-8 text-center animate-scale-in">
              <CheckCircle className="mx-auto h-16 w-16 text-success" />
              <h3 className="mt-4 font-display text-xl font-bold text-foreground">
                Booking Confirmed!
              </h3>
              <p className="mt-2 text-muted-foreground">
                Check your email for confirmation details.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
