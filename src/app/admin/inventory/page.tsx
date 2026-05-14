'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Package, 
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Edit,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  Truck,
  RotateCcw
} from 'lucide-react';

interface Product {
  _id: string;
  code: string;
  name: string;
  description?: string;
  brand: {
    _id: string;
    name: string;
    logo?: string;
  };
  category: {
    _id: string;
    name: string;
    description?: string;
  };
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  _id: string;
  product: {
    _id: string;
    name: string;
    code: string;
    price: number;
    stock: number;
  };
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer' | 'damage' | 'expired';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  referenceType?: string;
  employee: {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
  };
  notes?: string;
  createdAt: string;
}

interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter] = useState('');
  const [alertFilter, setAlertFilter] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    newStock: 0,
    reason: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });
  const [activeTab, setActiveTab] = useState('inventory');

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (brandFilter) params.append('brand', brandFilter);
      if (alertFilter) {
        if (alertFilter === 'lowStock') params.append('lowStock', 'true');
        if (alertFilter === 'outOfStock') params.append('outOfStock', 'true');
      }

      const response = await fetch(`/api/admin/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setStats(data.stats);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, brandFilter, alertFilter]);

  const fetchMovements = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/inventory/movements');
      const data = await response.json();

      if (data.success) {
        setMovements(data.movements);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchMovements();
  }, [fetchInventory, fetchMovements]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProduct) return;

    try {
      const response = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: selectedProduct._id,
          newStock: adjustmentData.newStock,
          reason: adjustmentData.reason,
          employee: 'current-employee-id', // Esto debería venir del contexto de usuario
          notes: adjustmentData.notes
        }),
      });

      if (response.ok) {
        setSuccess('Stock ajustado exitosamente');
        setShowAdjustModal(false);
        setAdjustmentData({ newStock: 0, reason: '', notes: '' });
        setSelectedProduct(null);
        fetchInventory();
        fetchMovements();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al ajustar el stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setError('Error de conexión');
    }
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { status: 'out', color: 'text-red-600 bg-red-50', icon: XCircle };
    if (stock <= minStock) return { status: 'low', color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-600 bg-green-50', icon: CheckCircle };
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-red-600" />;
      case 'purchase':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'adjustment':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'return':
        return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case 'transfer':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'damage':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-red-100 text-red-800';
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800';
      case 'return':
        return 'bg-purple-100 text-purple-800';
      case 'transfer':
        return 'bg-orange-100 text-orange-800';
      case 'damage':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementText = (type: string) => {
    switch (type) {
      case 'sale':
        return 'Venta';
      case 'purchase':
        return 'Compra';
      case 'adjustment':
        return 'Ajuste';
      case 'return':
        return 'Devolución';
      case 'transfer':
        return 'Transferencia';
      case 'damage':
        return 'Daño';
      case 'expired':
        return 'Vencido';
      default:
        return 'Movimiento';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Inventario</h1>
          <p className="text-gray-600 mt-1">Gestiona el stock y movimientos de productos</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'movements'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Movimientos
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Inventario
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStock.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">S/ {stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las alertas</option>
            <option value="lowStock">Stock Bajo</option>
            <option value="outOfStock">Agotado</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las categorías</option>
            {/* Aquí se cargarían las categorías */}
          </select>

          <button
            onClick={fetchInventory}
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

      {/* Contenido según la pestaña activa */}
      {activeTab === 'inventory' ? (
        /* Lista de inventario */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando inventario...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Producto</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoría</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Marca</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock, product.minStock);
                    const StockIcon = stockStatus.icon;
                    
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">Código: {product.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {product.brand.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold">{product.stock}</span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              <StockIcon className="h-3 w-3 inline mr-1" />
                              {stockStatus.status === 'out' ? 'Agotado' : 
                               stockStatus.status === 'low' ? 'Bajo' : 'Disponible'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Mín: {product.minStock} | Máx: {product.maxStock || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            <StockIcon className="h-3 w-3 inline mr-1" />
                            {stockStatus.status === 'out' ? 'Agotado' : 
                             stockStatus.status === 'low' ? 'Bajo' : 'Disponible'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-semibold text-gray-900">
                            S/ {(product.stock * product.price).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            S/ {product.price.toFixed(2)} c/u
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setAdjustmentData({
                                  newStock: product.stock,
                                  reason: '',
                                  notes: ''
                                });
                                setShowAdjustModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ajustar stock"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowMovementsModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Ver movimientos"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Lista de movimientos */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Producto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cantidad</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock Anterior</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock Nuevo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Empleado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{movement.product.name}</div>
                        <div className="text-sm text-gray-500">{movement.product.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementColor(movement.type)}`}>
                        {getMovementIcon(movement.type)}
                        <span className="ml-1">{getMovementText(movement.type)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-lg font-semibold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {movement.previousStock}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {movement.newStock}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{movement.employee.name}</div>
                        <div className="text-sm text-gray-500">{movement.employee.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(movement.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para ajustar stock */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Ajustar Stock</h2>
              <p className="text-gray-600 mt-1">{selectedProduct.name}</p>
            </div>
            
            <form onSubmit={handleAdjustStock} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Actual
                </label>
                <input
                  type="number"
                  value={selectedProduct.stock}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nuevo Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentData.newStock}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, newStock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Razón del Ajuste *
                </label>
                <input
                  type="text"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Inventario físico, corrección de error, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajustar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver movimientos de producto */}
      {showMovementsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Movimientos de Stock - {selectedProduct.name}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stock Actual</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedProduct.stock}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stock Mínimo</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedProduct.minStock}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-gray-900">S/ {(selectedProduct.stock * selectedProduct.price).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {movements
                  .filter(m => m.product._id === selectedProduct._id)
                  .map((movement) => (
                    <div key={movement._id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementColor(movement.type)}`}>
                            {getMovementIcon(movement.type)}
                            <span className="ml-1">{getMovementText(movement.type)}</span>
                          </span>
                          <span className={`text-lg font-semibold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">
                            {new Date(movement.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(movement.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{movement.reason}</p>
                        {movement.notes && (
                          <p className="text-sm text-gray-500 mt-1">{movement.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowMovementsModal(false)}
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
