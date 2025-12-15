import { useState } from 'react';
import { useInterview } from '@/contexts/InterviewContext';
import { WeeklyAvailability, DAY_NAMES, TIME_SLOTS } from '@/types/interview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Calendar, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function AvailabilityManager() {
  const { settings, updateSettings, updateAvailability, weeklyBookingCount } = useInterview();
  const [localAvailability, setLocalAvailability] = useState<WeeklyAvailability[]>(settings.weeklyAvailability);
  const [maxInterviews, setMaxInterviews] = useState(settings.maxInterviewsPerWeek);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleDay = (dayOfWeek: number) => {
    const existingDay = localAvailability.find(a => a.dayOfWeek === dayOfWeek);
    
    if (existingDay) {
      setLocalAvailability(prev => prev.filter(a => a.dayOfWeek !== dayOfWeek));
    } else {
      setLocalAvailability(prev => [...prev, {
        dayOfWeek,
        slots: [{ startTime: '09:00', endTime: '17:00' }]
      }].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    }
    setHasChanges(true);
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setLocalAvailability(prev => prev.map(day => {
      if (day.dayOfWeek !== dayOfWeek) return day;
      return {
        ...day,
        slots: [...day.slots, { startTime: '09:00', endTime: '10:00' }]
      };
    }));
    setHasChanges(true);
  };

  const removeTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    setLocalAvailability(prev => prev.map(day => {
      if (day.dayOfWeek !== dayOfWeek) return day;
      return {
        ...day,
        slots: day.slots.filter((_, idx) => idx !== slotIndex)
      };
    }));
    setHasChanges(true);
  };

  const updateTimeSlot = (dayOfWeek: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setLocalAvailability(prev => prev.map(day => {
      if (day.dayOfWeek !== dayOfWeek) return day;
      return {
        ...day,
        slots: day.slots.map((slot, idx) => {
          if (idx !== slotIndex) return slot;
          return { ...slot, [field]: value };
        })
      };
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate time slots
    for (const day of localAvailability) {
      for (const slot of day.slots) {
        if (slot.startTime >= slot.endTime) {
          toast({
            title: "Invalid Time Range",
            description: `${DAY_NAMES[day.dayOfWeek]}: Start time must be before end time.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    updateAvailability(localAvailability);
    updateSettings({ maxInterviewsPerWeek: maxInterviews });
    setHasChanges(false);
    
    toast({
      title: "Settings Saved",
      description: "Your availability has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent">
                <Calendar className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Available</p>
                <p className="text-2xl font-display font-bold">{localAvailability.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week's Bookings</p>
                <p className="text-2xl font-display font-bold">{weeklyBookingCount} / {maxInterviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="maxInterviews">Max Interviews Per Week</Label>
              <Input
                id="maxInterviews"
                type="number"
                min={1}
                max={50}
                value={maxInterviews}
                onChange={(e) => {
                  setMaxInterviews(parseInt(e.target.value) || 1);
                  setHasChanges(true);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Availability */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display">Weekly Availability</CardTitle>
          <CardDescription>
            Set your recurring availability for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
            const dayAvailability = localAvailability.find(a => a.dayOfWeek === dayOfWeek);
            const isEnabled = !!dayAvailability;
            
            return (
              <div key={dayOfWeek} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleDay(dayOfWeek)}
                    />
                    <span className={cn(
                      "font-medium",
                      !isEnabled && "text-muted-foreground"
                    )}>
                      {DAY_NAMES[dayOfWeek]}
                    </span>
                  </div>
                  
                  {isEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addTimeSlot(dayOfWeek)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slot
                    </Button>
                  )}
                </div>
                
                {isEnabled && dayAvailability && (
                  <div className="ml-12 space-y-2">
                    {dayAvailability.slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select
                          value={slot.startTime}
                          onValueChange={(value) => updateTimeSlot(dayOfWeek, idx, 'startTime', value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <span className="text-muted-foreground">to</span>
                        
                        <Select
                          value={slot.endTime}
                          onValueChange={(value) => updateTimeSlot(dayOfWeek, idx, 'endTime', value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {dayAvailability.slots.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeSlot(dayOfWeek, idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {dayOfWeek < 6 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 animate-slide-up">
          <Button
            onClick={handleSave}
            size="lg"
            className="gradient-primary text-primary-foreground shadow-elevated"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
