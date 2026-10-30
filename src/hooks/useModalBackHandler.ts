import { useEffect, useRef } from 'react';

interface ModalStackEntry {
  id: number;
  close: () => void;
}

const modalStack: ModalStackEntry[] = [];
let nextModalId = 1;
let pushedHistoryDepth = 0;
let ignorePopStateCount = 0;
let syncScheduled = false;
let listenerInitialized = false;

function ensurePopStateListener() {
  if (listenerInitialized || typeof window === 'undefined') return;
  listenerInitialized = true;

  window.addEventListener('popstate', () => {
    if (ignorePopStateCount > 0) {
      ignorePopStateCount -= 1;
      return;
    }

    if (modalStack.length > 0) {
      pushedHistoryDepth = Math.max(0, pushedHistoryDepth - 1);
      const topModal = modalStack.pop();
      if (topModal) {
        topModal.close();
      }
    }
  });
}

function scheduleHistorySync() {
  if (syncScheduled || typeof window === 'undefined') return;
  syncScheduled = true;

  window.setTimeout(() => {
    syncScheduled = false;
    const targetDepth = modalStack.length;
    const delta = targetDepth - pushedHistoryDepth;

    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        pushedHistoryDepth += 1;
        window.history.pushState({ millenniumCodexModalDepth: pushedHistoryDepth }, '');
      }
    } else if (delta < 0) {
      pushedHistoryDepth = targetDepth;
      ignorePopStateCount += 1;
      window.history.go(delta);
    }
  }, 0);
}

/**
 * Registers an open modal/sheet/drawer on a LIFO stack synced with the browser History API.
 * Pressing the desktop browser Back arrow or mobile hardware Back button closes the topmost
 * open modal instead of navigating away from the page.
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    ensurePopStateListener();

    const id = nextModalId++;
    const entry: ModalStackEntry = {
      id,
      close: () => onCloseRef.current()
    };

    modalStack.push(entry);
    scheduleHistorySync();

    return () => {
      const idx = modalStack.findIndex((item) => item.id === id);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
        scheduleHistorySync();
      }
    };
  }, [isOpen]);
}
