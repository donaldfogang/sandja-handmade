'use client';

import React, { useState, useMemo } from 'react';

// --- TYPES & CONSTANTES ---
export interface Product {
  id: number;
  title: string;
  category: 'table' | 'mode' | 'deco';
  price: number;
  image: string;
  description: string;
}

export const CATEGORIES = [
  { key: 'all', label: 'Tous' },
  { key: 'table', label: 'Arts de la table' },
  { key: 'mode', label: 'Accessoires & Mode' },
  { key: 'deco', label: 'Décoration' }
] as const;

export const CONTACT_INFO = {
  phone: '+237 6 93 44 73 04',
  whatsapp: '237693447304',
  email: 'sandjahandmade@gmail.com',
  facebook: 'https://web.facebook.com/sandjahandmade/',
  tiktok: 'https://www.tiktok.com/@sandjahandmade',
  messenger: 'Sandja handmade'
};

// --- BASE DE DONNÉES DES PRODUITS ---
export const PRODUCTS: Product[] = [
  // Décoration (3 articles)
  { id: 1, title: "Décoration d'intérieur Motif Africain 1", category: "deco", price: 12000, image: "/images/deco/deco1.jpg", description: "Accessoire de décoration façonné à la main aux motifs raffinés." },
  { id: 2, title: "Élément Décoratif Artisanat 2", category: "deco", price: 15000, image: "/images/deco/deco2.jpg", description: "Création originale pour apporter du cachet à votre espace." },
  { id: 3, title: "Accessoire Déco Sandja", category: "deco", price: 10000, image: "/images/deco/deco3.jpg", description: "Finitions soignées et textiles de qualité." },

  // Arts de la Table (16 articles)
  ...Array.from({ length: 16 }, (_, i) => ({
    id: 10 + i + 1,
    title: `Service de Table Assorti N°${i + 1}`,
    category: "table" as const,
    price: 18000 + (i % 3) * 2000,
    image: `/images/table/service-table${i + 1}.jpg`,
    description: "Set de table complet confectionné avec des imprimés africains élégants."
  })),

  // Babouches (4 articles)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: 40 + i + 1,
    title: `Babouches Artisanal N°${i + 1}`,
    category: "mode" as const,
    price: 8500,
    image: `/images/mode/babouche${i === 2 ? '3' : i + 1}.jpg`,
    description: "Chaussures d'intérieur et d'extérieur légères et confortables."
  })),

  // Sacs (6 articles)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 50 + i + 1,
    title: `Sac à Main & Pochette N°${i + 1}`,
    category: "mode" as const,
    price: 15000,
    image: `/images/mode/sac${i + 1}.jpg`,
    description: "Sac fonctionnel avec détails en pagne traditionnel."
  })),

  // Chapeaux (6 articles)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 60 + i + 1,
    title: `Chapeau Stylisé Sandja N°${i + 1}`,
    category: "mode" as const,
    price: 7000,
    image: `/images/mode/chapeau${i + 1}.jpg`,
    description: "Accessoire tendance apportant une touche culturelle unique."
  })),

  // Colliers (8 articles)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: 70 + i + 1,
    title: `Collier & Bijou Artisanal N°${i + 1}`,
    category: "mode" as const,
    price: 6000,
    image: `/images/mode/colier${i + 1}.jpg`,
    description: "Bijou fait main pour sublimer vos tenues de fête ou du quotidien."
  })),

  // Ensembles Bébé (6 articles)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 80 + i + 1,
    title: `Ensemble Bébé Confort N°${i + 1}`,
    category: "mode" as const,
    price: 12500,
    image: `/images/mode/ensemble-bebe${i + 1}.jpg`,
    description: "Tenue douce et confortable pour enfant en coton imprimé."
  }))
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasError, setHasError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 6;

  // Calcul réactif sécurisé des produits filtrés
  const filteredProducts = useMemo(() => {
    try {
      if (selectedCategory === 'all') return PRODUCTS;
      return PRODUCTS.filter(p => p.category === selectedCategory);
    } catch (err) {
      console.error("[Sandja App] Erreur lors du filtrage :", err);
      setHasError("Erreur lors du filtrage des produits.");
      return [];
    }
  }, [selectedCategory]);

  // Pagination calculée
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Gestionnaire de clic sur les filtres avec logging de sécurité
  const handleCategoryChange = (key: string) => {
    try {
      console.log(`[Sandja App] Changement de catégorie vers : ${key}`);
      setSelectedCategory(key);
      setCurrentPage(1);
      setHasError(null);
    } catch (err) {
      console.error("[Sandja App] Erreur changement catégorie :", err);
      setHasError("Impossible de changer de catégorie pour le moment.");
    }
  };

  // Gestionnaire de changement de page
  const handlePageChange = (newPage: number) => {
    try {
      console.log(`[Sandja App] Changement de page vers : ${newPage}`);
      setCurrentPage(newPage);
      setHasError(null);
      const catalogueEl = document.getElementById('catalogue');
      if (catalogueEl) {
        catalogueEl.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error("[Sandja App] Erreur pagination :", err);
      setHasError("Impossible de changer de page.");
    }
  };

  // Image de remplacement si le fichier n'existe pas dans public/
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.onerror = null; // Évite une boucle infinie
    target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16">Image Sandja Non Disponible</text></svg>';
  };

  const getWhatsAppLink = (productTitle: string, price: number, imageUrl: string) => {
    const formattedPrice = price.toLocaleString('fr-FR');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullImageUrl = `${origin}${imageUrl}`;
    
    const message = `Bonjour Sandja Handmade, je suis intéressé(e) par votre création : "${productTitle}" (${formattedPrice} FCFA).\n\nLien de l'image : ${fullImageUrl}\n\nEst-elle disponible ?`;
    return `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="bg-[#FAF8F5] text-stone-800 font-sans antialiased flex flex-col min-h-screen">
      
      {/* ALERTE SÉCURITÉ / DÉBOGAGE */}
      {hasError && (
        <div className="bg-rose-600 text-white p-3 text-center text-xs font-semibold sticky top-0 z-[60]">
          ⚠️ {hasError} — <button onClick={() => window.location.reload()} className="underline">Recharger la page</button>
        </div>
      )}

      {/* 1. HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="#" className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#1C1917]">Sandja Handmade</span>
            <span className="text-xs uppercase tracking-widest text-[#C85A32] font-medium">Art & Motifs Africains</span>
          </a>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-700">
            <a href="#catalogue" className="hover:text-[#C85A32] transition">Créations</a>
            <a href="#concept" className="hover:text-[#C85A32] transition">Savoir-faire</a>
            <a href="#contact" className="hover:text-[#C85A32] transition">Contact</a>
          </nav>

          <div className="flex items-center space-x-4">
            <a
              href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=Bonjour%20Sandja%20Handmade,%20je%20souhaite%20en%20savoir%20plus%20sur%20vos%20créations`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-600 transition shadow-sm"
            >
              <span>💬 Discuter</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. BANNIÈRE HERO */}
      <section className="relative bg-[#1C1917] text-white py-20 sm:py-28 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-3 py-1 bg-[#C85A32]/20 text-[#C85A32] border border-[#C85A32]/40 rounded-full text-xs font-semibold tracking-wider uppercase mb-6">
            Créations Authentiques & Artisanales
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold leading-tight mb-6">
            Promouvoir la beauté à l’africaine au quotidien.
          </h1>
          <p className="text-stone-300 text-lg sm:text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Accessoires de mode, linge de maison et décoration façonnés à partir de tissus aux motifs africains.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#catalogue" className="bg-[#C85A32] hover:bg-[#b04b25] text-white px-8 py-3.5 rounded-full font-medium transition shadow-lg">
              Découvrir les réalisations
            </a>
          </div>
        </div>
      </section>

      {/* 3. SECTION CATALOGUE */}
      <section id="catalogue" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1917]">Galerie des Réalisations</h2>
            <p className="text-stone-500 mt-2 text-sm">Cliquez sur un article pour nous contacter directement sur WhatsApp.</p>
          </div>

          {/* Filtres par Catégorie */}
          <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                type="button"
                className={`px-5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
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

        {/* Grille des articles ou Message d'absence d'articles */}
        {currentProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentProducts.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col group justify-between">
                <div>
                  <div className="relative overflow-hidden aspect-[4/3] bg-stone-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-[#1C1917] leading-snug">{item.title}</h3>
                      <span className="font-serif font-bold text-[#C85A32] whitespace-nowrap text-base">
                        {item.price.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <p className="text-stone-500 text-xs leading-relaxed mb-4">{item.description}</p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <a
                    href={getWhatsAppLink(item.title, item.price, item.image)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-[#25D366] text-white py-3 px-4 rounded-xl text-xs font-semibold tracking-wide transition duration-300 shadow-sm"
                  >
                    <span>💬 Je suis intéressé(e)</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-stone-700 text-base font-semibold">
              Aucun article de cette catégorie trouvé.
            </p>
            <p className="text-stone-400 text-xs mt-1 mb-4">
              Veuillez sélectionner une autre catégorie ci-dessus.
            </p>
            <button
              onClick={() => handleCategoryChange('all')}
              className="text-xs text-[#C85A32] underline font-medium"
            >
              Afficher toutes les créations
            </button>
          </div>
        )}

        {/* Barre de Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-stone-200">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              type="button"
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 transition cursor-pointer"
            >
              ← Précédent
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                type="button"
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#C85A32] text-white shadow-sm'
                    : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-50'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              type="button"
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 transition cursor-pointer"
            >
              Suivant →
            </button>
          </div>
        )}
      </section>

      {/* 4. SECTION SAVOIR-FAIRE */}
      <section id="concept" className="bg-white py-16 border-t border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-[#1C1917] mb-4">Un Savoir-Faire Fait Main</h2>
          <p className="text-stone-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Chaque création de Sandja Handmade est confectionnée avec soin et passion. Nous mettons à l'honneur les étoffes et imprimés traditionnels pour créer des pièces uniques et raffinées, adaptées à votre quotidien.
          </p>
        </div>
      </section>

      {/* 5. FOOTER / PIED DE PAGE */}
      <footer id="contact" className="bg-[#1C1917] text-stone-400 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h4 className="font-serif text-2xl text-white font-bold mb-4">Sandja Handmade</h4>
            <p className="text-sm leading-relaxed mb-6">
              Sublimer le patrimoine textile et faire rayonner les motifs africains à travers des créations artisanales uniques.
            </p>
            <div className="flex items-center space-x-4 text-white text-sm font-medium">
              <a href={CONTACT_INFO.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#C85A32] transition">Facebook</a>
              <span>•</span>
              <a href={CONTACT_INFO.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-[#C85A32] transition">TikTok</a>
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Coordonnées directes</h5>
            <ul className="space-y-3 text-sm">
              <li>📞 {CONTACT_INFO.phone}</li>
              <li>✉️ {CONTACT_INFO.email}</li>
              <li>💬 Messenger : {CONTACT_INFO.messenger}</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Commande Rapide</h5>
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

    </div>
  );
}