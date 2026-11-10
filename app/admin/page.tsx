'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Empêche la duplication d'instances GoTrueClient dans le navigateur
declare global {
  var cachedSupabase: SupabaseClient | undefined;
}

const supabase =
  global.cachedSupabase ||
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.cachedSupabase = supabase;
}

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

const CAT_LABEL: Record<string, string> = { table: 'Arts de la table', deco: 'Décoration' };

// Réduit la photo avant l'envoi : chargement plus rapide et aperçu WhatsApp plus fiable (< 300 Ko visé)
async function compressImage(file: File, maxSize = 1400, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

const formatSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(b / 1024)} Ko`);

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Formulaire
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'table' | 'deco'>('table');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Aperçu de l'image choisie
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Message de confirmation / d'erreur
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sandja2026') {
      setLoginError(false);
      setIsAuthenticated(true);
      fetchAdminProducts();
    } else {
      setLoginError(true);
    }
  };

  const fetchAdminProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
    if (error) console.error(error);
    if (data) setProducts(data);
    setLoading(false);
  };

  const pickFile = (file: File | null) => {
    if (file && !file.type.startsWith('image/')) {
      setToast({ type: 'err', text: 'Ce fichier n’est pas une image.' });
      return;
    }
    setImageFile(file);
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setIsUrgent(false);
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !imageFile) {
      setToast({ type: 'err', text: 'Renseignez le titre, le prix et choisissez une image.' });
      return;
    }

    try {
      setSaving(true);
      const optimized = await compressImage(imageFile);
      const safeName = optimized.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from('products-images').upload(fileName, optimized);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('products-images').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('products').insert([
        {
          name: title.trim(), // requis par la contrainte de la base de données
          title: title.trim(),
          category,
          price: Number(price),
          description: description.trim(),
          image_url: publicUrlData.publicUrl,
          is_urgent: isUrgent,
          is_available: true,
        },
      ]);
      if (insertError) throw insertError;

      setToast({ type: 'ok', text: `« ${title.trim()} » a été publié sur le site.` });
      resetForm();
      fetchAdminProducts();
    } catch (err: any) {
      setToast({ type: 'err', text: 'Erreur lors de l’ajout : ' + (err?.message || 'inconnue') });
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (p: Product) => {
    const { error } = await supabase.from('products').update({ is_available: !p.is_available }).eq('id', p.id);
    if (error) return setToast({ type: 'err', text: 'Modification impossible : ' + error.message });
    fetchAdminProducts();
  };

  const toggleUrgent = async (p: Product) => {
    const { error } = await supabase.from('products').update({ is_urgent: !p.is_urgent }).eq('id', p.id);
    if (error) return setToast({ type: 'err', text: 'Modification impossible : ' + error.message });
    fetchAdminProducts();
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`Supprimer définitivement « ${p.title} » ?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) return setToast({ type: 'err', text: 'Suppression impossible : ' + error.message });
    setToast({ type: 'ok', text: 'Article supprimé.' });
    fetchAdminProducts();
  };

  const inputCls =
    'w-full px-4 py-3 border border-stone-300 rounded-xl text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 transition';
  const labelCls = 'block text-xs font-semibold text-stone-600 mb-1.5';

  // ---------- CONNEXION ----------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] via-[#F1E6DA] to-[#E8D8C8] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white/90 backdrop-blur p-8 sm:p-10 rounded-3xl shadow-xl border border-white max-w-md w-full">
          <p className="font-serif text-3xl font-bold text-[#1C1917] text-center">Sandja Handmade</p>
          <p className="text-center text-sm text-stone-500 mt-1 mb-8">Espace d’administration</p>

          <label className={labelCls} htmlFor="pwd">Mot de passe</label>
          <input
            id="pwd"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLoginError(false);
            }}
            autoFocus
            className={`${inputCls} ${loginError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
            placeholder="Entrez le mot de passe"
          />
          {loginError && <p className="text-xs text-rose-600 mt-2">Mot de passe incorrect. Réessayez.</p>}

          <button type="submit" className="w-full mt-5 bg-[#1C1917] text-white py-3 rounded-xl font-semibold text-sm hover:bg-stone-800 transition">
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  const stats = {
    total: products.length,
    dispo: products.filter((p) => p.is_available).length,
    urgent: products.filter((p) => p.is_urgent).length,
  };
  const shown = products.filter((p) => p.title?.toLowerCase().includes(search.trim().toLowerCase()));
  const priceNum = Number(price || 0);

  // ---------- TABLEAU DE BORD ----------
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans text-stone-800">
      {toast && (
        <div
          role="status"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${
            toast.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'ok' ? '✓ ' : '⚠ '}
          {toast.text}
        </div>
      )}

      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div>
            <span className="font-serif text-xl font-bold text-[#1C1917]">Sandja Handmade</span>
            <span className="ml-3 text-xs text-stone-500 hidden sm:inline">Administration</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 transition">
              Voir le site
            </a>
            <button onClick={() => setIsAuthenticated(false)} className="text-xs font-semibold px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 transition">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Chiffres clés */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { n: stats.total, l: 'Articles' },
            { n: stats.dispo, l: 'Disponibles' },
            { n: stats.urgent, l: 'Packs d’urgence' },
          ].map((s) => (
            <div key={s.l} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#C85A32]">{s.n}</p>
              <p className="text-xs text-stone-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Formulaire + aperçu */}
        <div className="grid lg:grid-cols-5 gap-6 mb-12">
          <form onSubmit={handleAddProduct} className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200 space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Ajouter un article</h2>
              <p className="text-sm text-stone-500 mt-1">L’aperçu à droite montre l’article tel que vos clients le verront.</p>
            </div>

            {/* Choix de l'image */}
            <div>
              <label className={labelCls}>Photo de l’article *</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
              {previewUrl && imageFile ? (
                <div className="flex items-center gap-4 p-3 border border-emerald-200 bg-emerald-50/60 rounded-2xl">
                  <img src={previewUrl} alt="Image sélectionnée" className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-white shadow-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-900">✓ Image sélectionnée</p>
                    <p className="text-xs text-stone-600 truncate mt-0.5">{imageFile.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{formatSize(imageFile.size)} · optimisée automatiquement à l’envoi</p>
                    <div className="flex gap-3 mt-2">
                      <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-[#C85A32] hover:underline">
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          if (fileRef.current) fileRef.current.value = '';
                        }}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    pickFile(e.dataTransfer.files?.[0] || null);
                  }}
                  className={`w-full border-2 border-dashed rounded-2xl py-10 px-4 text-center transition ${
                    dragging ? 'border-[#C85A32] bg-[#C85A32]/5' : 'border-stone-300 hover:border-[#C85A32] hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-3xl mb-2">📷</span>
                  <span className="block text-sm font-semibold text-stone-700">Cliquez pour choisir une photo</span>
                  <span className="block text-xs text-stone-500 mt-1">ou glissez-la ici</span>
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Titre de l’article *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ex : Set de table royal" />
              </div>
              <div>
                <label className={labelCls}>Catégorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as 'table' | 'deco')} className={inputCls}>
                  <option value="table">Arts de la table</option>
                  <option value="deco">Décoration</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Prix (FCFA) *</label>
                <input type="number" min="0" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} placeholder="Ex : 15000" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Matières, dimensions, détails..." />
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/60 cursor-pointer">
              <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-amber-600" />
              <span>
                <span className="block text-sm font-semibold text-stone-800">⚡ Pack d’urgence</span>
                <span className="block text-xs text-stone-600">Article en stock, disponible immédiatement (sans délai de 12 jours).</span>
              </span>
            </label>

            <button type="submit" disabled={saving} className="w-full bg-[#C85A32] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#b04b25] disabled:opacity-60 disabled:cursor-not-allowed transition">
              {saving ? 'Publication en cours…' : 'Publier l’article'}
            </button>
          </form>

          {/* Aperçu côté client */}
          <aside className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Aperçu sur le site</p>
              <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
                <div className="relative aspect-[4/3] bg-stone-100 flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-stone-400">La photo apparaîtra ici</span>
                  )}
                  <span className={`absolute top-3 left-3 text-[11px] font-bold px-3 py-1 rounded-full shadow ${isUrgent ? 'bg-amber-600 text-white' : 'bg-stone-900/80 text-white'}`}>
                    {isUrgent ? '⚡ Disponible immédiatement' : '⏳ Sur commande (12 jours)'}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-[#1C1917] leading-snug">{title || 'Titre de l’article'}</h3>
                    <span className="font-serif font-bold text-[#C85A32] whitespace-nowrap">{priceNum.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <p className="text-xs text-[#C85A32] font-semibold mb-2">{CAT_LABEL[category]}</p>
                  <p className="text-stone-500 text-xs leading-relaxed min-h-[2.5rem]">{description || 'La description apparaîtra ici.'}</p>
                  <div className="mt-4 bg-stone-900 text-white text-center py-3 rounded-xl text-xs font-semibold">💬 Je suis intéressé(e)</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Gestion des articles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Gestion des articles</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} sm:max-w-xs`} placeholder="🔍 Rechercher un article" />
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-stone-500">Chargement…</p>
          ) : shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-500">{products.length === 0 ? 'Aucun article pour le moment.' : 'Aucun article ne correspond à la recherche.'}</p>
          ) : (
            shown.map((p) => (
              <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-stone-50/60 transition">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img src={p.image_url} alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-200 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{p.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{CAT_LABEL[p.category] || p.category}</p>
                    <p className="font-serif font-bold text-[#C85A32] mt-1">{Number(p.price || 0).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => toggleAvailability(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${p.is_available ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}
                  >
                    {p.is_available ? '● Disponible' : '● Épuisé'}
                  </button>
                  <button
                    onClick={() => toggleUrgent(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${p.is_urgent ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-stone-500 border-stone-300 hover:border-stone-400'}`}
                  >
                    ⚡ {p.is_urgent ? 'Urgent' : 'Normal'}
                  </button>
                  <a href={`/produit/${p.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-[#C85A32] transition">
                    Voir la fiche
                  </a>
                  <button onClick={() => deleteProduct(p)} className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-full transition">
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}