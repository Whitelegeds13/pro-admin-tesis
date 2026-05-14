'use client';

import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { exportCartToPDF } from '@/lib/export';
import LandingLayout from '../../components/layout/LandingLayout';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  Truck,
  Shield,
  Award,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function CarritoPage() {
  const { state, dispatch } = useCart();
  const { showToast } = useToast();
  const { state: authState } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    const item = state.items.find(item => item.id === id);
    
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
      if (item) {
        showToast(`${item.name} eliminado del carrito`, 'info');
      }
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
      if (item) {
        showToast(`Cantidad de ${item.name} actualizada`, 'success');
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    const item = state.items.find(item => item.id === id);
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    if (item) {
      showToast(`${item.name} eliminado del carrito`, 'info');
    }
  };

  const handleClearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    showToast('Carrito vaciado', 'info');
  };

  const handleDownloadPDF = async () => {
    try {
      await exportCartToPDF(
        state.items.map(it => ({ name: it.name, brand: it.brand, quantity: it.quantity, price: it.price })),
        { fileName: 'cotizacion-productos.pdf', currency: 'COP', title: 'Productos seleccionados' }
      );
      showToast('Descargando cotización de productos', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('No se pudo generar el PDF', 'error');
    }
  };

  const shippingCost = state.totalPrice >= 500000 ? 0 : 15000;
  const total = state.totalPrice + shippingCost;

  if (state.items.length === 0) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/catalogo"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Catálogo
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <ShoppingCart className="h-16 w-16 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
              <p className="text-gray-600 mb-8 text-center max-w-md">
                Agrega algunos productos increíbles a tu carrito para comenzar tu compra
              </p>
              <Link
                href="/catalogo"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Explorar Productos
              </Link>
            </div>
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/catalogo"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Catálogo
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
            <p className="text-gray-600 mt-2">
              {state.totalItems} {state.totalItems === 1 ? 'producto' : 'productos'} en tu carrito
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm">
                {/* Cart Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Productos ({state.totalItems})
                    </h2>
                    <button
                      onClick={handleClearCart}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      Vaciar Carrito
                    </button>
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-gray-200">
                  {state.items.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{item.brand}</p>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatPrice(item.price)}
                              </span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-sm text-gray-500 line-through ml-2">
                                  {formatPrice(item.originalPrice)}
                                </span>
                              )}
                            </div>
                            {item.discount && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                -{item.discount}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Item Total */}
                          <div className="text-right min-w-[6rem]">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Shopping */}
              <div className="mt-6">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continuar Comprando
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen del Pedido</h3>
                
                {/* Order Totals */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({state.totalItems} productos):</span>
                    <span className="font-medium">{formatPrice(state.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío:</span>
                    <span className="font-medium text-green-600">
                      {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="text-xs text-gray-500">
                      Envío gratis en compras superiores a $500.000
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                {authState.isAuthenticated ? (
                  <Link
                    href="/checkout"
                    className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium mb-4"
                  >
                    Proceder al Pago
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    aria-disabled
                    className="w-full flex items-center justify-center px-6 py-4 bg-gray-300 text-gray-600 rounded-xl cursor-not-allowed font-medium mb-4"
                  >
                    Proceder al Pago
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                )}

                {/* Descargar PDF para usuarios no autenticados */}
                {!authState.isAuthenticated && (
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center justify-center px-6 py-4 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-medium mb-4"
                  >
                    Descargar cotización de productos
                  </button>
                )}

                {/* Modal de autenticación requerida */}
                {showAuthModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowAuthModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Registro requerido</h4>
                        <button onClick={() => setShowAuthModal(false)} className="text-gray-500 hover:text-gray-700">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-gray-700 mb-6">
                        Para comprar los artículos seleccionados necesitas registrarte o iniciar sesión.
                      </p>
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href="/registro?redirect=/checkout"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Registrarse
                        </Link>
                        <Link
                          href="/login?redirect=/checkout"
                          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                        >
                          Iniciar sesión
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Features */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-3 text-green-600" />
                    <span>Pago 100% Seguro</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="h-4 w-4 mr-3 text-blue-600" />
                    <span>Envío Gratis desde $500.000</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-3 text-purple-600" />
                    <span>Garantía Extendida</span>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mt-6">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Código de descuento"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-r-lg hover:bg-gray-200 transition-colors text-sm">
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}
