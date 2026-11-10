'use client';

import React, { useEffect, useState } from 'react';

type Props = {
  /** passe à true quand tes produits sont chargés */
  ready: boolean;
  /** durée minimale d'affichage en ms (évite un flash trop rapide) */
  minDuration?: number;
};

// Contour du Cameroun tracé à partir de la carte fournie (viewBox -4 -4 220 308)
const CAMEROUN =
  'M205.5 300.0C196.1 299.4 170.3 294.9 152.4 293.1C134.5 291.3 111.3 289.1 98.4 289.3C85.4 289.6 80.8 293.9 74.5 294.6C68.3 295.2 67.7 292.4 60.8 293.1C53.9 293.8 39.9 298.3 33.3 299.0C26.8 299.8 24.1 298.2 21.4 297.6C18.8 296.9 18.2 296.3 17.5 295.1C16.7 293.9 14.0 292.8 16.8 290.4C19.6 288.0 30.6 284.0 34.2 280.8C37.9 277.6 38.0 274.3 38.7 271.3C39.4 268.4 41.2 267.8 38.5 263.1C35.8 258.3 28.3 246.9 22.5 242.9C16.8 238.9 7.8 240.4 4.0 238.8C0.3 237.3 0.6 236.6 0.0 233.8C-0.6 230.9 -0.7 226.0 0.5 221.8C1.8 217.7 5.6 214.2 7.4 209.0C9.3 203.8 6.4 198.0 11.7 190.7C17.1 183.4 34.0 170.1 39.7 165.3C45.5 160.5 42.9 162.8 46.2 161.9C49.4 161.0 54.7 158.8 59.0 159.9C63.3 161.1 68.4 167.2 71.8 169.0C75.2 170.8 76.8 170.8 79.1 170.8C81.4 170.7 83.7 169.9 85.5 168.8C87.4 167.7 87.4 171.3 90.3 164.1C93.3 157.0 98.5 134.7 103.3 125.7C108.1 116.7 116.1 114.7 119.2 110.1C122.3 105.5 120.3 101.9 121.7 98.2C123.2 94.5 126.4 92.1 128.1 88.1C129.8 84.1 129.3 80.2 131.8 74.4C134.4 68.6 140.7 57.7 143.5 53.3C146.3 48.9 145.9 49.7 148.7 47.8C151.6 45.9 157.9 43.9 160.6 41.8C163.4 39.7 164.5 38.0 165.4 35.0C166.2 32.0 167.7 28.6 165.9 24.0C164.1 19.4 156.4 11.2 154.5 7.5C152.7 3.8 154.4 3.3 155.0 2.0C155.5 0.8 155.1 -1.4 157.9 0.0C160.7 1.4 167.9 5.0 171.5 10.3C175.1 15.5 177.7 25.2 179.5 31.3C181.3 37.4 180.1 42.5 182.4 46.9C184.7 51.3 192.2 53.0 193.4 57.9C194.6 62.8 192.4 71.6 189.4 76.2C186.4 80.8 178.6 81.9 175.3 85.7C172.0 89.5 170.5 95.5 169.8 99.1C169.1 102.7 168.4 103.2 171.0 107.4C173.5 111.5 181.6 118.3 185.1 123.8C188.5 129.3 193.3 132.5 191.6 140.3C189.9 148.1 177.7 164.3 174.9 170.6C172.0 176.8 173.7 173.9 174.5 177.9C175.3 181.8 180.2 189.9 179.6 194.4C179.1 198.8 172.7 201.2 170.9 204.4C169.1 207.6 168.8 210.2 169.0 213.6C169.1 217.0 169.7 220.6 171.7 224.6C173.8 228.6 179.1 232.9 181.4 237.4C183.7 241.9 181.8 246.9 185.4 251.6C188.9 256.3 199.0 261.9 202.8 265.7C206.6 269.4 206.6 270.2 208.1 274.1C209.6 277.9 211.5 284.9 211.7 288.7C211.8 292.5 209.9 295.1 208.9 297.0C207.9 298.8 214.9 300.6 205.5 300.0Z';

export default function SplashScreen({ ready, minDuration = 2400 }: Props) {
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
    <div className={`sp-root ${leaving ? 'sp-out' : ''}`} role="status" aria-live="polite" aria-label="Chargement de Sandja Handmade">
      <style>{css}</style>
      <span className="sp-blob sp-b1" />
      <span className="sp-blob sp-b2" />

      <div className="sp-center">
        <svg className="sp-map" viewBox="-4 -4 220 308" aria-hidden="true">
          <defs>
            <linearGradient id="spFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#D9744A" />
              <stop offset="1" stopColor="#B54A25" />
            </linearGradient>
          </defs>
          <path className="sp-fill" d={CAMEROUN} fill="url(#spFill)" />
          <path className="sp-line" d={CAMEROUN} pathLength={1} />
        </svg>

        <h1 className="sp-title">Sandja</h1>
        <p className="sp-sub">Handmade</p>
        <p className="sp-tag">Créations camerounaises</p>

        <div className="sp-bar"><i /></div>
      </div>
    </div>
  );
}

const css = `
.sp-root{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;overflow:hidden;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  background:radial-gradient(120% 90% at 50% 20%,#FBF6EF 0%,#F1E6DA 60%,#E8D8C8 100%);
  transition:opacity .9s ease,transform .9s ease,filter .9s ease}
.sp-out{opacity:0;transform:scale(1.04);filter:blur(6px);pointer-events:none}
.sp-blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;animation:spFloat 9s ease-in-out infinite alternate}
.sp-b1{width:min(60vw,420px);aspect-ratio:1;background:#E9A27F;top:-12%;left:-14%}
.sp-b2{width:min(55vw,380px);aspect-ratio:1;background:#D8C2A6;bottom:-14%;right:-12%;animation-delay:-4s}
.sp-center{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px}
.sp-map{width:clamp(130px,30vmin,230px);height:auto;overflow:visible;filter:drop-shadow(0 18px 30px rgba(181,74,37,.25))}
.sp-fill{opacity:0;animation:spFillIn 1.2s ease 1.3s forwards}
.sp-line{fill:none;stroke:#B54A25;stroke-width:2.2;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;animation:spDraw 1.9s cubic-bezier(.6,.05,.2,1) .2s forwards}
.sp-title{margin:clamp(18px,4vh,32px) 0 0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-weight:600;
  font-size:clamp(2.4rem,9vw,4rem);line-height:1;color:#2A1D17;letter-spacing:.01em;opacity:0;animation:spUp .9s ease 1s forwards}
.sp-sub{margin:.35rem 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:clamp(1.2rem,4.5vw,1.7rem);
  color:#B54A25;letter-spacing:.18em;opacity:0;animation:spUp .9s ease 1.2s forwards}
.sp-tag{margin:1rem 0 0;font:400 .85rem/1.4 system-ui,sans-serif;color:#7A675B;letter-spacing:.04em;opacity:0;animation:spUp .9s ease 1.5s forwards}
.sp-bar{margin-top:clamp(22px,5vh,40px);width:clamp(110px,28vw,170px);height:2px;border-radius:2px;background:rgba(181,74,37,.18);overflow:hidden;opacity:0;animation:spUp .6s ease 1.7s forwards}
.sp-bar i{display:block;width:40%;height:100%;border-radius:2px;background:#B54A25;animation:spSlide 1.4s ease-in-out infinite}
@keyframes spDraw{to{stroke-dashoffset:0}}
@keyframes spFillIn{to{opacity:.16}}
@keyframes spUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes spSlide{0%{transform:translateX(-110%)}100%{transform:translateX(280%)}}
@keyframes spFloat{to{transform:translate(4%,6%) scale(1.08)}}
@media (prefers-reduced-motion:reduce){
  .sp-root *,.sp-blob{animation-duration:.01s!important;animation-delay:0s!important}
}
`;
