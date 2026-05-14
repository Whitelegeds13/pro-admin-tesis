'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import LandingLayout from '../../components/layout/LandingLayout';
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle,
  Lock,
  Truck,
  Shield,
  Award,
  QrCode,
  Upload,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CheckoutForm {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: 'credit' | 'debit' | 'pse' | 'cod' | 'qr' | 'app';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  termsAccepted: boolean;
  paymentProofImage?: string;
}

export default function CheckoutPage() {
  const { state, dispatch } = useCart();
  const { state: authState } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [formData, setFormData] = useState<CheckoutForm>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'credit',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    termsAccepted: false,
    paymentProofImage: undefined
  });

  // Cargar datos del cliente si está logueado
  useEffect(() => {
    if (authState.isAuthenticated && authState.client) {
      const client = authState.client;
      const nameParts = client.name.split(' ');
      setFormData(prev => ({
        ...prev,
        email: client.email || '',
        phone: client.phone || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        address: client.address || '',
        city: client.city || '',
        postalCode: client.district || ''
      }));
    }
  }, [authState]);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      showToast('Debes iniciar sesión para continuar', 'error');
      router.push('/login?redirect=/checkout');
    }
  }, [authState, router, showToast]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(price);
  };

  const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showToast('Solo se permiten archivos de imagen', 'error');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen es demasiado grande. Máximo 5MB', 'error');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir imagen
    setIsUploadingProof(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'payment-proof');

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        setFormData(prev => ({
          ...prev,
          paymentProofImage: uploadData.data.fileUrl
        }));
        showToast('Comprobante subido exitosamente', 'success');
      } else {
        showToast(uploadData.message || 'Error al subir el comprobante', 'error');
        setPaymentProofPreview(null);
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      showToast('Error al subir el comprobante', 'error');
      setPaymentProofPreview(null);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const removePaymentProof = () => {
    setPaymentProofPreview(null);
    setFormData(prev => ({
      ...prev,
      paymentProofImage: undefined
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authState.isAuthenticated || !authState.client) {
      showToast('Debes iniciar sesión para continuar', 'error');
      router.push('/login?redirect=/checkout');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Preparar items para la API
      const items = state.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      // Preparar dirección de envío
      const shippingAddress = `${formData.address}, ${formData.city}, ${formData.postalCode}`;

      // Mapear método de pago
      const paymentMethodMap: Record<string, string> = {
        'credit': 'TARJETA',
        'debit': 'TARJETA',
        'pse': 'TRANSFERENCIA',
        'cod': 'EFECTIVO',
        'qr': 'QR',
        'app': 'APP'
      };

      const selectedPaymentMethod = paymentMethodMap[formData.paymentMethod] || 'EFECTIVO';
      
      // Validar comprobante si es QR/APP
      if ((formData.paymentMethod === 'qr' || formData.paymentMethod === 'app') && !formData.paymentProofImage) {
        showToast('Debes subir el comprobante de pago', 'error');
        setIsProcessing(false);
        return;
      }

      // Crear la venta
      const response = await fetch('/api/auth/client/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: authState.client._id,
          items,
          shippingAddress,
          paymentMethod: selectedPaymentMethod,
          paymentProofImage: formData.paymentProofImage
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsCompleted(true);
        dispatch({ type: 'CLEAR_CART' });
        
        // Mensaje según el método de pago
        if (selectedPaymentMethod === 'QR' || selectedPaymentMethod === 'APP') {
          showToast('Compra solicitada. Esperando confirmación de pago', 'success');
        } else {
          showToast('Compra realizada exitosamente', 'success');
        }
      } else {
        showToast(data.message || 'Error al procesar la compra', 'error');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      showToast('Error de conexión al procesar la compra', 'error');
      setIsProcessing(false);
    }
  };

  const shippingCost = state.totalPrice >= 500000 ? 0 : 15000;
  const total = state.totalPrice + shippingCost;

  if (authState.isLoading) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LandingLayout>
    );
  }

  if (!authState.isAuthenticated) {
    return null; // Se redirigirá en el useEffect
  }

  if (state.items.length === 0 && !isCompleted) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrito Vacío</h1>
            <p className="text-gray-600 mb-8">No hay productos en tu carrito para proceder al pago.</p>
            <Link
              href="/catalogo"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (isCompleted) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {formData.paymentMethod === 'qr' || formData.paymentMethod === 'app' 
                ? '¡Pedido Solicitado!' 
                : '¡Pedido Confirmado!'}
            </h1>
            <p className="text-gray-600 mb-8">
              {formData.paymentMethod === 'qr' || formData.paymentMethod === 'app' 
                ? 'Tu pedido ha sido registrado. Estamos verificando tu comprobante de pago. Te notificaremos cuando sea confirmado.'
                : 'Tu pedido ha sido procesado exitosamente. Recibirás un email de confirmación pronto.'}
            </p>
            <div className="space-y-4">
              <Link
                href="/catalogo"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continuar Comprando
              </Link>
              <Link
                href="/"
                className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Volver al Inicio
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/carrito"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Carrito
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
            <p className="text-gray-600 mt-2">
              Completa tu información para procesar el pedido
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step === 1 ? 'Información' : step === 2 ? 'Envío' : 'Pago'}
                      </span>
                      {step < 3 && (
                        <div className={`w-16 h-0.5 ml-4 ${
                          step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apellido *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Shipping Information */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900">Información de Envío</h2>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dirección *
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ciudad *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código Postal *
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment Information */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900">Información de Pago</h2>
                      
                      {/* Payment Method Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Método de Pago *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { value: 'credit', label: 'Tarjeta de Crédito', icon: CreditCard },
                            { value: 'debit', label: 'Tarjeta Débito', icon: CreditCard },
                            { value: 'pse', label: 'PSE', icon: CreditCard },
                            { value: 'cod', label: 'Contra Entrega', icon: Truck },
                            { value: 'qr', label: 'Yape/Plin QR', icon: QrCode },
                            { value: 'app', label: 'Yape/Plin App', icon: QrCode }
                          ].map((method) => (
                            <label key={method.value} className="relative">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={method.value}
                                checked={formData.paymentMethod === method.value}
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                formData.paymentMethod === method.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <method.icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                                <p className="text-sm font-medium text-center">{method.label}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* QR Code Display for QR/App payment */}
                      {(formData.paymentMethod === 'qr' || formData.paymentMethod === 'app') && (
                        <div className="bg-gradient-to-br from-purple-900 to-purple-700 rounded-xl p-6 text-white">
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold mb-2">
                              {formData.paymentMethod === 'qr' ? 'Paga con QR' : 'Paga con App'}
                            </h3>
                            <p className="text-sm text-purple-200">
                              Escanea el código QR o realiza el pago desde la app
                            </p>
                          </div>
                          <div className="flex justify-center mb-4">
                            <div className="bg-white p-4 rounded-lg">
                              <Image
                                src="/imagenes/qr-app.jpg"
                                alt="QR Code Yape/Plin"
                                width={250}
                                height={250}
                                className="rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="text-center mb-4">
                            <p className="text-sm font-medium mb-1">Cesar Jose Vasquez Hinostroza</p>
                            <p className="text-xs text-purple-200">Realiza el pago y sube el comprobante</p>
                          </div>
                          
                          {/* Upload Payment Proof */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-white mb-2">
                              Subir Comprobante de Pago *
                            </label>
                            {!paymentProofPreview ? (
                              <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePaymentProofUpload}
                                  disabled={isUploadingProof}
                                  className="hidden"
                                  id="payment-proof-upload"
                                />
                                <label
                                  htmlFor="payment-proof-upload"
                                  className="cursor-pointer flex flex-col items-center"
                                >
                                  {isUploadingProof ? (
                                    <>
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                                      <span className="text-sm">Subiendo...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-8 w-8 mb-2" />
                                      <span className="text-sm font-medium">Haz clic para subir</span>
                                      <span className="text-xs text-purple-200 mt-1">JPG, PNG o WEBP (máx. 5MB)</span>
                                    </>
                                  )}
                                </label>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="border-2 border-purple-300 rounded-lg p-2 bg-white">
                                  <Image
                                    src={paymentProofPreview}
                                    alt="Comprobante de pago"
                                    width={300}
                                    height={300}
                                    className="rounded-lg w-full h-auto"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={removePaymentProof}
                                  className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <p className="text-xs text-purple-200 mt-2 text-center">
                                  ✓ Comprobante subido correctamente
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Card Information */}
                      {formData.paymentMethod !== 'cod' && formData.paymentMethod !== 'qr' && formData.paymentMethod !== 'app' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número de Tarjeta *
                            </label>
                            <input
                              type="text"
                              name="cardNumber"
                              value={formData.cardNumber}
                              onChange={handleInputChange}
                              placeholder="1234 5678 9012 3456"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Vencimiento *
                              </label>
                              <input
                                type="text"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                                placeholder="MM/AA"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                CVV *
                              </label>
                              <input
                                type="text"
                                name="cvv"
                                value={formData.cvv}
                                onChange={handleInputChange}
                                placeholder="123"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nombre en la Tarjeta *
                            </label>
                            <input
                              type="text"
                              name="cardName"
                              value={formData.cardName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                      {/* Terms and Conditions */}
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-3 text-sm text-gray-600">
                          Acepto los{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-700">
                            términos y condiciones
                          </a>{' '}
                          y la{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-700">
                            política de privacidad
                          </a>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={currentStep === 1}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Siguiente
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isProcessing || !formData.termsAccepted}
                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Confirmar Pedido
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen del Pedido</h3>
                
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(state.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío:</span>
                    <span className="font-medium text-green-600">
                      {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Security Features */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-2 text-green-600" />
                    Pago 100% Seguro
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="h-4 w-4 mr-2 text-blue-600" />
                    Envío Gratis desde $500.000
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2 text-purple-600" />
                    Garantía Extendida
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
