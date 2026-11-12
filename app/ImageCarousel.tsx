'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16">Image Sandja Non Disponible</text></svg>';

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK;
};

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} />
  </svg>
);

/* ---------- Visionneuse plein écran : l'image entière, avec une croix pour fermer ---------- */
function Lightbox({ images, start, alt, onClose }: { images: string[]; start: number; alt: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const count = images.length;
  const touchX = useRef<number | null>(null);

  const next = () => setI((v) => (v + 1) % count);
  const prev = () => setI((v) => (v - 1 + count) % count);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && count > 1) next();
      if (e.key === 'ArrowLeft' && count > 1) prev();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const navBtn =
    'absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-sm flex items-center justify-center transition';

  return (
    <div role="dialog" aria-modal="true" aria-label={`Photos de ${alt}`} className="fixed inset-0 z-[10000] bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{alt}</p>
          {count > 1 && <p className="text-xs text-white/60">{i + 1} / {count}</p>}
        </div>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Fermer l’image"
          className="shrink-0 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-20"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
          touchX.current = null;
        }}
      >
        <img
          key={images[i]}
          src={images[i]}
          alt={count > 1 ? `${alt} – photo ${i + 1} sur ${count}` : alt}
          draggable={false}
          onError={onImgError}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain select-none rounded-lg shadow-2xl"
        />
        {count > 1 && (
          <>
            <button type="button" aria-label="Photo précédente" onClick={(e) => { e.stopPropagation(); prev(); }} className={`${navBtn} left-2 sm:left-5`}>
              <Chevron dir="left" />
            </button>
            <button type="button" aria-label="Photo suivante" onClick={(e) => { e.stopPropagation(); next(); }} className={`${navBtn} right-2 sm:right-5`}>
              <Chevron dir="right" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-2 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {images.map((src, k) => (
            <button
              key={src + k}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Voir la photo ${k + 1}`}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden transition ${k === i ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'}`}
            >
              <img src={src} alt="" onError={onImgError} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Carrousel ---------- */
type Props = {
  images: string[];
  alt: string;
  /** dimensions du conteneur, ex : "aspect-[4/3]" */
  className?: string;
  /** "cover" remplit le cadre (cartes) ; "contain" montre la photo entière (fiche article) */
  fit?: 'cover' | 'contain';
  /** contenu affiché quand il n'y a aucune image (aperçu admin) */
  empty?: React.ReactNode;
  /** badges superposés à la photo */
  children?: React.ReactNode;
};

export default function ImageCarousel({ images, alt, className = 'aspect-[4/3]', fit = 'cover', empty, children }: Props) {
  const list = images.filter(Boolean);
  const count = list.length;
  const key = list.join('|');
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);

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

  const slideAlt = (i: number) => (count > 1 ? `${alt} – photo ${i + 1} sur ${count}` : alt);

  return (
    <div
      className={`relative overflow-hidden bg-stone-100 ${className}`}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
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
          {list.map((src, i) =>
            fit === 'contain' ? (
              <div key={src + i} className="relative h-full w-full shrink-0 snap-center snap-always">
                {/* fond flou : la photo entière reste visible, sans bandes vides */}
                <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover blur-2xl scale-125 opacity-60" />
                <img
                  src={src}
                  alt={slideAlt(i)}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  onError={onImgError}
                  onClick={() => setZoom(i)}
                  className="relative h-full w-full object-contain cursor-zoom-in"
                />
              </div>
            ) : (
              <img
                key={src + i}
                src={src}
                alt={slideAlt(i)}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                onError={onImgError}
                onClick={() => setZoom(i)}
                className="h-full w-full shrink-0 snap-center snap-always object-cover cursor-zoom-in"
              />
            )
          )}
        </div>
      )}

      {count > 0 && (
        <button
          type="button"
          aria-label="Agrandir la photo"
          onClick={() => setZoom(index)}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      )}

      {count > 1 && (
        <>
          <button type="button" aria-label="Photo précédente" onClick={() => go(index - 1)} className={`${arrow} left-2`}>
            <Chevron dir="left" />
          </button>
          <button type="button" aria-label="Photo suivante" onClick={() => go(index + 1)} className={`${arrow} right-2`}>
            <Chevron dir="right" />
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

      {zoom !== null && typeof document !== 'undefined' &&
        createPortal(<Lightbox images={list} start={zoom} alt={alt} onClose={() => setZoom(null)} />, document.body)}
    </div>
  );
}