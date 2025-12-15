import { InterviewSlot } from '@/types/interview';
import { format, parseISO } from 'date-fns';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SlotCardProps {
  slot: InterviewSlot;
  isSelected?: boolean;
  onSelect?: (slot: InterviewSlot) => void;
  disabled?: boolean;
}

export function SlotCard({ slot, isSelected, onSelect, disabled }: SlotCardProps) {
  const date = parseISO(slot.date);
  
  return (
    <button
      onClick={() => onSelect?.(slot)}
      disabled={disabled || slot.isBooked}
      className={cn(
        "group relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        slot.isBooked && "opacity-50 cursor-not-allowed bg-slot-booked border-border",
        !slot.isBooked && !isSelected && "bg-card border-border hover:border-primary/50 hover:shadow-soft",
        isSelected && "bg-accent border-primary shadow-soft",
        disabled && "pointer-events-none"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-display font-semibold text-foreground">
            {format(date, 'EEEE, MMM d')}
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {slot.startTime} - {slot.endTime}
            </span>
          </div>
        </div>
        
        {isSelected && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary animate-scale-in">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        
        {slot.isBooked && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Booked
          </span>
        )}
      </div>
      
      {!slot.isBooked && !isSelected && (
        <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
