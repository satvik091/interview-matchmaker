import { useState, useMemo } from 'react';
import { useInterview } from '@/contexts/InterviewContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InterviewSlot, Booking } from '@/types/interview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type ViewMode = 'month' | 'week';

interface DayData {
  date: Date;
  slots: InterviewSlot[];
  bookings: Booking[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function CalendarView() {
  const { slots, bookings } = useInterview();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Get slots with their booking info
  const slotsWithBookings = useMemo(() => {
    return slots.map(slot => {
      const booking = bookings.find(b => b.slotId === slot.id && b.status === 'confirmed');
      return { slot, booking };
    });
  }, [slots, bookings]);

  // Generate calendar days for month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: DayData[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySlots = slots.filter(s => s.date === dayStr);
      const dayBookings = bookings.filter(b => {
        const slot = slots.find(s => s.id === b.slotId);
        return slot?.date === dayStr && b.status !== 'cancelled';
      });

      days.push({
        date: day,
        slots: daySlots,
        bookings: dayBookings,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isSameDay(day, new Date()),
      });

      day = addDays(day, 1);
    }

    return days;
  }, [currentDate, slots, bookings]);

  // Generate days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const days: DayData[] = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySlots = slots.filter(s => s.date === dayStr);
      const dayBookings = bookings.filter(b => {
        const slot = slots.find(s => s.id === b.slotId);
        return slot?.date === dayStr && b.status !== 'cancelled';
      });

      days.push({
        date: day,
        slots: daySlots,
        bookings: dayBookings,
        isCurrentMonth: true,
        isToday: isSameDay(day, new Date()),
      });
    }

    return days;
  }, [currentDate, slots, bookings]);

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, 7));
    }
  };

  const handleDayClick = (day: DayData) => {
    if (day.slots.length > 0 || day.bookings.length > 0) {
      setSelectedDay(day);
      setIsDetailOpen(true);
    }
  };

  const getSlotStatusCounts = (daySlots: InterviewSlot[]) => {
    const available = daySlots.filter(s => !s.isBooked).length;
    const booked = daySlots.filter(s => s.isBooked).length;
    return { available, booked };
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="font-display flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendar View
          </CardTitle>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="font-display text-lg font-semibold">
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
            }
          </h3>
          
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-muted-foreground">No slots</span>
          </div>
        </div>

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {/* Header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Days */}
            {monthDays.map((day, index) => {
              const { available, booked } = getSlotStatusCounts(day.slots);
              const hasSlots = day.slots.length > 0;
              
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[80px] p-2 rounded-lg border transition-all cursor-pointer",
                    !day.isCurrentMonth && "opacity-40",
                    day.isToday && "ring-2 ring-primary",
                    hasSlots && "hover:shadow-soft hover:border-primary/50",
                    !hasSlots && "cursor-default"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    day.isToday && "text-primary"
                  )}>
                    {format(day.date, 'd')}
                  </div>
                  
                  {hasSlots && (
                    <div className="space-y-1">
                      {available > 0 && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 w-full justify-center">
                          {available} open
                        </Badge>
                      )}
                      {booked > 0 && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30 w-full justify-center">
                          {booked} booked
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const { available, booked } = getSlotStatusCounts(day.slots);
              const hasSlots = day.slots.length > 0;
              
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[200px] p-3 rounded-lg border transition-all",
                    day.isToday && "ring-2 ring-primary",
                    hasSlots && "hover:shadow-soft hover:border-primary/50 cursor-pointer"
                  )}
                >
                  <div className="text-center mb-3">
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(day.date, 'EEE')}
                    </div>
                    <div className={cn(
                      "text-lg font-semibold",
                      day.isToday && "text-primary"
                    )}>
                      {format(day.date, 'd')}
                    </div>
                  </div>
                  
                  {hasSlots ? (
                    <div className="space-y-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{available}</div>
                        <div className="text-xs text-muted-foreground">available</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{booked}</div>
                        <div className="text-xs text-muted-foreground">booked</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground mt-8">
                      No slots
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Day Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {selectedDay && format(selectedDay.date, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDay && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-primary">
                        {selectedDay.slots.filter(s => !s.isBooked).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Available Slots</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-success/5 border-success/20">
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-success">
                        {selectedDay.slots.filter(s => s.isBooked).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Booked Slots</div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Slots List */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    All Slots
                  </h4>
                  {selectedDay.slots
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(slot => {
                      const booking = bookings.find(b => b.slotId === slot.id && b.status !== 'cancelled');
                      
                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            slot.isBooked ? "bg-success/5 border-success/20" : "bg-primary/5 border-primary/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className={cn(
                              "h-4 w-4",
                              slot.isBooked ? "text-success" : "text-primary"
                            )} />
                            <span className="font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {slot.isBooked ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-success" />
                                <span className="text-sm text-success">
                                  {booking?.candidateName || 'Booked'}
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-primary" />
                                <span className="text-sm text-primary">Available</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
