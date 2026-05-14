'use client';

import { Wrench, Cpu, Shield, Clock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ServicesPage() {
  const router = useRouter();
  const services = [
    {
      icon: Cpu,
      title: 'Ensamblaje de PCs',
      description: 'Armamos tu PC gaming personalizada con los mejores componentes del mercado.',
      features: ['Selección de componentes', 'Ensamblaje profesional', 'Pruebas de rendimiento', 'Garantía completa'],
      price: 'Desde $50.000'
    },
    {
      icon: Wrench,
      title: 'Mantenimiento Técnico',
      description: 'Servicio completo de mantenimiento preventivo y correctivo para tu equipo.',
      features: ['Limpieza profunda', 'Actualización de drivers', 'Optimización del sistema', 'Diagnóstico completo'],
      price: 'Desde $30.000'
    },
    {
      icon: Shield,
      title: 'Soporte Técnico',
      description: 'Asistencia técnica especializada para resolver cualquier problema con tu equipo.',
      features: ['Soporte remoto', 'Diagnóstico gratuito', 'Reparaciones', 'Asesoría personalizada'],
      price: 'Desde $20.000'
    }
  ];

  const stats = [
    { icon: Users, value: '5000+', label: 'Clientes Satisfechos' },
    { icon: Cpu, value: '2000+', label: 'PCs Ensambladas' },
    { icon: Clock, value: '24/7', label: 'Soporte Disponible' },
    { icon: Shield, value: '3 Años', label: 'Garantía Máxima' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Nuestros Servicios
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Ofrecemos servicios técnicos especializados para que tu experiencia gaming sea perfecta. 
            Desde ensamblaje hasta soporte técnico, estamos aquí para ayudarte.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Servicios Especializados</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Contamos con técnicos certificados y años de experiencia en el sector gaming.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                    <service.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">{service.price}</span>
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                      Solicitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Experiencia</h2>
            <p className="text-lg text-gray-600">
              Años de experiencia nos respaldan en cada servicio que ofrecemos.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestro Proceso</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un proceso simple y transparente para garantizar la mejor experiencia de servicio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Consulta</h3>
              <p className="text-gray-600">Nos cuentas qué necesitas y te asesoramos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cotización</h3>
              <p className="text-gray-600">Te enviamos una cotización detallada</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ejecución</h3>
              <p className="text-gray-600">Realizamos el trabajo con la máxima calidad</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Entrega</h3>
              <p className="text-gray-600">Te entregamos tu equipo listo para usar</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Necesitas ayuda con tu equipo gaming?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Contáctanos y nuestros expertos te ayudarán a encontrar la solución perfecta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/catalogo')}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Solicitar Cotización
            </button>
            <button
              onClick={() => router.push('/soporte-tecnico')}
              className="px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-lg transition-colors"
            >
              Contactar Soporte
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
