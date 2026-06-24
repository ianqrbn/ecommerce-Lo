import React, { useState } from 'react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { Fuuter } from '../components/Fuuter';
import { CategoryShowcase } from '../components/CategoryShowcase';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        <HeroSection />
        {<CategoryShowcase />}
        <FeaturedProducts />
      </main>

      {/* Footer */}
      <Fuuter/>
      
    </div>
  );
}
