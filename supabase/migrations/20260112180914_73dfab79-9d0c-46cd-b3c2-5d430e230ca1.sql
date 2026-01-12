-- Create interviewer profiles table
CREATE TABLE public.interviewer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  max_interviews_per_week INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly availability table
CREATE TABLE public.weekly_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewer_id UUID NOT NULL REFERENCES public.interviewer_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(interviewer_id, day_of_week, start_time, end_time)
);

-- Create interview slots table
CREATE TABLE public.interview_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewer_id UUID NOT NULL REFERENCES public.interviewer_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(interviewer_id, date, start_time)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.interview_slots(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interviewer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interviewer_profiles
CREATE POLICY "Interviewers can view their own profile"
  ON public.interviewer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Interviewers can update their own profile"
  ON public.interviewer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Interviewers can insert their own profile"
  ON public.interviewer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view interviewer profiles for booking"
  ON public.interviewer_profiles FOR SELECT
  USING (true);

-- RLS Policies for weekly_availability
CREATE POLICY "Interviewers can manage their own availability"
  ON public.weekly_availability FOR ALL
  USING (interviewer_id IN (SELECT id FROM public.interviewer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view availability"
  ON public.weekly_availability FOR SELECT
  USING (true);

-- RLS Policies for interview_slots
CREATE POLICY "Interviewers can manage their own slots"
  ON public.interview_slots FOR ALL
  USING (interviewer_id IN (SELECT id FROM public.interviewer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view slots"
  ON public.interview_slots FOR SELECT
  USING (true);

CREATE POLICY "Candidates can book available slots"
  ON public.interview_slots FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for bookings
CREATE POLICY "Candidates can view their own bookings"
  ON public.bookings FOR SELECT
  USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Candidates can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (candidate_id = auth.uid());

CREATE POLICY "Interviewers can view bookings for their slots"
  ON public.bookings FOR SELECT
  USING (slot_id IN (
    SELECT s.id FROM public.interview_slots s
    JOIN public.interviewer_profiles p ON s.interviewer_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_interviewer_profiles_updated_at
  BEFORE UPDATE ON public.interviewer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interview_slots_updated_at
  BEFORE UPDATE ON public.interview_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function for optimistic locking on slot booking
CREATE OR REPLACE FUNCTION public.book_slot(
  p_slot_id UUID,
  p_candidate_id UUID,
  p_candidate_name TEXT,
  p_candidate_email TEXT,
  p_expected_version INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_slot RECORD;
  v_booking_id UUID;
  v_weekly_count INTEGER;
  v_max_interviews INTEGER;
BEGIN
  -- Lock the slot row
  SELECT * INTO v_slot FROM public.interview_slots 
  WHERE id = p_slot_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Slot not found');
  END IF;
  
  IF v_slot.is_booked THEN
    RETURN json_build_object('success', false, 'error', 'Slot already booked');
  END IF;
  
  IF v_slot.version != p_expected_version THEN
    RETURN json_build_object('success', false, 'error', 'Slot was modified. Please refresh and try again.');
  END IF;
  
  -- Check weekly limit
  SELECT ip.max_interviews_per_week INTO v_max_interviews
  FROM public.interviewer_profiles ip
  WHERE ip.id = v_slot.interviewer_id;
  
  SELECT COUNT(*) INTO v_weekly_count
  FROM public.bookings b
  JOIN public.interview_slots s ON b.slot_id = s.id
  WHERE s.interviewer_id = v_slot.interviewer_id
    AND b.status = 'confirmed'
    AND s.date >= date_trunc('week', v_slot.date)
    AND s.date < date_trunc('week', v_slot.date) + interval '7 days';
  
  IF v_weekly_count >= v_max_interviews THEN
    RETURN json_build_object('success', false, 'error', 'Maximum interviews for this week reached');
  END IF;
  
  -- Update slot
  UPDATE public.interview_slots
  SET is_booked = true, version = version + 1
  WHERE id = p_slot_id;
  
  -- Create booking
  INSERT INTO public.bookings (slot_id, candidate_id, candidate_name, candidate_email, status)
  VALUES (p_slot_id, p_candidate_id, p_candidate_name, p_candidate_email, 'confirmed')
  RETURNING id INTO v_booking_id;
  
  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;