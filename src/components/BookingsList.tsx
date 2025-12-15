import { useState } from 'react';
import { useInterview } from '@/contexts/InterviewContext';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, Mail, Edit, Trash2, Loader2, CalendarX } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SlotCard } from './SlotCard';
import { InterviewSlot } from '@/types/interview';

export function BookingsList() {
  const { bookings, slots, cancelBooking, rescheduleBooking, isLoading, getPaginatedSlots } = useInterview();
  
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [newSlotId, setNewSlotId] = useState<string | null>(null);

  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'rescheduled');

  const getSlotDetails = (slotId: string) => {
    return slots.find(s => s.id === slotId);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const result = await cancelBooking(bookingId);
    
    if (result.success) {
      toast({
        title: "Booking Cancelled",
        description: "Your interview booking has been cancelled.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleOpenReschedule = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setNewSlotId(null);
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async () => {
    if (!selectedBookingId || !newSlotId) return;
    
    const result = await rescheduleBooking(selectedBookingId, newSlotId);
    
    if (result.success) {
      toast({
        title: "Booking Rescheduled",
        description: "Your interview has been rescheduled successfully.",
      });
      setRescheduleModalOpen(false);
      setSelectedBookingId(null);
      setNewSlotId(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const availableSlots = getPaginatedSlots(null, 20);

  if (activeBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarX className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
          No Bookings Yet
        </h3>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          You haven't booked any interview slots. Head to the booking page to schedule your interview.
        </p>
        <Button className="mt-6 gradient-primary text-primary-foreground" asChild>
          <a href="/">Book an Interview</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Your Bookings
        </h2>
        <p className="text-muted-foreground mt-1">
          {activeBookings.length} active booking{activeBookings.length !== 1 ? 's' : ''}
        </p>
      </div>

      {activeBookings.map((booking, index) => {
        const slot = getSlotDetails(booking.slotId);
        if (!slot) return null;

        return (
          <Card 
            key={booking.id} 
            className="shadow-soft animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={booking.status === 'rescheduled' ? 'secondary' : 'default'}>
                      {booking.status === 'rescheduled' ? 'Rescheduled' : 'Confirmed'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-lg font-display font-semibold">
                    <Calendar className="h-5 w-5 text-primary" />
                    {format(parseISO(slot.date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {slot.startTime} - {slot.endTime}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {booking.candidateName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {booking.candidateEmail}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReschedule(booking.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Reschedule
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this interview booking? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancel Booking
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Reschedule Interview</DialogTitle>
            <DialogDescription>
              Select a new time slot for your interview
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
            {availableSlots.data.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isSelected={newSlotId === slot.id}
                onSelect={() => setNewSlotId(slot.id)}
              />
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!newSlotId || isLoading}
              className="gradient-primary text-primary-foreground"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
