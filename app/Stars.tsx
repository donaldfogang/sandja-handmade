'use client';

import React, { useState } from 'react';

const STAR = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

export function StarIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d={STAR} />
    </svg>
  );
}

/** Étoiles en lecture seule, avec remplissage partiel (4,6 = 4 étoiles et demie environ). */
export function StarRating({ value, className = 'w-4 h-4' }: { value: number; className?: string }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  const row = [0, 1, 2, 3, 4].map((i) => <StarIcon key={i} className={className} />);
  return (
    <span className="relative inline-flex" role="img" aria-label={`${value.toFixed(1).replace('.', ',')} sur 5`}>
      <span className="flex text-stone-300">{row}</span>
      <span className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-400" style={{ width: `${pct}%` }}>
        {row}
      </span>
    </span>
  );
}

/** Sélecteur d'étoiles cliquable (comme sur le Play Store) : souris, tactile et clavier. */
export function StarPicker({ value, onChange, className = 'w-8 h-8' }: { value: number; onChange: (n: number) => void; className?: string }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div role="radiogroup" aria-label="Note sur 5" className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') onChange(Math.min(5, (value || 0) + 1));
            if (e.key === 'ArrowLeft') onChange(Math.max(1, (value || 2) - 1));
          }}
          className="p-0.5 rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <StarIcon className={`${className} transition-colors ${n <= active ? 'text-amber-400' : 'text-stone-300'}`} />
        </button>
      ))}
    </div>
  );
}