import React from 'react';
import { PROFILE } from './profile';
import { WhatsAppIcon } from './Icons';

export default function AboutSection({ whatsapp, onContact }: { whatsapp: string; onContact?: () => void }) {
  const link = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour Sandja Handmade, je souhaite discuter d’une création sur mesure.')}`;

  return (
    <section id="apropos" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20 overflow-hidden">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-14 lg:gap-16 items-center">
        {/* Portrait */}
        <div className="lg:col-span-2">
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="absolute inset-0 translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 rounded-[2rem] border-2 border-[#C85A32]/40" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] bg-stone-200 aspect-[4/5] shadow-xl">
              <img src={PROFILE.photo} alt={`Portrait de ${PROFILE.name}`} className="h-full w-full object-cover" />
            </div>
            <img
              src="/logo.jpg"
              alt=""
              aria-hidden="true"
              width={80}
              height={80}
              className="absolute -bottom-5 -left-3 sm:-left-5 w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-[#FAF8F5] shadow-lg"
            />
          </div>
        </div>

        {/* Présentation */}
        <div className="lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C85A32] mb-3">{PROFILE.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#1C1917] leading-tight">{PROFILE.name}</h2>
          <p className="mt-2 text-lg text-stone-600">{PROFILE.title}</p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700">{PROFILE.age} ans</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700">{PROFILE.location}</span>
          </div>

          <div className="mt-7 space-y-4 text-stone-600 leading-relaxed">
            {PROFILE.bio.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <blockquote className="mt-8 border-l-4 border-[#C85A32] pl-5 font-serif text-xl italic text-[#1C1917] leading-snug">
            « {PROFILE.quote} »
          </blockquote>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {PROFILE.facts.map((f) => (
              <div key={f.label} className="rounded-2xl bg-white border border-stone-200 p-4">
                <p className="font-serif text-lg sm:text-2xl font-bold text-[#C85A32] leading-tight">{f.value}</p>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-1 leading-snug">{f.label}</p>
              </div>
            ))}
          </div>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onContact}
            className="mt-8 inline-flex items-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white px-6 py-3 rounded-full text-sm font-semibold transition shadow-sm"
          >
            <WhatsAppIcon className="w-5 h-5" /> Parler de votre projet avec {PROFILE.name.split(' ')[0]}
          </a>
        </div>
      </div>
    </section>
  );
}