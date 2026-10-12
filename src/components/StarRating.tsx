import { Star } from 'lucide-react';
import { useState } from 'react';

type StarRatingProps = {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly?: boolean;
};

const SIZE_MAP = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12 sm:w-14 sm:h-14',
};

export function StarRating({ value, onChange, size = 'lg', readonly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const displayValue = hover || value;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        const isHovered = star <= hover && !readonly;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-transform duration-200 ${isHovered ? 'scale-125' : 'scale-100'} ${readonly ? '' : 'active:scale-90'}`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`${SIZE_MAP[size]} transition-all duration-300 ${
                filled
                  ? 'fill-gold-400 text-gold-400 drop-shadow-sm'
                  : 'fill-transparent text-slate-300'
              }`}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
