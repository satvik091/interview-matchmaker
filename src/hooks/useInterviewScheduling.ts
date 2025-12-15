import { useState, useCallback, useMemo } from 'react';
import { 
  InterviewerSettings, 
  InterviewSlot, 
  Booking, 
  WeeklyAvailability,
  PaginatedResponse 
} from '@/types/interview';
import { addDays, format, startOfWeek, isSameDay, parseISO } from 'date-fns';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Initial interviewer settings
const defaultInterviewerSettings: InterviewerSettings = {
  id: 'interviewer-1',
  name: 'John Smith',
  email: 'john.smith@company.com',
  maxInterviewsPerWeek: 20,
  weeklyAvailability: [
    { dayOfWeek: 1, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '17:00' }] },
    { dayOfWeek: 2, slots: [{ startTime: '10:00', endTime: '12:00' }, { startTime: '13:00', endTime: '16:00' }] },
    { dayOfWeek: 3, slots: [{ startTime: '09:00', endTime: '11:00' }, { startTime: '14:00', endTime: '18:00' }] },
    { dayOfWeek: 4, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '17:00' }] },
    { dayOfWeek: 5, slots: [{ startTime: '10:00', endTime: '15:00' }] },
  ],
};

// Generate slots for next 2 weeks based on availability
function generateSlotsFromAvailability(
  settings: InterviewerSettings,
  existingBookings: Booking[]
): InterviewSlot[] {
  const slots: InterviewSlot[] = [];
  const today = new Date();
  const bookedSlotIds = new Set(existingBookings.filter(b => b.status === 'confirmed').map(b => b.slotId));
  
  // Generate for next 14 days
  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const date = addDays(today, dayOffset);
    const dayOfWeek = date.getDay();
    
    const dayAvailability = settings.weeklyAvailability.find(a => a.dayOfWeek === dayOfWeek);
    if (!dayAvailability) continue;
    
    for (const timeRange of dayAvailability.slots) {
      // Generate 30-minute slots within the time range
      const [startHour, startMin] = timeRange.startTime.split(':').map(Number);
      const [endHour, endMin] = timeRange.endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour * 60 + currentMin < endHour * 60 + endMin) {
        const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        const nextMin = currentMin + 30;
        const nextHour = currentHour + Math.floor(nextMin / 60);
        const slotEnd = `${nextHour.toString().padStart(2, '0')}:${(nextMin % 60).toString().padStart(2, '0')}`;
        
        const slotId = `slot-${format(date, 'yyyy-MM-dd')}-${slotStart}`;
        
        slots.push({
          id: slotId,
          interviewerId: settings.id,
          date: format(date, 'yyyy-MM-dd'),
          startTime: slotStart,
          endTime: slotEnd,
          isBooked: bookedSlotIds.has(slotId),
          version: 1,
        });
        
        currentMin = nextMin % 60;
        currentHour = nextHour;
      }
    }
  }
  
  return slots;
}

export function useInterviewScheduling() {
  const [settings, setSettings] = useState<InterviewerSettings>(defaultInterviewerSettings);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate slots based on current settings and bookings
  const slots = useMemo(() => {
    return generateSlotsFromAvailability(settings, bookings);
  }, [settings, bookings]);

  // Count bookings for current week
  const weeklyBookingCount = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    return bookings.filter(b => {
      const slot = slots.find(s => s.id === b.slotId);
      if (!slot || b.status !== 'confirmed') return false;
      const slotDate = parseISO(slot.date);
      return slotDate >= weekStart && slotDate < addDays(weekStart, 7);
    }).length;
  }, [bookings, slots]);

  // Update interviewer settings
  const updateSettings = useCallback((newSettings: Partial<InterviewerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Update weekly availability
  const updateAvailability = useCallback((availability: WeeklyAvailability[]) => {
    setSettings(prev => ({ ...prev, weeklyAvailability: availability }));
  }, []);

  // Book a slot with optimistic locking simulation
  const bookSlot = useCallback(async (
    slotId: string,
    candidateInfo: { name: string; email: string }
  ): Promise<{ success: boolean; error?: string; booking?: Booking }> => {
    setIsLoading(true);
    setError(null);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const slot = slots.find(s => s.id === slotId);
    
    if (!slot) {
      setIsLoading(false);
      return { success: false, error: 'Slot not found' };
    }

    if (slot.isBooked) {
      setIsLoading(false);
      return { success: false, error: 'This slot has already been booked. Please select another slot.' };
    }

    // Check weekly limit
    if (weeklyBookingCount >= settings.maxInterviewsPerWeek) {
      setIsLoading(false);
      return { success: false, error: 'Maximum interviews for this week has been reached.' };
    }

    // Simulate race condition check (version mismatch)
    const simulateRaceCondition = Math.random() < 0.05; // 5% chance
    if (simulateRaceCondition) {
      setIsLoading(false);
      return { 
        success: false, 
        error: 'Another user just booked this slot. Please refresh and try again.' 
      };
    }

    const newBooking: Booking = {
      id: generateId(),
      slotId,
      candidateId: generateId(),
      candidateName: candidateInfo.name,
      candidateEmail: candidateInfo.email,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBookings(prev => [...prev, newBooking]);
    setIsLoading(false);

    return { success: true, booking: newBooking };
  }, [slots, weeklyBookingCount, settings.maxInterviewsPerWeek]);

  // Cancel a booking
  const cancelBooking = useCallback(async (bookingId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      setIsLoading(false);
      return { success: false, error: 'Booking not found' };
    }

    setBookings(prev => prev.map(b => 
      b.id === bookingId 
        ? { ...b, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
        : b
    ));
    
    setIsLoading(false);
    return { success: true };
  }, [bookings]);

  // Update/reschedule a booking
  const rescheduleBooking = useCallback(async (
    bookingId: string,
    newSlotId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      setIsLoading(false);
      return { success: false, error: 'Booking not found' };
    }

    const newSlot = slots.find(s => s.id === newSlotId);
    if (!newSlot) {
      setIsLoading(false);
      return { success: false, error: 'New slot not found' };
    }

    if (newSlot.isBooked) {
      setIsLoading(false);
      return { success: false, error: 'New slot is already booked' };
    }

    setBookings(prev => prev.map(b => 
      b.id === bookingId 
        ? { ...b, slotId: newSlotId, status: 'rescheduled' as const, updatedAt: new Date().toISOString() }
        : b
    ));
    
    setIsLoading(false);
    return { success: true };
  }, [bookings, slots]);

  // Paginated slots with cursor-based pagination
  const getPaginatedSlots = useCallback((
    cursor: string | null,
    limit: number = 10,
    dateFilter?: string
  ): PaginatedResponse<InterviewSlot> => {
    let filteredSlots = slots.filter(s => !s.isBooked);
    
    if (dateFilter) {
      filteredSlots = filteredSlots.filter(s => s.date === dateFilter);
    }

    // Sort by date and time
    filteredSlots.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    let startIndex = 0;
    if (cursor) {
      const cursorIndex = filteredSlots.findIndex(s => s.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedData = filteredSlots.slice(startIndex, startIndex + limit);
    const nextCursor = paginatedData.length === limit && startIndex + limit < filteredSlots.length
      ? paginatedData[paginatedData.length - 1].id
      : null;

    return {
      data: paginatedData,
      cursor: nextCursor,
      hasMore: nextCursor !== null,
      totalCount: filteredSlots.length,
    };
  }, [slots]);

  return {
    settings,
    slots,
    bookings,
    isLoading,
    error,
    weeklyBookingCount,
    updateSettings,
    updateAvailability,
    bookSlot,
    cancelBooking,
    rescheduleBooking,
    getPaginatedSlots,
  };
}
