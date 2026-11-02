import { useState, useEffect, useRef } from 'react';

export interface UseOverlayTransitionOptions {
  isOpen: boolean;
  onClose?: () => void;
  exitDurationMs?: number;
  entranceDurationMs?: number;
  disableEscape?: boolean;
  captureEscape?: boolean;
}

export interface UseOverlayTransitionResult {
  shouldRender: boolean;
  isVisible: boolean;
  isEntranceComplete: boolean;
}

/**
 * Shared hook managing two-frame requestAnimationFrame entrance transitions,
 * timed exit unmounting, optional entrance-completion tracking, and Escape key handling.
 */
export function useOverlayTransition({
  isOpen,
  onClose,
  exitDurationMs = 300,
  entranceDurationMs = 320,
  disableEscape = false,
  captureEscape = false
}: UseOverlayTransitionOptions): UseOverlayTransitionResult {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isEntranceComplete, setIsEntranceComplete] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let raf1: number;
    let raf2: number;
    let exitTimer: number;
    let entranceTimer: number;

    if (isOpen) {
      setShouldRender(true);
      setIsEntranceComplete(false);
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          setIsVisible(true);
          entranceTimer = window.setTimeout(() => {
            setIsEntranceComplete(true);
          }, entranceDurationMs);
        });
      });
    } else {
      setIsVisible(false);
      setIsEntranceComplete(false);
      exitTimer = window.setTimeout(() => {
        setShouldRender(false);
      }, exitDurationMs);
    }

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(exitTimer);
      window.clearTimeout(entranceTimer);
    };
  }, [isOpen, exitDurationMs, entranceDurationMs]);

  useEffect(() => {
    if (!isOpen || disableEscape || !onCloseRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (captureEscape) {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        onCloseRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown, captureEscape);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, captureEscape);
    };
  }, [isOpen, disableEscape, captureEscape]);

  return { shouldRender, isVisible, isEntranceComplete };
}
