'use client';

import { Target, Users, Award, Heart } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Misión',
      description: 'Proporcionar la mejor tecnología gaming y servicios especializados para elevar la experiencia de cada gamer.'
    },
    {
      icon: Users,
      title: 'Comunidad',
      description: 'Construir una comunidad sólida de gamers apasionados por la tecnología y los videojuegos.'
    },
    {
      icon: Award,
      title: 'Excelencia',
      description: 'Mantener los más altos estándares de calidad en productos y servicios que ofrecemos.'
    },
    {
      icon: Heart,
      title: 'Pasión',
      description: 'Compartir nuestra pasión por el gaming y la tecnología con cada cliente que nos visita.'
    }
  ];

  const team = [
    {
      name: 'Gabriel Álvarez',
      role: 'CEO & Fundador',
      description: 'Gamer apasionado con más de 10 años de experiencia en tecnología.',
      image: 'https://images.unsplash.com/photo-1593640401902-8430f26262e5?w=150&h=150&fit=crop&crop=center'
    },
    {
      name: 'María González',
      role: 'Directora Técnica',
      description: 'Especialista en hardware gaming y ensamblaje de equipos de alto rendimiento.',
      image: 'https://images.unsplash.com/photo-1593640401902-8430f26262e5?w=150&h=150&fit=crop&crop=center'
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Jefe de Ventas',
      description: 'Experto en asesoramiento personalizado para encontrar el setup perfecto.',
      image: 'https://images.unsplash.com/photo-1593640401902-8430f26262e5?w=150&h=150&fit=crop&crop=center'
    }
  ];

  const timeline = [
    {
      year: '2020',
      title: 'Fundación',
      description: 'Palacio Gamer nace con la visión de ser la mejor tienda gaming del país.'
    },
    {
      year: '2021',
      title: 'Expansión',
      description: 'Ampliamos nuestro catálogo y comenzamos con servicios de ensamblaje.'
    },
    {
      year: '2022',
      title: 'Reconocimiento',
      description: 'Fuimos reconocidos como la mejor tienda gaming por nuestros clientes.'
    },
    {
      year: '2023',
      title: 'Innovación',
      description: 'Lanzamos nuestra plataforma online y servicios de soporte 24/7.'
    },
    {
      year: '2024',
      title: 'Futuro',
      description: 'Continuamos creciendo y mejorando para servir mejor a nuestra comunidad.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Acerca de Palacio Gamer
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Somos más que una tienda de tecnología. Somos una comunidad de gamers apasionados 
              comprometidos con ofrecer la mejor experiencia gaming a nuestros clientes.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Historia</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Palacio Gamer nació en 2020 de la pasión de un grupo de gamers que no encontraban 
                  en el mercado la calidad y el servicio que buscaban para sus equipos gaming.
                </p>
                <p>
                  Decidimos crear algo diferente: una tienda donde cada cliente recibiera atención 
                  personalizada, productos de la más alta calidad y servicios técnicos especializados.
                </p>
                <p>
                  Hoy, después de años de crecimiento constante, nos hemos convertido en la referencia 
                  en tecnología gaming, sirviendo a miles de clientes satisfechos en todo el país.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Users className="h-24 w-24 mx-auto text-blue-400" />
                  <p className="text-lg text-gray-600">Nuestra Comunidad</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestros Valores</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Los principios que guían cada decisión y acción en Palacio Gamer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <value.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestro Equipo</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Conoce a las personas apasionadas que hacen posible la experiencia Palacio Gamer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestro Camino</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un viaje de crecimiento constante y compromiso con la excelencia.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">{item.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  </div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Quieres ser parte de nuestra historia?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Únete a la comunidad Palacio Gamer y descubre por qué somos la elección preferida de los gamers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Conocer Productos
            </button>
            <button className="px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-lg transition-colors">
              Contactanos
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}