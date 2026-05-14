'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingBag, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface Purchase {
  _id: string;
  supplier: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  employee: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
  };
  orderNumber: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  originalListVoucher?: string;
  notes?: string;
  total: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Product {
  _id: string;
  name: string;
  code: string;
  costPrice?: number;
  stock: number;
  brand: {
    name: string;
  };
  category: {
    name: string;
  };
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState({
    supplier: '',
    employee: '',
    orderNumber: '',
    invoiceNumber: '',
    invoiceDate: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    originalListVoucher: '',
    items: [] as { product: string; quantity: number; unitPrice: number; total: number }[],
    notes: ''
  });
  const [currentItem, setCurrentItem] = useState({
    product: '',
    quantity: 1,
    unitCost: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    avgPurchase: 0
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/purchases?${params}`);
      const data = await response.json();

      if (data.success) {
        setPurchases(data.purchases);
        setStats(data.stats);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setError('Error al cargar las compras');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, startDate, endDate]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/suppliers');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
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
    fetchSuppliers();
    fetchProducts();
  }, [fetchData, fetchSuppliers, fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.items.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    try {
      const response = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Compra creada exitosamente');
        setShowModal(false);
        setFormData({
          supplier: '',
          employee: '',
          orderNumber: '',
          invoiceNumber: '',
          invoiceDate: '',
          orderDate: new Date().toISOString().split('T')[0],
          expectedDeliveryDate: '',
          originalListVoucher: '',
          items: [],
          notes: ''
        });
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting purchase:', error);
      setError('Error de conexión');
    }
  };

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede exceder 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, originalListVoucher: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    if (!currentItem.product || currentItem.quantity <= 0 || currentItem.unitCost <= 0) {
      setError('Complete todos los campos del producto');
      return;
    }

    const product = products.find(p => p._id === currentItem.product);
    if (!product) {
      setError('Producto no encontrado');
      return;
    }

    const newItem = {
      product: currentItem.product,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitCost,
      total: currentItem.quantity * currentItem.unitCost
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setCurrentItem({
      product: '',
      quantity: 1,
      unitCost: 0
    });
    setError('');
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const receivePurchase = async (purchaseId: string) => {
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actualDeliveryDate: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        setSuccess('Compra recibida exitosamente');
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al recibir la compra');
      }
    } catch (error) {
      console.error('Error receiving purchase:', error);
      setError('Error de conexión');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'ordered':
        return <Truck className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received':
        return 'Recibida';
      case 'cancelled':
        return 'Cancelada';
      case 'ordered':
        return 'Ordenada';
      default:
        return 'Pendiente';
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Compras</h1>
          <p className="text-gray-600 mt-1">Gestiona las compras y proveedores</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Compra
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">S/ {stats.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio por Compra</p>
              <p className="text-2xl font-bold text-gray-900">S/ {stats.avgPurchase.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar compras..."
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
            <option value="ordered">Ordenada</option>
            <option value="received">Recibida</option>
            <option value="cancelled">Cancelada</option>
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

      {/* Lista de compras */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando compras...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Orden</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Proveedor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Empleado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {purchase.orderNumber}
                        </div>
                        {purchase.invoiceNumber && (
                          <div className="text-sm text-gray-500">
                            Factura: {purchase.invoiceNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{purchase.supplier.name}</div>
                        <div className="text-sm text-gray-500">{purchase.supplier.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{purchase.employee.name}</div>
                        <div className="text-sm text-gray-500">{purchase.employee.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        S/ {purchase.total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                        {getStatusIcon(purchase.status)}
                        <span className="ml-1">{getStatusText(purchase.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(purchase.orderDate).toLocaleDateString()}
                      </div>
                      {purchase.expectedDeliveryDate && (
                        <div className="text-sm text-gray-500">
                          Entrega: {new Date(purchase.expectedDeliveryDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {purchase.status === 'ordered' && (
                          <button
                            onClick={() => receivePurchase(purchase._id)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Recibir compra"
                          >
                            <Package className="h-4 w-4" />
                          </button>
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

      {/* Modal para nueva compra */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nueva Compra</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name} - {supplier.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Empleado *
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
                    Número de Orden *
                  </label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ORD-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Factura
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="F001-000001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Orden *
                  </label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Entrega Esperada
                  </label>
                  <input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Comprobante de lista original (Opcional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 bg-gray-50 hover:bg-blue-50/50 transition-all cursor-pointer relative overflow-hidden group">
                    {!formData.originalListVoucher ? (
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label className="relative cursor-pointer rounded-md font-bold text-blue-600 hover:text-blue-500 p-1 z-10 w-full h-full">
                            <span>Haz clic para subir imagen</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleVoucherUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Archivos JPG, PNG hasta 5MB</p>
                      </div>
                    ) : (
                      <div className="relative w-full flex justify-center">
                        <img 
                          src={formData.originalListVoucher} 
                          alt="Comprobante" 
                          className="max-h-48 rounded-lg shadow-sm" 
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, originalListVoucher: '' })}
                          className="absolute -top-3 -right-3 sm:right-auto sm:translate-x-32 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 hover:scale-110 transition-transform z-20"
                          title="Eliminar imagen"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
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
                          unitCost: product?.costPrice || 0
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} - S/ {product.costPrice || 0}
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
                      Costo Unitario *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentItem.unitCost}
                      onChange={(e) => setCurrentItem({ ...currentItem, unitCost: parseFloat(e.target.value) || 0 })}
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

              {/* Total */}
              {formData.items.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-gray-900">S/ {calculateTotal().toFixed(2)}</span>
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
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de compra */}
      {showDetailsModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de Compra - {selectedPurchase.orderNumber}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Proveedor</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Nombre:</strong> {selectedPurchase.supplier.name}</p>
                    <p><strong>Email:</strong> {selectedPurchase.supplier.email}</p>
                    <p><strong>Teléfono:</strong> {selectedPurchase.supplier.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de la Compra</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Empleado:</strong> {selectedPurchase.employee.name}</p>
                    <p><strong>Fecha de Orden:</strong> {new Date(selectedPurchase.orderDate).toLocaleDateString()}</p>
                    {selectedPurchase.expectedDeliveryDate && (
                      <p><strong>Entrega Esperada:</strong> {new Date(selectedPurchase.expectedDeliveryDate).toLocaleDateString()}</p>
                    )}
                    <p><strong>Estado:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPurchase.status)}`}>
                        {getStatusIcon(selectedPurchase.status)}
                        <span className="ml-1">{getStatusText(selectedPurchase.status)}</span>
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Productos</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600">Los detalles de los productos se cargarán aquí...</p>
                </div>
              </div>

              {selectedPurchase.originalListVoucher && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Comprobante Original</h3>
                  <div className="bg-gray-50 rounded-lg p-4 flex justify-center">
                    <img 
                      src={selectedPurchase.originalListVoucher} 
                      alt="Comprobante de compra" 
                      className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200 max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">S/ {selectedPurchase.total.toFixed(2)}</span>
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
