import React from 'react';
import { MenuItem } from '../types';
import { Button } from './Button';

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onIncrement: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
}

// Helper to get emoji based on category (Simple mapping)
const getCategoryIcon = (category: string) => {
  if (category.includes('Ice Cream') || category.includes('Shake')) return '🥤';
  if (category.includes('Falooda')) return '🍧';
  if (category.includes('Limes')) return '🍋';
  if (category.includes('Mutton')) return '🍖';
  if (category.includes('Fish') || category.includes('Prawns')) return '🐟';
  if (category.includes('Chicken')) return '🍗';
  if (category.includes('Rice')) return '🍚';
  if (category.includes('Noodles')) return '🍝';
  if (category.includes('Chinese')) return '🥢';
  if (category.includes('Dinner')) return '🍽️';
  return '🥘';
};

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  quantity, 
  onIncrement, 
  onDecrement 
}) => {
  
  const handleAdd = () => onIncrement(item);
  const handleRemove = () => onDecrement(item);
  const icon = getCategoryIcon(item.category);

  return (
    <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full relative group">
      
      {/* Image Placeholder */}
      <div className="h-28 md:h-32 w-full bg-brand-light rounded-xl mb-3 md:mb-4 flex items-center justify-center text-4xl md:text-5xl transform group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>

      <div className="flex-1 min-h-[4rem]">
        <p className="text-[10px] md:text-xs text-brand-accent font-medium mb-1 truncate">{item.category}</p>
        <h3 className="font-bold text-gray-800 text-base md:text-lg leading-tight mb-1 line-clamp-2">{item.name}</h3>
        <p className="text-gray-400 text-[10px] md:text-xs mb-2 md:mb-3 hidden md:block">Delicious & Authentic</p>
      </div>
      
      <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-50 gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] md:text-xs text-gray-400 line-through">₹{item.price + 20}</span>
          <span className="font-bold text-base md:text-lg text-brand-dark leading-none">₹{item.price}</span>
        </div>
        
        {quantity === 0 ? (
          <Button 
            onClick={handleAdd} 
            variant="outline" 
            size="sm"
            className="!px-4 md:!px-6 !py-1.5 h-8 md:h-9 text-xs md:text-sm"
          >
            Add
          </Button>
        ) : (
          <div className="flex items-center bg-brand-primary rounded-lg p-0.5 h-8 md:h-9">
            <button 
              onClick={handleRemove}
              className="w-6 md:w-7 h-full flex items-center justify-center bg-white text-brand-dark rounded-md hover:bg-gray-100 transition-colors font-bold text-base md:text-lg leading-none pb-0.5"
            >
              -
            </button>
            <span className="w-6 md:w-8 text-center font-bold text-white text-xs md:text-sm leading-none flex items-center justify-center">
              {quantity}
            </span>
            <button 
              onClick={handleAdd}
              className="w-6 md:w-7 h-full flex items-center justify-center bg-white text-brand-dark rounded-md hover:bg-gray-100 transition-colors font-bold text-base md:text-lg leading-none pb-0.5"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};