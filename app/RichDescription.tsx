'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Block = { type: 'p'; text: string } | { type: 'ul'; items: string[] };

// Les descriptions saisies d'un seul bloc sont découpées automatiquement :
// sections « Utilisation : … », « Composition : … » sur leur propre ligne, et
// contenus numérotés (« 6 Sous-plats 6 Porte-couverts… ») en liste à puces.
function autoStructure(raw: string): string {
  const text = raw.replace(/\r\n?/g, '\n').trim();
  if (text.includes('\n')) return text; // l'utilisatrice a déjà mis en forme son texte

  let t = text
    .replace(/\s+(?=(?:Utilisation|Composition|Dimensions?|Matières?|Contenu|Entretien|Couleurs?|Tailles?|Poids|Livraison|Détails?)\s?:)/g, '\n')
    .replace(/\s+(?=Le (?:pack|set|lot|service|coffret) (?:contient|comprend))/g, '\n');

  t = t
    .split('\n')
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx < 0) return line;
      const head = line.slice(0, idx + 1);
      const rest = line.slice(idx + 1).trim();
      const count = (rest.match(/(?:^|\s)\d+\s+[A-ZÀ-Ý]/g) || []).length;
      if (count < 3) return line;
      const items = rest.split(/\s(?=\d+\s+[A-ZÀ-Ý])/).map((i) => i.trim()).filter(Boolean);
      return head + '\n' + items.map((i) => `- ${i}`).join('\n');
    })
    .join('\n');

  return t;
}

export function parseDescription(raw: string): Block[] {
  const lines = autoStructure(raw).split('\n').map((l) => l.trim());
  const blocks: Block[] = [];
  for (const line of lines) {
    if (!line) continue;
    const m = line.match(/^[-•*–·]\s+(.*)$/);
    if (m) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'ul') last.items.push(m[1]);
      else blocks.push({ type: 'ul', items: [m[1]] });
    } else {
      blocks.push({ type: 'p', text: line });
    }
  }
  return blocks;
}

// « Utilisation : … » → le mot d'étiquette est mis en gras
function Line({ text }: { text: string }) {
  const m = text.match(/^([^:]{2,28}?)\s?:\s+(.+)$/);
  if (m && m[1].trim().split(/\s+/).length <= 3) {
    return (
      <>
        <strong className="font-semibold text-stone-800">{m[1].trim()} :</strong> {m[2]}
      </>
    );
  }
  return <>{text}</>;
}

type Props = {
  text: string;
  className?: string; // taille et couleur du texte
  /** limite l'affichage à `lines` lignes avec un bouton « Voir plus » */
  clamp?: boolean;
  lines?: number;
  /** si renseigné, « Voir plus » ouvre cette page (la fiche article) au lieu de déplier le texte */
  moreHref?: string;
};

export default function RichDescription({ text, className = '', clamp = true, lines = 5, moreHref }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [full, setFull] = useState(0);
  const blocks = parseDescription(text || '');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !clamp) return;
    const measure = () => {
      const lineH = parseFloat(getComputedStyle(el).lineHeight) || 20;
      setFull(el.scrollHeight);
      setOverflowing(el.scrollHeight > lineH * lines + 12);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, clamp, lines]);

  if (blocks.length === 0) return null;

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={ref}
          id={undefined}
          className="overflow-hidden leading-relaxed space-y-2 transition-[max-height] duration-300 ease-out"
          style={clamp ? { maxHeight: open ? full : `calc(${lines * 1.625}em + 0.5rem)` } : undefined}
        >
          {blocks.map((b, i) =>
            b.type === 'ul' ? (
              <ul key={i} className="list-disc pl-4 space-y-0.5 marker:text-[#C85A32]">
                {b.items.map((it, k) => (
                  <li key={k}>
                    <Line text={it} />
                  </li>
                ))}
              </ul>
            ) : (
              <p key={i}>
                <Line text={b.text} />
              </p>
            )
          )}
        </div>
        {clamp && overflowing && !open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white via-white/70 to-transparent" />
        )}
      </div>

      {clamp && overflowing && moreHref && (
        <Link
          href={moreHref}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#C85A32] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85A32] rounded"
        >
          Voir plus
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 2l4 4-4 4" />
          </svg>
        </Link>
      )}

      {clamp && overflowing && !moreHref && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#C85A32] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85A32] rounded"
        >
          {open ? 'Voir moins' : 'Voir plus'}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
            <path d="M2 4l4 4 4-4" />
          </svg>
        </button>
      )}
    </div>
  );
}