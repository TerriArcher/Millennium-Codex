import { useState, useEffect, useRef } from 'react';

export interface AnimatedStatResult {
  displayVal: number;
  trend: 'up' | 'down' | null;
}

/**
 * Smoothly animates a numeric stat (ATK or DEF) counting up or down when switching cards.
 */
export function useAnimatedStat(
  targetValue: number | undefined,
  duration = 450
): AnimatedStatResult {
  const [displayVal, setDisplayVal] = useState<number>(
    targetValue !== undefined && targetValue >= 0 ? targetValue : 0
  );
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);
  const prevValRef = useRef<number>(
    targetValue !== undefined && targetValue >= 0 ? targetValue : 0
  );

  useEffect(() => {
    if (targetValue === undefined || targetValue < 0) {
      setTrend(null);
      prevValRef.current = 0;
      setDisplayVal(0);
      return;
    }

    const startVal = prevValRef.current;
    const endVal = targetValue;

    if (startVal === endVal) {
      setDisplayVal(endVal);
      setTrend(null);
      return;
    }

    setTrend(endVal > startVal ? 'up' : 'down');
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayVal(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        prevValRef.current = endVal;
        setDisplayVal(endVal);
        setTrend(null);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      prevValRef.current = endVal;
    };
  }, [targetValue, duration]);

  return { displayVal, trend };
}
