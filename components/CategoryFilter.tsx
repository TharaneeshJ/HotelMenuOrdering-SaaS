import React, { useRef, useState, useEffect } from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      // Allow a small buffer (2px) for float calculation differences
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative mb-8 group">
      {/* Left Gradient & Button */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 via-gray-50/90 to-transparent z-10 flex items-center transition-all duration-300 ${
          showLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => scroll('left')}
          className="bg-white rounded-full p-2.5 shadow-lg border border-gray-100 text-brand-dark hover:text-brand-primary hover:scale-110 active:scale-95 transition-all ml-1"
          aria-label="Scroll Left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Scrollable Area */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth items-center"
      >
        <button
          onClick={() => onSelectCategory('All')}
          className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm active:scale-95 ${
            activeCategory === 'All'
              ? 'bg-brand-accent text-white border-brand-accent ring-2 ring-brand-primary/40 shadow-brand-accent/20'
              : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary hover:text-brand-accent hover:shadow-md'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm active:scale-95 ${
              activeCategory === cat
                ? 'bg-brand-accent text-white border-brand-accent ring-2 ring-brand-primary/40 shadow-brand-accent/20'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary hover:text-brand-accent hover:shadow-md'
            }`}
          >
            {cat}
          </button>
        ))}
        {/* Spacer for Right Button Visibility overlap */}
        <div className="w-8 shrink-0 md:hidden"></div>
      </div>

      {/* Right Gradient & Button */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 via-gray-50/90 to-transparent z-10 flex items-center justify-end transition-all duration-300 ${
          showRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => scroll('right')}
          className="bg-white rounded-full p-2.5 shadow-lg border border-gray-100 text-brand-dark hover:text-brand-primary hover:scale-110 active:scale-95 transition-all mr-1"
          aria-label="Scroll Right"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};