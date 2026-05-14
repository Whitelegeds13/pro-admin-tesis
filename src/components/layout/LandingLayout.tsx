'use client';

import { useEffect } from 'react';
import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import PageTransition from '../ui/PageTransition';

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  // Prefetch de rutas comunes para transiciones más rápidas
  useEffect(() => {
    const prefetchRoutes = ['/catalogo', '/servicios', '/login', '/registro'];
    prefetchRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 lg:pt-20">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}