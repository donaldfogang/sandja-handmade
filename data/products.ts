export interface Product {
  id: number;
  title: string;
  category: 'table' | 'mode' | 'deco';
  price: number;
  image: string;
  description: string;
}

export const PRODUCTS: Product[] = [
  // --- DECORATION ---
  {
    id: 1,
    title: "Housse de Coussin & Décoration 1",
    category: "deco",
    price: 12000,
    image: "/images/deco/deco1.jpg",
    description: "Accessoire de décoration intérieure confectionné aux motifs africains."
  },
  {
    id: 2,
    title: "Élément Décoratif Artisanat 2",
    category: "deco",
    price: 15000,
    image: "/images/deco/deco2.jpg",
    description: "Création faite main pour apporter de la chaleur et du cachet à votre séjour."
  },
  {
    id: 3,
    title: "Accessoire Déco Sandja",
    category: "deco",
    price: 10000,
    image: "/images/deco/deco3.jpg",
    description: "Finitions raffinées et tissus résistants de qualité supérieure."
  },

  // --- ARTS DE LA TABLE ---
  ...Array.from({ length: 16 }, (_, i) => ({
    id: 10 + i + 1,
    title: `Service de Table Assorti N°${i + 1}`,
    category: "table" as const,
    price: 18000 + (i % 3) * 2000,
    image: `/images/table/service-table${i + 1}.jpg`,
    description: "Ensemble complet de table (chemin de table / sets) idéal pour vos réceptions."
  })),

  // --- ACCESSOIRES & MODE ---
  // Babouches (1 à 4)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: 40 + i + 1,
    title: `Babouches Artisanal de Mode N°${i + 1}`,
    category: "mode" as const,
    price: 8500,
    image: `/images/mode/babouche${i === 2 ? '3' : i + 1}.jpg`, // gère la coquille babouch3
    description: "Chaussures d'intérieur et d'extérieur légères aux détails en tissu africain."
  })),

  // Sacs (1 à 6)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 50 + i + 1,
    title: `Sac à Main & Pochette N°${i + 1}`,
    category: "mode" as const,
    price: 15000,
    image: `/images/mode/sac${i + 1}.jpg`,
    description: "Sac fonctionnel et élégant avec empiècements en pagne traditionnel."
  })),

  // Chapeaux (1 à 6)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 60 + i + 1,
    title: `Chapeau Stylisé Sandja N°${i + 1}`,
    category: "mode" as const,
    price: 7000,
    image: `/images/mode/chapeau${i + 1}.jpg`,
    description: "Chapeau tendance protégeant du soleil avec une touche culturelle unique."
  })),

  // Colliers (1 à 8)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: 70 + i + 1,
    title: `Collier & Bijou Artisanal N°${i + 1}`,
    category: "mode" as const,
    price: 6000,
    image: `/images/mode/colier${i + 1}.jpg`,
    description: "Bijou fait main apportant de la couleur et de l'élégance à vos tenues."
  })),

  // Ensembles Bébé (1 à 6)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 80 + i + 1,
    title: `Ensemble Bébé Confort N°${i + 1}`,
    category: "mode" as const,
    price: 12500,
    image: `/images/mode/ensemble-bebe${i + 1}.jpg`,
    description: "Tenue souple et douce pour bébé, confectionnée à 100% en coton imprimé."
  }))
];

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