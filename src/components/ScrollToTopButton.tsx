import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        setIsVisible(false);
        return;
      }

      const scrollPercent = (window.scrollY / scrollHeight) * 100;
      setIsVisible(scrollPercent >= 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Return to top"
      title="Return to top of page"
      className="fixed bottom-6 right-6 z-30 group flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 hover:border-amber-400 shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4 active:scale-95 hover:scale-105"
    >
      <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center group-hover:-translate-y-0.5 transition-transform">
        <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <span className="text-xs font-bold tracking-tight">Return to top</span>
    </button>
  );
};
