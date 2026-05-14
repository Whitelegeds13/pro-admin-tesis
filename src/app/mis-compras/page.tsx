'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LandingLayout from '../../components/layout/LandingLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Calendar, CreditCard, ArrowLeft, Eye, X, ZoomIn, Image as ImageIcon, Download, Send, QrCode } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/contexts/ToastContext';
import QRCode from 'qrcode';

interface Sale {
  _id: string;
  saleNumber: string;
  receiptNumber: string;
  receiptType: string;
  series?: string;
  total: number;
  subtotal?: number;
  igv?: number;
  status: string;
  issueDate: string;
  paymentMethod: string;
  paymentProofImage?: string;
  notes?: string;
  createdAt: string;
  items?: Array<{
    product: {
      name: string;
      images?: string[];
      code?: string;
    };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export default function MisComprasPage() {
  const { state: authState } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showToast } = useToast();
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      if (!authState.client?._id) {
        setErrorMessage('No se encontró el ID del cliente. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await fetch(`/api/auth/client/purchases?clientId=${authState.client._id}`, {
        headers: {
          'x-client-id': authState.client._id
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSales(data.sales || []);
        setErrorMessage(null);
      } else {
        const errorMsg = data.message || 'Error al obtener las compras';
        setErrorMessage(errorMsg);
        console.error('Error al obtener compras:', errorMsg, data.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
      setErrorMessage(`Error al cargar las compras: ${errorMsg}`);
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authState.client?._id]);

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push('/login');
      return;
    }

    if (authState.isAuthenticated && authState.client) {
      fetchSales();
    }
  }, [authState, router, fetchSales]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGADO':
      case 'CONFIRMADO':
        return 'bg-green-100 text-green-800';
      case 'SOLICITADO':
        return 'bg-blue-100 text-blue-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAGADO':
        return 'Pagado';
      case 'CONFIRMADO':
        return 'Confirmado';
      case 'SOLICITADO':
        return 'Solicitado';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  };

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
    return null;
  }

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Mis Compras</h1>
            <p className="text-gray-600 mt-2">Historial de todas tus compras</p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{errorMessage}</p>
                </div>
                <button
                  onClick={() => fetchSales()}
                  className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !errorMessage && sales.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">No tienes compras aún</h2>
              <p className="text-gray-600 mb-8">Comienza a comprar productos increíbles en nuestro catálogo</p>
              <Link
                href="/catalogo"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {sales.map((sale) => (
                <div key={sale._id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {sale.receiptType} {sale.receiptNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                          {getStatusText(sale.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(sale.issueDate)}
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-1" />
                          {sale.paymentMethod}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(sale.total)}</p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                  </div>

                  {sale.items && sale.items.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Productos:</h4>
                      <div className="space-y-2">
                        {sale.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-3">
                              {item.product.images && item.product.images.length > 0 ? (
                                <Image
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                <p className="text-gray-500">Cantidad: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-medium text-gray-900">{formatPrice(item.subtotal)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setSelectedSale(sale);
                        setShowDetailsModal(true);
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </button>
                    <Link
                      href={`/comprobante/${sale._id}?clientId=${authState.client?._id || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Comprobante
                    </Link>
                    <button
                      onClick={async () => {
                        try {
                          setShowDetailsModal(false);
                          setSelectedSale(null);
                          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                          const link = `${baseUrl}/comprobante/${sale._id}?clientId=${authState.client?._id || ''}`;
                          const dataUrl = await QRCode.toDataURL(link);
                          setQrDataUrl(dataUrl);
                          setQrOpen(true);
                        } catch {
                          showToast('No se pudo generar el QR', 'error');
                        }
                      }}
                      className="inline-flex items-center text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const clientId = authState.client?._id || '';
                          const res = await fetch(`/api/auth/client/sales/${sale._id}/send-pdf?clientId=${clientId}`, { method: 'POST' });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            showToast('Comprobante enviado a tu correo', 'success');
                          } else {
                            showToast(data.message || 'No se pudo enviar el comprobante', 'error');
                          }
                        } catch {
                          showToast('Error de conexión', 'error');
                        }
                      }}
                      className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar por correo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de la Compra - {selectedSale.receiptType} {selectedSale.receiptNumber}
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedSale(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información del Pedido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Pedido</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Número de Pedido:</strong> {selectedSale.saleNumber}</p>
                    <p><strong>Comprobante:</strong> {selectedSale.receiptType} {selectedSale.series && `${selectedSale.series}-`}{selectedSale.receiptNumber}</p>
                    <p><strong>Fecha de Emisión:</strong> {formatDate(selectedSale.issueDate)}</p>
                    <p><strong>Método de Pago:</strong> {selectedSale.paymentMethod}</p>
                    <p><strong>Estado:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSale.status)}`}>
                        {getStatusText(selectedSale.status)}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Totales</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {selectedSale.subtotal !== undefined && (
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatPrice(selectedSale.subtotal)}</span>
                      </div>
                    )}
                    {selectedSale.igv !== undefined && (
                      <div className="flex justify-between">
                        <span>IGV (18%):</span>
                        <span className="font-medium">{formatPrice(selectedSale.igv)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-bold text-lg">{formatPrice(selectedSale.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprobante de Pago */}
              {selectedSale.paymentProofImage && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Comprobante de Pago
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="relative inline-block">
                      <Image
                        src={selectedSale.paymentProofImage}
                        alt="Comprobante de pago"
                        width={500}
                        height={500}
                        className="max-w-full h-auto rounded-lg border-2 border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedSale.paymentProofImage, '_blank')}
                        unoptimized
                      />
                      <button
                        onClick={() => window.open(selectedSale.paymentProofImage, '_blank')}
                        className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                        title="Ver en tamaño completo"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Productos */}
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Productos</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      {selectedSale.items.map((item, index) => (
                        <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                          {item.product.images && item.product.images.length > 0 ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                              unoptimized
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item.product.name}</h4>
                            {item.product.code && (
                              <p className="text-sm text-gray-500">Código: {item.product.code}</p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-sm text-gray-600">
                                Cantidad: <span className="font-medium">{item.quantity}</span> × {formatPrice(item.unitPrice)}
                              </p>
                              <p className="font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedSale.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notas</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedSale.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={async () => {
                  try {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                    const link = `${baseUrl}/comprobante/${selectedSale._id}?clientId=${authState.client?._id || ''}`;
                    const dataUrl = await QRCode.toDataURL(link);
                    setQrDataUrl(dataUrl);
                    setQrOpen(true);
                  } catch {
                    showToast('No se pudo generar el QR', 'error');
                  }
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Ver QR
              </button>
              <button
                onClick={async () => {
                  try {
                    const clientId = authState.client?._id || '';
                    const res = await fetch(`/api/auth/client/sales/${selectedSale._id}/send-pdf?clientId=${clientId}`, { method: 'POST' });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      showToast('Comprobante enviado a tu correo', 'success');
                    } else {
                      showToast(data.message || 'No se pudo enviar el comprobante', 'error');
                    }
                  } catch {
                    showToast('Error de conexión', 'error');
                  }
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Enviar por correo
              </button>
              <Link
                href={`/comprobante/${selectedSale._id}?clientId=${authState.client?._id || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Descargar Comprobante
              </Link>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedSale(null);
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {qrOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QR del Comprobante</h3>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Comprobante" className="w-64 h-64 mx-auto border rounded" />
            ) : (
              <div className="p-12 text-center text-gray-600">Generando...</div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setQrOpen(false)} className="px-4 py-2 border rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </LandingLayout>
  );
}
