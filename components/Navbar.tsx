'use client';

import React from 'react';
import { CONTACT_INFO } from '@/data/products';

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-amber-50/90 backdrop-blur-md border-b border-amber-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-900 text-amber-100 flex items-center justify-center font-serif font-bold text-xl shadow-inner">
            S
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl text-stone-900 tracking-wide">SANDJA HANDMADE</h1>
            <p className="text-xs text-amber-800 font-medium tracking-wider uppercase">Promouvoir la beauté à l'africaine</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-stone-700 font-medium text-sm">
          <a href="#showroom" className="hover:text-amber-900 transition-colors">Réalisations</a>
          <a href="#services" className="hover:text-amber-900 transition-colors">Services & Sur-mesure</a>
          <a href="#contact" className="hover:text-amber-900 transition-colors">Contact</a>
        </nav>

        <a
          href={`https://wa.me/${CONTACT_INFO.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center justify-center bg-amber-900 hover:bg-amber-950 text-amber-50 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md"
        >
          Contact Direct
        </a>
      </div>
    </header>
  );
};