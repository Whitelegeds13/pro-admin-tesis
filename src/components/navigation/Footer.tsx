'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PG</span>
              </div>
              <span className="text-xl font-bold">Palacio Gamer</span>
            </div>
            <p className="text-gray-300 text-sm">
              Tu destino para la mejor tecnología gaming. PCs, componentes y accesorios de última generación.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Mi Carrito
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/soporte-tecnico" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Soporte Técnico
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/acerca-de" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Acerca de
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Categorías</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo?category=pcs" className="text-gray-300 hover:text-white transition-colors text-sm">
                  PCs Gaming
                </Link>
              </li>
              <li>
                <Link href="/catalogo?category=monitors" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Monitores
                </Link>
              </li>
              <li>
                <Link href="/catalogo?category=peripherals" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Periféricos
                </Link>
              </li>
              <li>
                <Link href="/catalogo?category=audio" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Audio Gaming
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  Carrera 15 #93-07, Zona Rosa<br />
                  Bogotá D.C., Colombia
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  +57 300 123 4567
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  contacto@palaciogamer.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Palacio Gamer. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Política de Privacidad
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Términos de Servicio
            </a>
            <Link href="/soporte-tecnico" className="text-gray-400 hover:text-white text-sm transition-colors">
              Soporte
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}