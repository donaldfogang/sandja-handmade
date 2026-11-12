'use client';

import React, { useState } from 'react';
import { StarRating } from './Stars';
import { LightboxPortal } from './ImageCarousel';

export interface Review {
  id: string;
  created_at: string;
  image_url: string;
  rating: number;
  label?: string | null;
  is_visible?: boolean;
}

const INITIAL = 8;

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [all, setAll] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);

  if (reviews.length === 0) return null;

  const total = reviews.length;
  const average = reviews.reduce((s, r) => s + r.rating, 0) / total;
  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  const shown = all ? reviews : reviews.slice(0, INITIAL);

  return (
    <section id="avis" className="bg-white py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-200 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C85A32] mb-3">Avis clients</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1917]">Ils nous font confiance</h2>
          <p className="text-stone-500 text-sm mt-3">Des messages reçus de nos clients, partagés tels quels.</p>
        </div>

        {/* Note moyenne, façon Play Store */}
        <div className="max-w-2xl mx-auto mb-12 rounded-3xl border border-stone-200 bg-[#FAF8F5] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="text-center shrink-0">
            <p className="font-serif text-6xl font-bold text-[#1C1917] leading-none">{average.toFixed(1).replace('.', ',')}</p>
            <div className="mt-3 flex justify-center">
              <StarRating value={average} className="w-5 h-5" />
            </div>
            <p className="text-xs text-stone-500 mt-2">
              {total} avis
            </p>
          </div>
          <div className="w-full space-y-2">
            {counts.map(({ n, c }) => (
              <div key={n} className="flex items-center gap-3 text-xs text-stone-600">
                <span className="w-3 text-right font-semibold">{n}</span>
                <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${(c / total) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-stone-400">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Captures d'écran des avis */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
          {shown.map((r, i) => (
            <figure key={r.id} className="break-inside-avoid mb-4 rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
              <button type="button" onClick={() => setZoom(i)} aria-label="Agrandir cet avis" className="block w-full cursor-zoom-in bg-stone-100">
                <img src={r.image_url} alt={`Avis client noté ${r.rating} sur 5`} loading="lazy" decoding="async" className="w-full h-auto block" />
              </button>
              <figcaption className="px-3 py-2.5 flex items-center justify-between gap-2">
                <StarRating value={r.rating} className="w-4 h-4" />
                {r.label && <span className="text-xs text-stone-500 truncate">{r.label}</span>}
              </figcaption>
            </figure>
          ))}
        </div>

        {total > INITIAL && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              className="px-6 py-2.5 rounded-full border border-stone-300 text-sm font-semibold text-stone-700 hover:border-[#C85A32] hover:text-[#C85A32] transition"
            >
              {all ? 'Voir moins d’avis' : `Voir tous les avis (${total})`}
            </button>
          </div>
        )}
      </div>

      {zoom !== null && <LightboxPortal images={shown.map((r) => r.image_url)} start={zoom} alt="Avis clients" onClose={() => setZoom(null)} />}
    </section>
  );
}