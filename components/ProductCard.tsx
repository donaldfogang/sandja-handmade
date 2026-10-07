'use client';

import React from 'react';
import { Product } from '@/data/products';
import { getWhatsAppLink } from '@/utils/whatsapp';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // On passe product.title, product.price et product.image
  const whatsappUrl = getWhatsAppLink(product.title, product.price, product.image);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200 flex flex-col justify-between">
      <div>
        <div className="relative h-64 w-full overflow-hidden bg-stone-100">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="p-5">
          <h3 className="font-serif text-lg font-bold text-stone-900 mb-2 line-clamp-1">
            {product.title}
          </h3>
          <p className="text-stone-600 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-baseline gap-1 text-[#C85A32] font-bold text-xl mb-4">
            <span>{product.price.toLocaleString('fr-FR')}</span>
            <span className="text-xs text-stone-500 font-normal">FCFA</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-0">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 shadow-md"
        >
          <span>💬 Je suis intéressé(e)</span>
        </a>
      </div>
    </div>
  );
};