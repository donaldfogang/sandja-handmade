'use client';

import React, { useEffect, useState } from 'react';

type Props = {
  /** passe à true quand tes produits sont chargés */
  ready: boolean;
  /** durée minimale d'affichage en ms (évite un flash trop rapide) */
  minDuration?: number;
};

// Version « logo seul » : couleurs tirées du logo (orange brûlé #963E0E, or #FEC04E, halo #EFA964)
export default function SplashScreenLogo({ ready, minDuration = 2400 }: Props) {
  const [minElapsed, setMinElapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  // Sortie douce : seulement quand le site est prêt ET que l'animation a eu le temps de jouer
  useEffect(() => {
    if (ready && minElapsed) {
      setLeaving(true);
      const t = setTimeout(() => setMounted(false), 900);
      return () => clearTimeout(t);
    }
  }, [ready, minElapsed]);

  // Bloque le scroll pendant le chargement
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className={`sl-root ${leaving ? 'sl-out' : ''}`} role="status" aria-live="polite" aria-label="Chargement de Sandja Handmade">
      <style>{css}</style>
      <span className="sl-pattern" />

      <div className="sl-center">
        <div className="sl-emblem">
          <span className="sl-ring" />
          <span className="sl-ring sl-ring2" />
          <img className="sl-logo" src="/logo.jpg" alt="Logo Sandja Handmade" width={200} height={200} />
        </div>

        <p className="sl-tag">Créations camerounaises</p>
        <p className="sl-tag2">Art &amp; motifs africains</p>
        <div className="sl-bar"><i /></div>
      </div>
    </div>
  );
}

const css = `
.sl-root{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;overflow:hidden;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  background:radial-gradient(circle at 50% 42%,#B85A1A 0%,#963E0E 36%,#6B2509 68%,#3A1307 100%);
  transition:opacity .9s ease,transform .9s ease,filter .9s ease}
.sl-out{opacity:0;transform:scale(1.05);filter:blur(6px);pointer-events:none}
.sl-pattern{position:absolute;inset:0;opacity:.09;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cpath d='M28 6l22 22-22 22L6 28z' fill='none' stroke='%23FEC04E' stroke-width='1.2'/%3E%3Cpath d='M28 18l10 10-10 10-10-10z' fill='none' stroke='%23FEC04E' stroke-width='.8'/%3E%3C/svg%3E");
  -webkit-mask-image:radial-gradient(circle at 50% 42%,transparent 16%,#000 78%);mask-image:radial-gradient(circle at 50% 42%,transparent 16%,#000 78%)}
.sl-center{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px}
.sl-emblem{position:relative;width:clamp(190px,46vmin,300px);aspect-ratio:1}
.sl-ring{position:absolute;inset:-5%;border-radius:50%;border:1.5px solid rgba(254,192,78,.55);opacity:0;animation:slRipple 2.8s ease-out 1s infinite}
.sl-ring2{animation-delay:2.2s}
.sl-logo{position:relative;display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;opacity:0;transform:scale(.86);
  box-shadow:0 0 0 3px rgba(254,192,78,.9),0 0 0 10px rgba(254,192,78,.14),0 26px 60px rgba(0,0,0,.45),0 0 90px rgba(239,169,100,.35);
  animation:slIn 1s cubic-bezier(.2,.8,.2,1) .15s forwards}
.sl-tag{margin:clamp(24px,5.5vh,42px) 0 0;font:600 .78rem/1.4 system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#FEC04E;opacity:0;animation:slUp .9s ease .9s forwards}
.sl-tag2{margin:.45rem 0 0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-style:italic;font-size:clamp(1.05rem,3.8vw,1.35rem);color:#FBE3C2;opacity:0;animation:slUp .9s ease 1.15s forwards}
.sl-bar{margin-top:clamp(22px,5vh,36px);width:clamp(110px,30vw,180px);height:2px;border-radius:2px;background:rgba(254,192,78,.2);overflow:hidden;opacity:0;animation:slUp .6s ease 1.4s forwards}
.sl-bar i{display:block;width:40%;height:100%;border-radius:2px;background:#FEC04E;animation:slSlide 1.4s ease-in-out infinite}
@keyframes slIn{to{opacity:1;transform:scale(1)}}
@keyframes slUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes slSlide{0%{transform:translateX(-110%)}100%{transform:translateX(280%)}}
@keyframes slRipple{0%{transform:scale(.97);opacity:.7}100%{transform:scale(1.3);opacity:0}}
@media (max-height:540px){.sl-emblem{width:110px}.sl-tag2,.sl-bar{display:none}.sl-tag{margin-top:14px}}
@media (prefers-reduced-motion:reduce){
  .sl-root *{animation-duration:.01s!important;animation-delay:0s!important}
}
`;