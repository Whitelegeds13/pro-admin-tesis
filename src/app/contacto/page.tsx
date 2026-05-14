'use client';

import { useState } from 'react';
import Link from 'next/link';
import LandingLayout from '../../components/layout/LandingLayout';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  Send,
  CheckCircle,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Navigation,
  Wifi,
  ShoppingBag,
  Shield,
  Award,
  Star
} from 'lucide-react';

interface ContactInfo {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    service: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactInfo: ContactInfo[] = [
    {
      title: 'Dirección Principal',
      value: 'Carrera 15 #93-07, Bogotá',
      description: 'Zona Rosa, Bogotá D.C.',
      icon: MapPin,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Teléfono',
      value: '+57 300 123 4567',
      description: 'Lunes a Domingo 24/7',
      icon: Phone,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Email',
      value: 'contacto@palaciogamer.com',
      description: 'Respuesta en 2 horas',
      icon: Mail,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Horarios',
      value: 'Lunes a Domingo',
      description: '8:00 AM - 10:00 PM',
      icon: Clock,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const socialLinks: SocialLink[] = [
    {
      name: 'Facebook',
      href: 'https://facebook.com/palaciogamer',
      icon: Facebook,
      color: 'hover:text-blue-600'
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/palaciogamer',
      icon: Instagram,
      color: 'hover:text-pink-600'
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/palaciogamer',
      icon: Twitter,
      color: 'hover:text-blue-400'
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/palaciogamer',
      icon: Youtube,
      color: 'hover:text-red-600'
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/palaciogamer',
      icon: Linkedin,
      color: 'hover:text-blue-700'
    }
  ];

  const services = [
    'Consulta General',
    'Soporte Técnico',
    'Ventas',
    'Garantías',
    'Instalación',
    'Mantenimiento'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío del formulario
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        service: ''
      });
    }, 3000);
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
              <MessageCircle className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-sm font-medium">Contacto Directo</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Contáctanos
            </h1>
            
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Envíanos un Mensaje</h2>
              
              {isSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Mensaje Enviado!</h3>
                  <p className="text-gray-600">Gracias por contactarnos. Te responderemos pronto.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                        Servicio de Interés
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecciona un servicio</option>
                        {services.map((service) => (
                          <option key={service} value={service}>{service}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Asunto *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="¿En qué podemos ayudarte?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Cuéntanos más detalles sobre tu consulta..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-3 h-5 w-5" />
                        Enviar Mensaje
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info & Map */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Información de Contacto</h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${info.color} rounded-xl mr-4 flex-shrink-0`}>
                      <info.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{info.title}</h4>
                      <p className="text-gray-600 font-medium">{info.value}</p>
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Síguenos</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors ${social.color}`}
                  >
                    <social.icon className="h-6 w-6" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Acciones Rápidas</h3>
              <div className="space-y-4">
                <Link
                  href="/soporte-tecnico"
                  className="flex items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Soporte Técnico</p>
                    <p className="text-sm text-gray-600">Chat en vivo 24/7</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  href="/catalogo"
                  className="flex items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                >
                  <ShoppingBag className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Ver Catálogo</p>
                    <p className="text-sm text-gray-600">Explora nuestros productos</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Ubicación</h2>
            <p className="text-xl text-gray-600">Visítanos en nuestra tienda física en el corazón de Bogotá</p>
          </div>
          
          <div className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Mapa Interactivo</h3>
              <p className="text-gray-500">Carrera 15 #93-07, Zona Rosa, Bogotá D.C.</p>
              <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Navigation className="h-5 w-5 inline mr-2" />
                Cómo Llegar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Por qué elegirnos?</h2>
            <p className="text-xl text-gray-600">Somos más que una tienda de tecnología gaming</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Garantía Extendida',
                description: 'Hasta 3 años de garantía en todos nuestros productos'
              },
              {
                icon: Award,
                title: 'Calidad Premium',
                description: 'Solo trabajamos con las mejores marcas del mercado'
              },
              {
                icon: Star,
                title: 'Atención Personalizada',
                description: 'Servicio al cliente especializado y dedicado'
              },
              {
                icon: Wifi,
                title: 'Soporte 24/7',
                description: 'Asistencia técnica disponible las 24 horas'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </LandingLayout>
  );
}
