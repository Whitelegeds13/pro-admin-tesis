'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  ZoomIn,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    code: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Employee {
  _id?: string;
  id?: string; // El API devuelve 'id' en lugar de '_id'
  employeeId: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface Order {
  _id: string;
  saleNumber: string;
  client: {
    _id: string;
    name: string;
    documentNumber: string;
    email: string;
    phone: string;
  };
  employee: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
  };
  confirmedBy?: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
  };
  receiptType: string;
  receiptNumber: string;
  series: string;
  paymentMethod: string;
  issueDate: string;
  status: 'SOLICITADO' | 'PENDIENTE' | 'CONFIRMADO' | 'PAGADO' | 'CANCELADO' | 'DEVUELTO';
  paymentProofImage?: string;
  confirmedAt?: string;
  subtotal: number;
  igv: number;
  total: number;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    solicitados: 0,
    pendientes: 0,
    confirmados: 0,
    pagados: 0
  });
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    // Obtener datos del empleado desde localStorage
    const employeeData = localStorage.getItem('employee');
    if (employeeData) {
      try {
        const parsed = JSON.parse(employeeData);
        setEmployee(parsed);
      } catch (error) {
        console.error('Error parsing employee data:', error);
        setError('Error al cargar los datos del empleado. Por favor, inicia sesión nuevamente.');
      }
    } else {
      setError('No se encontró información del empleado. Por favor, inicia sesión nuevamente.');
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setStats(data.stats);
      } else {
        setError(data.message || 'Error al cargar los pedidos');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const confirmPayment = async (orderId: string) => {
    if (!confirm('¿Confirmar que el pago es válido y proceder con el pedido?')) return;

    // El API devuelve 'id', pero también puede tener '_id'
    const employeeId = employee?.id || employee?._id;
    
    if (!employeeId) {
      setError('No se pudo identificar al empleado. Por favor, inicia sesión nuevamente.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/sales/${orderId}/confirm-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'confirm',
          employeeId: employeeId
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Pago confirmado exitosamente. Stock actualizado.');
        fetchOrders();
        if (selectedOrder) {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }
      } else {
        setError(data.message || 'Error al confirmar el pago');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setError('Error de conexión');
    }
  };

  const rejectPayment = async (orderId: string) => {
    if (!confirm('¿Rechazar este pago? El pedido será cancelado.')) return;

    try {
      const response = await fetch(`/api/admin/sales/${orderId}/confirm-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Pago rechazado. Pedido cancelado.');
        fetchOrders();
        if (selectedOrder) {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }
      } else {
        setError(data.message || 'Error al rechazar el pago');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      setError('Error de conexión');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAGADO':
      case 'CONFIRMADO':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'CANCELADO':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'SOLICITADO':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'PENDIENTE':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGADO':
      case 'CONFIRMADO':
        return 'bg-green-100 text-green-800';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      case 'SOLICITADO':
        return 'bg-blue-100 text-blue-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'CANCELADO':
        return 'Cancelado';
      case 'SOLICITADO':
        return 'Solicitado';
      case 'PENDIENTE':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Pedidos</h1>
        <p className="text-gray-600">Gestiona los pedidos del e-commerce y confirma los pagos</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solicitados</p>
              <p className="text-2xl font-bold text-blue-600">{stats.solicitados}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmados}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pagados</p>
              <p className="text-2xl font-bold text-purple-600">{stats.pagados}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número de pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="SOLICITADO">Solicitado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="PAGADO">Pagado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay pedidos para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pedido</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Método de Pago</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.saleNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.receiptType} {order.series}-{order.receiptNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{order.client.name}</div>
                        <div className="text-sm text-gray-500">{order.client.email}</div>
                        <div className="text-sm text-gray-500">{order.client.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.paymentMethod}</div>
                      {order.paymentProofImage && (
                        <div className="text-xs text-blue-600 mt-1">Con comprobante</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {(order.status === 'SOLICITADO' || order.status === 'PENDIENTE') && (
                          <>
                            <button
                              onClick={() => confirmPayment(order._id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Confirmar pago"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => rejectPayment(order._id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Rechazar pago"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles del Pedido - {selectedOrder.saleNumber}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Nombre:</strong> {selectedOrder.client.name}</p>
                    <p><strong>Documento:</strong> {selectedOrder.client.documentNumber}</p>
                    <p><strong>Email:</strong> {selectedOrder.client.email}</p>
                    <p><strong>Teléfono:</strong> {selectedOrder.client.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Pedido</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Método de Pago:</strong> {selectedOrder.paymentMethod}</p>
                    <p><strong>Fecha:</strong> {new Date(selectedOrder.issueDate).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                      </span>
                    </p>
                    {selectedOrder.confirmedBy && (
                      <p className="mt-2">
                        <strong>Confirmado por:</strong> {selectedOrder.confirmedBy.name} ({selectedOrder.confirmedBy.employeeId})
                      </p>
                    )}
                    {selectedOrder.confirmedAt && (
                      <p>
                        <strong>Fecha de confirmación:</strong> {new Date(selectedOrder.confirmedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Comprobante de Pago */}
              {selectedOrder.paymentProofImage && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Comprobante de Pago
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="relative inline-block">
                      <Image
                        src={selectedOrder.paymentProofImage}
                        alt="Comprobante de pago"
                        width={500}
                        height={500}
                        className="max-w-full h-auto rounded-lg border-2 border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedOrder.paymentProofImage, '_blank')}
                        unoptimized
                      />
                      <button
                        onClick={() => window.open(selectedOrder.paymentProofImage, '_blank')}
                        className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                        title="Ver en tamaño completo"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                    {(selectedOrder.status === 'SOLICITADO' || selectedOrder.status === 'PENDIENTE') && (
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => {
                            confirmPayment(selectedOrder._id);
                          }}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Confirmar Pago
                        </button>
                        <button
                          onClick={() => {
                            rejectPayment(selectedOrder._id);
                          }}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rechazar Pago
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notas</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Totales */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
                  <span className="text-lg font-semibold text-gray-900">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">IGV (18%):</span>
                  <span className="text-lg font-semibold text-gray-900">{formatPrice(selectedOrder.igv)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
