'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import SplashScreen from './SplashScreen';
import { track } from './lib/track';
import ImageCarousel from './ImageCarousel';
import RichDescription from './RichDescription';
import AboutSection from './AboutSection';
import ReviewsSection, { type Review } from './ReviewsSection';
import { WhatsAppIcon, FacebookIcon, TikTokIcon, MessengerIcon, PhoneIcon, MailIcon } from './Icons';

// --- CONFIGURATION SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPES & CONSTANTES (non exportés : un page.tsx ne doit exporter que le composant) ---
interface Product {
  id: number | string;
  title: string;
  category: 'table' | 'deco';
  price: number;
  image_url: string;
  images?: string[] | null;
  description: string;
  is_urgent?: boolean;
  is_available?: boolean;
}

const CATEGORIES = [
  { key: 'all', label: 'Tous' },
  { key: 'table', label: 'Arts de la table' },
  { key: 'deco', label: 'Décoration' },
  { key: 'urgence', label: '⚡ Packs d’Urgence' },
] as const;

const CONTACT_INFO = {
  phone: '+237 6 93 44 73 04',
  whatsapp: '237693447304',
  email: 'sandjahandmade@gmail.com',
  facebook: 'https://web.facebook.com/sandjahandmade/',
  tiktok: 'https://www.tiktok.com/@sandjahandmade',
  messenger: 'Sandja handmade',
  messengerUrl: 'https://m.me/sandjahandmade',
};

// Adresse publique du site (utilisée dans les liens envoyés sur WhatsApp)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sandja-handmade.vercel.app';

const NAV = [
  { href: '#catalogue', label: 'Créations' },
  { href: '#urgence', label: '⚡ Packs d’Urgence', accent: true },
  { href: '#concept', label: 'Savoir-faire' },
  { href: '#apropos', label: 'L’artisane' },
  { href: '#avis', label: 'Avis' },
  { href: '#contact', label: 'Contact' },
];

const ITEMS_PER_PAGE = 6;

// Numéros de pages à afficher : 1 … 4 5 6 … 12
const pageList = (cur: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, cur - 1);
  const end = Math.min(total - 1, cur + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
};

// Toutes les photos d'un article (la première = photo principale)
const getImages = (p: Product) => (p.images && p.images.length > 0 ? p.images : [p.image_url]);

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Chargement des produits (le splash se retire quand `loading` passe à false)
  useEffect(() => {
    fetchProducts();
  }, []);

  // Avis clients (la section reste cachée tant qu'il n'y en a pas)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });
      if (!error && data) setReviews(data as Review[]);
    })();
  }, []);

  // Comptage de la visite (une fois par session)
  useEffect(() => {
    track('visit');
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('id', { ascending: false }); // les nouveautés d'abord

      if (error) throw error;
      if (data) setProducts(data);
    } catch (err) {
      console.error('Erreur chargement produits :', err);
    } finally {
      setLoading(false);
    }
  };

  // "Tous" n'affiche pas les packs d'urgence (ils ont leur propre section) : plus de doublons
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'urgence') return p.is_urgent === true;
    if (selectedCategory === 'all') return !p.is_urgent;
    return p.category === selectedCategory && !p.is_urgent;
  });

  const urgentProducts = products.filter((p) => p.is_urgent);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    setCurrentPage(1);
    track('category_click', { label: key });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWhatsAppLink = (product: Product) => {
    const formattedPrice = Number(product.price || 0).toLocaleString('fr-FR');
    // Le lien ouvre la fiche de l'article (photo, prix, description) sur le site
    const productLink = `${SITE_URL}/produit/${product.id}`;

    const message = product.is_urgent
      ? `Bonjour Sandja Handmade, je suis intéressé(e) par le pack d'urgence disponible immédiatement : "${product.title}" (${formattedPrice} FCFA).\n\nLien de l'article : ${productLink}\n\nEst-il toujours disponible pour un retrait rapide ?`
      : `Bonjour Sandja Handmade, je suis intéressé(e) par votre création sur commande : "${product.title}" (${formattedPrice} FCFA).\n\nLien de l'article : ${productLink}\n\nJe souhaite passer commande (délai indicatif de 12 jours). Est-ce possible ?`;

    return `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85A32] focus-visible:ring-offset-2';

  return (
    <>
      {/* Écran de chargement : se superpose au site, qui se charge en dessous */}
      <SplashScreen ready={!loading} />

      <div className="bg-[#FAF8F5] text-stone-800 font-sans antialiased flex flex-col min-h-screen">
        {/* 1. HEADER */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <a href="#" className="flex items-center gap-3" aria-label="Sandja Handmade – accueil">
              <img
                src="/logo.jpg"
                alt="Logo Sandja Handmade"
                width={48}
                height={48}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-[#C85A32]/30 shadow-sm shrink-0"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#1C1917]">Sandja Handmade</span>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#C85A32] font-medium">Art & Motifs Africains</span>
              </span>
            </a>

            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-sm font-medium text-stone-700">
              {NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`transition hover:text-[#C85A32] ${l.accent ? 'text-[#C85A32] font-bold' : ''}`}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=Bonjour%20Sandja%20Handmade,%20je%20souhaite%20en%20savoir%20plus%20sur%20vos%20créations`}
                onClick={() => track('whatsapp_general', { label: 'en-tête' })}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-600 transition shadow-sm ${focusRing}`}
              >
                <WhatsAppIcon className="w-4 h-4" /> Discuter
              </a>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={menuOpen}
                className={`lg:hidden w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center ${focusRing}`}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#1C1917" strokeWidth="1.8" strokeLinecap="round">
                  {menuOpen ? (
                    <path d="M3 3l12 12M15 3L3 15" />
                  ) : (
                    <path d="M2 5h14M2 9h14M2 13h14" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="lg:hidden border-t border-stone-200 bg-white px-4 py-3 flex flex-col">
              {NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-3 text-sm font-medium border-b border-stone-100 last:border-0 ${
                    l.accent ? 'text-[#C85A32] font-bold' : 'text-stone-700'
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}
        </header>

        {/* 2. HERO */}
        <section className="relative bg-[#1C1917] text-white px-4 overflow-hidden min-h-[72svh] flex items-center py-20 sm:py-28">
          <img
            src="/splash-hero.jpeg"
            alt=""
            aria-hidden="true"
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          {/* voile chaud : garde la photo vivante tout en rendant le texte lisible */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917]/85 via-[#2A1D17]/55 to-[#1C1917]/90" />
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-b from-transparent to-[#FAF8F5]" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm text-[#F3B79B] border border-white/20 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider uppercase mb-6">
              Créations artisanales sur commande · Délai : 12 jours
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              Sublimer votre intérieur et votre style aux motifs africains.
            </h1>
            <p className="text-stone-200 text-base sm:text-lg font-light mb-10 max-w-xl mx-auto leading-relaxed">
              Arts de la table, accessoires et décoration façonnés à la main. Commandez sur mesure ou profitez de nos
              packs d’urgence disponibles immédiatement.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <a
                href="#catalogue"
                className={`bg-[#C85A32] hover:bg-[#b04b25] text-white px-8 py-3.5 rounded-full font-medium transition shadow-lg ${focusRing}`}
              >
                Voir le catalogue
              </a>
              <a
                href="#urgence"
                className={`border border-white/50 text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-medium transition backdrop-blur-sm ${focusRing}`}
              >
                ⚡ Packs d’Urgence
              </a>
            </div>
          </div>
        </section>

        {/* 3. CATALOGUE */}
        <section id="catalogue" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1917]">Nos Collections</h2>
              <p className="text-stone-500 mt-2 text-sm max-w-xl">
                Réalisé sur commande en 12 jours, ou disponible immédiatement dans les packs d’urgence.
              </p>
            </div>

            {/* Filtres : défilement horizontal sur mobile */}
            <div className="flex gap-2 overflow-x-auto md:flex-wrap pb-1 -mx-4 px-4 md:mx-0 md:px-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`shrink-0 px-5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${focusRing} ${
                    selectedCategory === cat.key
                      ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-sm'
                      : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                  <div className="aspect-[3/2] bg-stone-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-stone-200 rounded w-2/3" />
                    <div className="h-3 bg-stone-100 rounded w-full" />
                    <div className="h-10 bg-stone-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {currentProducts.map((item) => (
                <div
                  key={item.id}
                  id={`produit-${item.id}`}
                  className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group scroll-mt-28"
                >
                  <div>
                    <ImageCarousel images={getImages(item)} alt={item.title} className="aspect-[3/2]">
                      <span className="absolute top-3 left-3 bg-stone-900/80 text-white text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                        ⏳ Sur commande (12 jours)
                      </span>
                    </ImageCarousel>
                    <div className="p-4">
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-base text-[#1C1917] leading-snug">{item.title}</h3>
                        <span className="font-serif font-bold text-[#C85A32] whitespace-nowrap text-sm">
                          {Number(item.price || 0).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <RichDescription text={item.description} moreHref={`/produit/${item.id}`} className="text-stone-500 text-xs mb-3" />
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <a
                      href={getWhatsAppLink(item)}
                      onClick={() => track('whatsapp_click', { productId: item.id, label: item.title })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-[#25D366] text-white py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition duration-300 shadow-sm ${focusRing}`}
                    >
                      <WhatsAppIcon className="w-4 h-4" /> Je suis intéressé(e)
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
              <p className="text-stone-700 text-base font-semibold">Aucun article trouvé dans cette catégorie.</p>
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className="text-xs text-[#C85A32] underline font-medium mt-2"
              >
                Afficher toutes les créations
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-stone-200">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 transition"
              >
                ← Précédent
              </button>
              {pageList(currentPage, totalPages).map((n, i) =>
                n === '…' ? (
                  <span key={`gap-${i}`} className="w-6 text-center text-xs text-stone-400">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handlePageChange(n)}
                    aria-current={currentPage === n ? 'page' : undefined}
                    className={`w-9 h-9 rounded-xl text-xs font-semibold transition ${
                      currentPage === n
                        ? 'bg-[#C85A32] text-white shadow-sm'
                        : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 transition"
              >
                Suivant →
              </button>
            </div>
          )}
        </section>

        {/* 4. PACKS D'URGENCE */}
        <section id="urgence" className="bg-amber-50/60 py-16 border-t border-b border-amber-200/60 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block px-3 py-1 bg-amber-600 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                ⚡ Service Express
              </span>
              <h2 className="font-serif text-3xl font-bold text-stone-900">Packs d’Urgence (Disponibles Immédiatement)</h2>
              <p className="text-stone-600 text-sm mt-2">
                Besoin d’un cadeau ou d’une tenue sans attendre les 12 jours de confection ? Choisissez parmi nos
                pièces en stock, prêtes à partir.
              </p>
            </div>

            {urgentProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {urgentProducts.map((item) => (
                  <div
                    key={`urgence-${item.id}`}
                    id={`produit-${item.id}`}
                    className="bg-white rounded-xl overflow-hidden border border-amber-300 shadow-md flex flex-col justify-between group scroll-mt-28"
                  >
                    <div>
                      <ImageCarousel images={getImages(item)} alt={item.title} className="aspect-[3/2]">
                      <span className="absolute top-3 left-3 bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                          ⚡ En stock
                        </span>
                    </ImageCarousel>
                      <div className="p-4">
                        <div className="flex items-baseline justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-base text-stone-900 leading-snug">{item.title}</h3>
                          <span className="font-serif font-bold text-[#C85A32] whitespace-nowrap text-sm">
                            {Number(item.price || 0).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                        <RichDescription text={item.description} moreHref={`/produit/${item.id}`} className="text-stone-600 text-xs mb-3" />
                      </div>
                    </div>
                    <div className="p-4 pt-0">
                      <a
                        href={getWhatsAppLink(item)}
                      onClick={() => track('whatsapp_click', { productId: item.id, label: item.title })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm ${focusRing}`}
                      >
                        <WhatsAppIcon className="w-4 h-4" /> Réserver en urgence via WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/80 rounded-2xl border border-amber-200 max-w-xl mx-auto p-8 shadow-sm">
                <span className="text-3xl mb-2 block">✨</span>
                <h3 className="font-semibold text-stone-800 text-base">Tous nos packs d’urgence ont trouvé preneur !</h3>
                <p className="text-stone-500 text-xs mt-1">
                  De nouveaux packs sont en préparation. Revenez bientôt ou commandez sur mesure avec un délai de 12 jours.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 5. SAVOIR-FAIRE */}
        <section id="concept" className="bg-white py-20 border-b border-stone-200 scroll-mt-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">
              Un Savoir-Faire Fait Main & Sur Commande
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Chaque création de Sandja Handmade est confectionnée avec soin et passion. Nos pièces personnalisées
              nécessitent un délai de confection de 12 jours pour garantir une qualité irréprochable et un souci du détail unique.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 text-left">
              {[
                { t: 'Façonné à la main', d: 'Chaque pièce est cousue et finie par nos soins, dans des tissus aux motifs africains.' },
                { t: 'Sur commande en 12 jours', d: 'Votre création est réalisée pour vous, avec le temps qu’il faut pour bien faire.' },
                { t: 'Besoin d’urgence ?', d: 'Nos packs en stock partent immédiatement, sans délai de confection.' },
              ].map((b) => (
                <div key={b.t} className="rounded-2xl bg-[#FAF8F5] border border-stone-200 p-6 border-t-4 border-t-[#C85A32]">
                  <h3 className="font-serif text-lg font-bold text-[#1C1917] mb-2">{b.t}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. L'ARTISANE */}
        <AboutSection whatsapp={CONTACT_INFO.whatsapp} onContact={() => track('whatsapp_general', { label: 'profil' })} />

        {/* 7. AVIS CLIENTS */}
        <ReviewsSection reviews={reviews} />

        {/* 8. FOOTER */}
        <footer id="contact" className="bg-[#1C1917] text-stone-400 py-16 px-4 scroll-mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img src="/logo.jpg" alt="Logo Sandja Handmade" width={56} height={56} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/15" />
                <h4 className="font-serif text-2xl text-white font-bold">Sandja Handmade</h4>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Sublimer le patrimoine textile et faire rayonner les motifs africains à travers des créations
                artisanales uniques. (Délai standard : 12 jours).
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                <a
                  href={CONTACT_INFO.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('social_click', { label: 'Facebook' })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-700 text-white hover:border-[#1877F2] hover:bg-[#1877F2]/10 transition"
                >
                  <FacebookIcon className="w-5 h-5 text-[#1877F2]" /> Facebook
                </a>
                <a
                  href={CONTACT_INFO.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('social_click', { label: 'TikTok' })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-700 text-white hover:border-white hover:bg-white/10 transition"
                >
                  <TikTokIcon className="w-5 h-5 text-white" /> TikTok
                </a>
                <a
                  href={CONTACT_INFO.messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('social_click', { label: 'Messenger' })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-700 text-white hover:border-[#0084FF] hover:bg-[#0084FF]/10 transition"
                >
                  <MessengerIcon className="w-5 h-5 text-[#0084FF]" /> Messenger
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Coordonnées directes</h5>
              <ul className="space-y-4 text-sm">
                <li>
                  <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-white transition">
                    <span className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#E8855F] shrink-0">
                      <PhoneIcon className="w-4 h-4" />
                    </span>
                    {CONTACT_INFO.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-center gap-3 hover:text-white transition break-all">
                    <span className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#E8855F] shrink-0">
                      <MailIcon className="w-4 h-4" />
                    </span>
                    {CONTACT_INFO.email}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Commande rapide</h5>
              <p className="text-sm mb-4">Discutez immédiatement de vos projets sur WhatsApp :</p>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=Bonjour,%20je%20souhaite%20commander%20une%20création`}
                onClick={() => track('whatsapp_general', { label: 'pied de page' })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white w-full py-3 rounded-xl font-medium transition text-sm shadow-md"
              >
                <WhatsAppIcon className="w-5 h-5" /> Ouvrir la discussion WhatsApp
              </a>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-stone-800 mt-12 pt-6 text-center text-xs text-stone-500">
            © 2026 Sandja Handmade. Tous droits réservés.
          </div>
        </footer>

        {/* Bouton WhatsApp flottant (pratique sur mobile) */}
        <a
          href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=Bonjour%20Sandja%20Handmade,%20je%20souhaite%20en%20savoir%20plus`}
          onClick={() => track('whatsapp_general', { label: 'bouton flottant' })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discuter sur WhatsApp"
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition"
        >
          <WhatsAppIcon className="w-7 h-7" />
        </a>
      </div>
    </>
  );
}