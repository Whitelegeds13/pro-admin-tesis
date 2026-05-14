'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Image as ImageIcon,
  ZoomIn,
  FileDown,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import { exportTableToPDF, exportTableToWord } from '@/lib/export'

interface Sale {
  saleNumber: string;
  _id: string;
  client: {
    _id: string;
    name: string;
    documentNumber: string;
    email: string;
  };
  employee?: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
  };
  worker?: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
  };
  receiptType: string;
  receiptNumber: string;
  series: string;
  currency: string;
  exchangeRate: number;
  paymentMethod: string;
  issueDate: string;
  dueDate?: string;
  status: 'SOLICITADO' | 'PENDIENTE' | 'CONFIRMADO' | 'PAGADO' | 'CANCELADO' | 'DEVUELTO';
  paymentProofImage?: string;
  igv: number;
  subtotal: number;
  total: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  _id: string;
  name: string;
  documentNumber: string;
  email: string;
}

interface Product {
  _id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  brand: {
    name: string;
  };
  category: {
    name: string;
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{ _id: string; product: { name: string; code?: string; brand?: { name: string }; category?: { name: string } }; quantity: number; unitPrice: number; discount?: number; subtotal: number }>>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    worker: '',
    receiptType: 'Boleta',
    receiptNumber: '',
    series: '',
    currency: 'PEN',
    exchangeRate: 1,
    paymentMethod: 'Efectivo',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [] as { product: string; quantity: number; unitPrice: number; total: number }[],
    notes: ''
  });
  const [currentItem, setCurrentItem] = useState({
    product: '',
    quantity: 1,
    priceAtSale: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  interface Employee {
    _id?: string;
    id?: string; // El API devuelve 'id' en lugar de '_id'
    employeeId: string;
    name: string;
    email: string;
    role: string;
    department: string;
  }

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    avgSale: 0
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/sales?${params}`);
      const data = await response.json();

      if (data.success) {
        setSales(data.sales);
        setStats(data.stats);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, startDate, endDate]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/clients');
      const data = await response.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchClients();
    fetchProducts();
    
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
    }
  }, [fetchData, fetchClients, fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.items.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    try {
      const response = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Venta creada exitosamente');
        setShowModal(false);
        setFormData({
          client: '',
          worker: '',
          receiptType: 'Boleta',
          receiptNumber: '',
          series: '',
          currency: 'PEN',
          exchangeRate: 1,
          paymentMethod: 'Efectivo',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          items: [],
          notes: ''
        });
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting sale:', error);
      setError('Error de conexión');
    }
  };

  const addItem = () => {
    if (!currentItem.product || currentItem.quantity <= 0 || currentItem.priceAtSale <= 0) {
      setError('Complete todos los campos del producto');
      return;
    }

    const product = products.find(p => p._id === currentItem.product);
    if (!product) {
      setError('Producto no encontrado');
      return;
    }

    if (product.stock < currentItem.quantity) {
      setError(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    const newItem = {
      product: currentItem.product,
      quantity: currentItem.quantity,
      unitPrice: currentItem.priceAtSale,
      total: currentItem.quantity * currentItem.priceAtSale
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setCurrentItem({
      product: '',
      quantity: 1,
      priceAtSale: 0
    });
    setError('');
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const completeSale = async (saleId: string) => {
    try {
      const response = await fetch(`/api/admin/sales/${saleId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Venta completada exitosamente');
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al completar la venta');
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      setError('Error de conexión');
    }
  };

  const cancelSale = async (saleId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta venta?')) return;

    try {
      const response = await fetch(`/api/admin/sales/${saleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Venta cancelada exitosamente');
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cancelar la venta');
      }
    } catch (error) {
      console.error('Error cancelling sale:', error);
      setError('Error de conexión');
    }
  };

  const confirmPayment = async (saleId: string) => {
    if (!confirm('¿Confirmar que el pago es válido y proceder con la venta?')) return;

    // El API devuelve 'id', pero también puede tener '_id'
    const employeeId = employee?.id || employee?._id;
    
    if (!employeeId) {
      setError('No se pudo identificar al empleado. Por favor, inicia sesión nuevamente.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/sales/${saleId}/confirm-payment`, {
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
        fetchData();
      } else {
        setError(data.message || 'Error al confirmar el pago');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setError('Error de conexión');
    }
  };

  const rejectPayment = async (saleId: string) => {
    if (!confirm('¿Rechazar este pago? La venta será cancelada.')) return;

    try {
      const response = await fetch(`/api/admin/sales/${saleId}/confirm-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Pago rechazado. Venta cancelada.');
        fetchData();
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
      case 'DEVUELTO':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'SOLICITADO':
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
      case 'DEVUELTO':
        return 'bg-orange-100 text-orange-800';
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
      case 'DEVUELTO':
        return 'Devuelto';
      case 'SOLICITADO':
        return 'Solicitado';
      case 'PENDIENTE':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const handleExportPDF = async () => {
    const columns = ['Venta', 'Cliente', 'Vendedor', 'Total', 'Estado', 'Fecha'];
    const rows = sales.map((sale) => [
      `${sale.receiptType} ${sale.series}-${sale.receiptNumber}`,
      sale.client.name,
      sale.employee?.name || sale.worker?.name || '',
      Number(sale.total).toFixed(2),
      getStatusText(sale.status),
      new Date(sale.issueDate).toLocaleDateString('es-PE')
    ]);
    await exportTableToPDF('Ventas Presenciales', columns, rows, 'ventas_presenciales.pdf');
  };

  const handleExportWord = () => {
    const columns = ['Venta', 'Cliente', 'Vendedor', 'Total', 'Estado', 'Fecha'];
    const rows = sales.map((sale) => [
      `${sale.receiptType} ${sale.series}-${sale.receiptNumber}`,
      sale.client.name,
      sale.employee?.name || sale.worker?.name || '',
      Number(sale.total).toFixed(2),
      getStatusText(sale.status),
      new Date(sale.issueDate).toLocaleDateString('es-PE')
    ]);
    exportTableToWord('Ventas Presenciales', columns, rows, 'ventas_presenciales.doc');
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const igv = subtotal * 0.18;
    return {
      subtotal,
      igv,
      total: subtotal + igv
    };
  };

  const totals = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Ventas</h1>
          <p className="text-gray-600 mt-1">Gestiona las ventas de tu tienda</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Venta
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">S/ {stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio por Venta</p>
              <p className="text-2xl font-bold text-gray-900">S/ {stats.avgSale.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar ventas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
            <option value="returned">Devuelta</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Fecha inicio"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Fecha fin"
          />

          <button
            onClick={fetchData}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtrar
          </button>

          <button
            onClick={() => { setStatusFilter('PAGADO'); fetchData(); }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            title="Mostrar ventas completadas"
          >
            <CheckCircle className="h-4 w-4" />
            Ventas logradas
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            title="Exportar a PDF"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </button>

          <button
            onClick={handleExportWord}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
            title="Exportar a Word"
          >
            <FileText className="h-4 w-4" />
            Exportar Word
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Lista de ventas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando ventas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Venta</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vendedor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {sale.receiptType} {sale.series}-{sale.receiptNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.paymentMethod} • {sale.currency}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{sale.client.name}</div>
                        <div className="text-sm text-gray-500">{sale.client.documentNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{sale.employee?.name || sale.worker?.name || ''}</div>
                        <div className="text-sm text-gray-500">{sale.employee?.employeeId || sale.worker?.employeeId || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        S/ {sale.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        IGV: S/ {sale.igv.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                        {getStatusIcon(sale.status)}
                        <span className="ml-1">{getStatusText(sale.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(sale.issueDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(sale.issueDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={async () => {
                            setDetailsLoading(true);
                            try {
                              const res = await fetch(`/api/admin/sales/${sale._id}`);
                              const data = await res.json();
                              if (res.ok) {
                                setSelectedSale(data.sale);
                                setSelectedItems(data.items || []);
                              } else {
                                setSelectedSale(sale);
                                setSelectedItems([]);
                              }
                              setShowDetailsModal(true);
                            } finally {
                              setDetailsLoading(false);
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Botones para confirmar/rechazar pagos pendientes */}
                        {(sale.status === 'SOLICITADO' || sale.status === 'PENDIENTE') && (
                          <>
                            <button
                              onClick={() => confirmPayment(sale._id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Confirmar pago"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => rejectPayment(sale._id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Rechazar pago"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {(sale.status === 'SOLICITADO' || sale.status === 'PENDIENTE') && (
                          <>
                            <button
                              onClick={() => completeSale(sale._id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Completar venta"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => cancelSale(sale._id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Cancelar venta"
                            >
                              <XCircle className="h-4 w-4" />
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

      {/* Modal para nueva venta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nueva Venta</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>
                        {client.name} - {client.documentNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vendedor *
                  </label>
                  <input
                    type="text"
                    value="Empleado actual"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Comprobante *
                  </label>
                  <select
                    value={formData.receiptType}
                    onChange={(e) => setFormData({ ...formData, receiptType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Boleta">Boleta</option>
                    <option value="Factura">Factura</option>
                    <option value="Nota de Venta">Nota de Venta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Comprobante *
                  </label>
                  <input
                    type="text"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Serie *
                  </label>
                  <input
                    type="text"
                    value={formData.series}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="B001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                  </select>
                </div>
              </div>

              {/* Agregar productos */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Producto *
                    </label>
                    <select
                      value={currentItem.product}
                      onChange={(e) => {
                        const product = products.find(p => p._id === e.target.value);
                        setCurrentItem({
                          ...currentItem,
                          product: e.target.value,
                          priceAtSale: product?.price || 0
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} - S/ {product.price} (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentItem.priceAtSale}
                      onChange={(e) => setCurrentItem({ ...currentItem, priceAtSale: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de productos agregados */}
                {formData.items.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Productos Agregados</h4>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.product}</div>
                            <div className="text-sm text-gray-500">
                              {item.quantity} x S/ {item.unitPrice.toFixed(2)} = S/ {item.total.toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Totales */}
              {formData.items.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
                      <span className="text-lg font-semibold text-gray-900">S/ {totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900">IGV (18%):</span>
                      <span className="text-lg font-semibold text-gray-900">S/ {totals.igv.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                      <span className="text-xl font-bold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-gray-900">S/ {totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Crear Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de venta */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de Venta - {selectedSale.saleNumber}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {detailsLoading && (
                <div className="text-gray-600">Cargando detalles...</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Nombre:</strong> {selectedSale.client.name}</p>
                    <p><strong>Documento:</strong> {selectedSale.client.documentNumber}</p>
                    <p><strong>Email:</strong> {selectedSale.client.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de la Venta</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Comprobante:</strong> {selectedSale.receiptType} {selectedSale.series}-{selectedSale.receiptNumber}</p>
                    <p><strong>Vendedor:</strong> {selectedSale.employee?.name || selectedSale.worker?.name || ''}</p>
                    <p><strong>Método de Pago:</strong> {selectedSale.paymentMethod}</p>
                    <p><strong>Fecha:</strong> {new Date(selectedSale.issueDate).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSale.status)}`}>
                        {getStatusIcon(selectedSale.status)}
                        <span className="ml-1">{getStatusText(selectedSale.status)}</span>
                      </span>
                    </p>
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
                    {(selectedSale.status === 'SOLICITADO' || selectedSale.status === 'PENDIENTE') && (
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => {
                            confirmPayment(selectedSale._id);
                            setShowDetailsModal(false);
                          }}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Confirmar Pago
                        </button>
                        <button
                          onClick={() => {
                            rejectPayment(selectedSale._id);
                            setShowDetailsModal(false);
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

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Productos</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedItems.length === 0 ? (
                    <p className="text-gray-600">No hay productos registrados para esta venta.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedItems.map((item) => (
                          <tr key={item._id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <div className="font-medium">{item.product?.name || 'Producto'}</div>
                              <div className="text-gray-500 text-xs">{item.product?.code} {item.product?.brand?.name ? `• ${item.product.brand.name}` : ''}</div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">S/ {item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 font-semibold">S/ {item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
                  <span className="text-lg font-semibold text-gray-900">S/ {selectedSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">IGV (18%):</span>
                  <span className="text-lg font-semibold text-gray-900">S/ {selectedSale.igv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">S/ {selectedSale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
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
