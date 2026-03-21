import type { MutableRefObject, ReactNode, RefObject } from 'react';
import { createContext, useContext, useRef } from 'react';
import type { ScrollView, View } from 'react-native';

import type { StepKey } from '../types';

interface ScrollContextValue {
  scrollViewRef: RefObject<ScrollView>;
  stepRefs: MutableRefObject<Record<StepKey, View | null>>;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const scrollViewRef = useRef<ScrollView>(null);
  const stepRefs = useRef<Record<StepKey, View | null>>({
    service: null,
    datetime: null,
    customer: null,
    confirmation: null,
  });

  return (
    <ScrollContext.Provider value={{ scrollViewRef, stepRefs }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollContext() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollContext must be used within ScrollProvider');
  }
  return context;
}
