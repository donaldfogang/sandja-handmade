'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import SplashScreen from './SplashScreen';

// --- CONFIGURATION SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// --- TYPES & CONSTANTES (non exportés : un page.tsx ne doit exporter que le composant) ---
interface Product {
  id: number | string;
  title: string;
  category: 'table' | 'deco';
  price: number;
  image_url: string;
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
  { href: '#contact', label: 'Contact' },
];

const ITEMS_PER_PAGE = 9;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Chargement des produits (le splash se retire quand `loading` passe à false)
  useEffect(() => {
    fetchProducts();
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
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16">Image Sandja Non Disponible</text></svg>';
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
            <a href="#" className="flex flex-col leading-tight">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
                Sandja Handmade
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#C85A32] font-medium">
                Art & Motifs Africains
              </span>
            </a>

            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-700">
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
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-600 transition shadow-sm ${focusRing}`}
              >
                💬 Discuter
              </a>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={menuOpen}
                className={`md:hidden w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center ${focusRing}`}
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
            <nav className="md:hidden border-t border-stone-200 bg-white px-4 py-3 flex flex-col">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-stone-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-stone-200 rounded w-2/3" />
                    <div className="h-3 bg-stone-100 rounded w-full" />
                    <div className="h-10 bg-stone-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentProducts.map((item) => (
                <div
                  key={item.id}
                  id={`produit-${item.id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group scroll-mt-28"
                >
                  <div>
                    <div className="relative overflow-hidden aspect-[4/3] bg-stone-100">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-stone-900/80 text-white text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                        ⏳ Sur commande (12 jours)
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-[#1C1917] leading-snug">{item.title}</h3>
                        <span className="font-serif font-bold text-[#C85A32] whitespace-nowrap text-base">
                          {Number(item.price || 0).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <p className="text-stone-500 text-xs leading-relaxed mb-4">{item.description}</p>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <a
                      href={getWhatsAppLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-[#25D366] text-white py-3 px-4 rounded-xl text-xs font-semibold tracking-wide transition duration-300 shadow-sm ${focusRing}`}
                    >
                      💬 Je suis intéressé(e)
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
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
              ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {urgentProducts.map((item) => (
                  <div
                    key={`urgence-${item.id}`}
                    id={`produit-${item.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-amber-300 shadow-md flex flex-col justify-between group scroll-mt-28"
                  >
                    <div>
                      <div className="relative overflow-hidden aspect-[4/3] bg-stone-100">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <span className="absolute top-3 left-3 bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                          ⚡ En stock
                        </span>
                      </div>
                      <div className="p-5">
                        <div className="flex items-baseline justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-stone-900 leading-snug">{item.title}</h3>
                          <span className="font-serif font-bold text-[#C85A32] whitespace-nowrap text-base">
                            {Number(item.price || 0).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                        <p className="text-stone-600 text-xs leading-relaxed mb-4">{item.description}</p>
                      </div>
                    </div>
                    <div className="p-5 pt-0">
                      <a
                        href={getWhatsAppLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm ${focusRing}`}
                      >
                        ⚡ Réserver en urgence via WhatsApp
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

        {/* 6. FOOTER */}
        <footer id="contact" className="bg-[#1C1917] text-stone-400 py-16 px-4 scroll-mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-serif text-2xl text-white font-bold mb-4">Sandja Handmade</h4>
              <p className="text-sm leading-relaxed mb-6">
                Sublimer le patrimoine textile et faire rayonner les motifs africains à travers des créations
                artisanales uniques. (Délai standard : 12 jours).
              </p>
              <div className="flex items-center gap-3 text-sm font-medium">
                <a
                  href={CONTACT_INFO.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full border border-stone-700 text-white hover:border-[#C85A32] hover:text-[#C85A32] transition"
                >
                  Facebook
                </a>
                <a
                  href={CONTACT_INFO.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full border border-stone-700 text-white hover:border-[#C85A32] hover:text-[#C85A32] transition"
                >
                  TikTok
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Coordonnées directes</h5>
              <ul className="space-y-3 text-sm">
                <li>
                  📞{' '}
                  <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`} className="hover:text-white transition">
                    {CONTACT_INFO.phone}
                  </a>
                </li>
                <li>
                  ✉️{' '}
                  <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-white transition break-all">
                    {CONTACT_INFO.email}
                  </a>
                </li>
                <li>
                  💬 Messenger :{' '}
                  <a href={CONTACT_INFO.messengerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                    {CONTACT_INFO.messenger}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Commande rapide</h5>
              <p className="text-sm mb-4">Discutez immédiatement de vos projets sur WhatsApp :</p>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=Bonjour,%20je%20souhaite%20commander%20une%20création`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white w-full py-3 rounded-xl font-medium transition text-sm shadow-md"
              >
                💬 Ouvrir la discussion WhatsApp
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
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discuter sur WhatsApp"
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white text-2xl flex items-center justify-center shadow-lg transition"
        >
          💬
        </a>
      </div>
    </>
  );
}