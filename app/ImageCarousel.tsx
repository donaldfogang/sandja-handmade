'use client';

import React, { useEffect, useRef, useState } from 'react';

const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16">Image Sandja Non Disponible</text></svg>';

type Props = {
  images: string[];
  alt: string;
  /** dimensions du conteneur, ex : "aspect-[4/3]" */
  className?: string;
  /** contenu affiché quand il n'y a aucune image (aperçu admin) */
  empty?: React.ReactNode;
  /** badges superposés à la photo */
  children?: React.ReactNode;
};

export default function ImageCarousel({ images, alt, className = 'aspect-[4/3]', empty, children }: Props) {
  const list = images.filter(Boolean);
  const count = list.length;
  const key = list.join('|');
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Retour à la première photo quand la liste change
  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
    setIndex(0);
  }, [key]);

  const go = (i: number) => {
    const el = scroller.current;
    if (!el || count < 2) return;
    const n = (i + count) % count;
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scroller.current;
    if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const arrow =
    'absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-sm flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <div
      className={`relative overflow-hidden bg-stone-100 ${className}`}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(index - 1);
        if (e.key === 'ArrowRight') go(index + 1);
      }}
    >
      {count === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {empty ?? <img src={FALLBACK} alt={alt} className="w-full h-full object-cover" />}
        </div>
      ) : (
        <div
          ref={scroller}
          onScroll={onScroll}
          className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {list.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={count > 1 ? `${alt} – photo ${i + 1} sur ${count}` : alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK;
              }}
              className="h-full w-full shrink-0 snap-center snap-always object-cover"
            />
          ))}
        </div>
      )}

      {count > 1 && (
        <>
          <button type="button" aria-label="Photo précédente" onClick={() => go(index - 1)} className={`${arrow} left-2`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          <button type="button" aria-label="Photo suivante" onClick={() => go(index + 1)} className={`${arrow} right-2`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Voir la photo ${i + 1}`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}

      {children}
    </div>
  );
}