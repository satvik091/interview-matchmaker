export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
}

export interface WeeklyAvailability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  slots: TimeSlot[];
}

export interface InterviewerSettings {
  id: string;
  name: string;
  email: string;
  maxInterviewsPerWeek: number;
  weeklyAvailability: WeeklyAvailability[];
}

export interface InterviewSlot {
  id: string;
  interviewerId: string;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  isBooked: boolean;
  version: number; // For optimistic locking
}

export interface Booking {
  id: string;
  slotId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export type DayName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export const DAY_NAMES: DayName[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];
