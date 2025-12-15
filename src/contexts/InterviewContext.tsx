import React, { createContext, useContext, ReactNode } from 'react';
import { useInterviewScheduling } from '@/hooks/useInterviewScheduling';

type InterviewContextType = ReturnType<typeof useInterviewScheduling>;

const InterviewContext = createContext<InterviewContextType | null>(null);

export function InterviewProvider({ children }: { children: ReactNode }) {
  const interviewState = useInterviewScheduling();
  
  return (
    <InterviewContext.Provider value={interviewState}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}
