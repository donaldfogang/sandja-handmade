'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// Initialisation unique centralisée pour éviter tout conflit d'instance
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Empêche la duplication d'instances GoTrueClient dans le navigateur
declare global {
  var cachedSupabase: SupabaseClient | undefined;
}

const supabase = global.cachedSupabase || createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  global.cachedSupabase = supabase;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulaire pour nouveau produit
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'table' | 'deco'>('table');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mot de passe simple modifiable (ex: "sandja2026")
    if (password === 'sandja2026') {
      setIsAuthenticated(true);
      fetchAdminProducts();
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const fetchAdminProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
    if (error) console.error(error);
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !imageFile) {
      alert('Veuillez remplir les champs obligatoires et choisir une image.');
      return;
    }

    try {
      setLoading(true);
      // 1. Upload de l'image sur Supabase Storage
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Récupération de l'URL publique de l'image
      const { data: publicUrlData } = supabase.storage
        .from('products-images')
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;

      // 2. Insertion dans la table products
      const { error: insertError } = await supabase.from('products').insert([
        {
          name: title, // Ajouté pour satisfaire la contrainte de la base de données
          title,
          category,
          price: Number(price),
          description,
          image_url: imageUrl,
          is_urgent: isUrgent,
          is_available: true
        }
      ]);

      if (insertError) throw insertError;

      alert('Produit ajouté avec succès !');
      setTitle('');
      setPrice('');
      setDescription('');
      setImageFile(null);
      setIsUrgent(false);
      fetchAdminProducts();
    } catch (err: any) {
      alert('Erreur lors de l\'ajout : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id: any, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !currentStatus })
      .eq('id', id);

    if (!error) fetchAdminProducts();
  };

  const deleteProduct = async (id: any) => {
    if (confirm('Voulez-vous vraiment supprimer cet article ?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) fetchAdminProducts();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full">
          <h2 className="font-serif text-2xl font-bold mb-6 text-stone-900 text-center">Administration Sandja</h2>
          <label className="block text-xs font-semibold text-stone-600 mb-2">Mot de passe administrateur</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-stone-300 rounded-xl mb-4 text-sm focus:outline-none focus:border-[#C85A32]"
            placeholder="Entrez le mot de passe"
          />
          <button type="submit" className="w-full bg-[#1C1917] text-white py-3 rounded-xl font-semibold text-sm hover:bg-stone-800 transition">
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="font-serif text-3xl font-bold text-stone-900">Tableau de Bord Admin</h1>
          <button onClick={() => setIsAuthenticated(false)} className="text-xs bg-stone-200 hover:bg-stone-300 px-4 py-2 rounded-lg font-medium">
            Déconnexion
          </button>
        </div>

        {/* Formulaire d'ajout */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-10">
          <h2 className="font-serif text-xl font-bold mb-4 text-stone-800">Ajouter un nouvel article ou Pack d'Urgence</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Titre de l'article</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 border rounded-xl text-sm" placeholder="Ex: Set de table royal" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full p-3 border rounded-xl text-sm bg-white">
                <option value="table">Arts de la table</option>
                <option value="deco">Décoration</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Prix (FCFA)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full p-3 border rounded-xl text-sm" placeholder="Ex: 15000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Image du produit</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required className="w-full p-2 border rounded-xl text-sm bg-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-600 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border rounded-xl text-sm" placeholder="Détails sur les matières, dimensions..."></textarea>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="urgent" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="w-4 h-4 text-amber-600 rounded" />
              <label htmlFor="urgent" className="text-xs font-semibold text-stone-700">Marquer comme ⚡ Pack d'Urgence (Disponible immédiatement)</label>
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={loading} className="w-full bg-[#C85A32] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b04b25] transition">
                {loading ? 'Enregistrement en cours...' : 'Publier l\'article'}
              </button>
            </div>
          </form>
        </div>

        {/* Liste des produits existants */}
        <h2 className="font-serif text-2xl font-bold mb-4 text-stone-900">Gestion des stocks & articles</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-100 border-b text-xs font-semibold text-stone-600 uppercase">
                <th className="p-4">Image</th>
                <th className="p-4">Titre</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-stone-50">
                  <td className="p-4"><img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded-lg" /></td>
                  <td className="p-4 font-medium text-stone-900">{p.title} {p.is_urgent && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded ml-2">Urgent</span>}</td>
                  <td className="p-4 text-stone-600">{p.category}</td>
                  <td className="p-4 font-semibold text-[#C85A32]">{Number(p.price || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="p-4">
                    <button onClick={() => toggleAvailability(p.id, p.is_available)} className={`px-3 py-1 rounded-full text-xs font-semibold ${p.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {p.is_available ? 'Disponible' : 'Épuisé'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteProduct(p.id)} className="text-xs text-rose-600 hover:underline font-semibold">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}