'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, CheckCircle, Eye } from 'lucide-react'

interface OrderItem { _id: string; product: { _id: string; name: string; code?: string }; quantity: number; unitPrice: number; subtotal: number }
interface Order {
  _id: string;
  saleNumber: string;
  client: { _id: string; name: string; documentNumber?: string; email?: string };
  employee?: { _id: string; name: string; employeeId?: string };
  receiptType: string; series: string; receiptNumber: string;
  paymentMethod: string; issueDate: string; status: string;
  confirmedBy?: { name: string; employeeId: string };
  confirmedAt?: string;
  subtotal: number; igv: number; total: number;
  items: OrderItem[];
}

export default function ConfirmedOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('status', 'PAGADO')
      if (searchTerm) params.append('search', searchTerm)
      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await res.json()
      if (res.ok && data.success) setOrders(data.orders || [])
      else setOrders([])
    } finally { setLoading(false) }
  }, [searchTerm])

  useEffect(()=>{ fetchOrders() }, [fetchOrders])

  const formatPrice = (n: number) => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(n)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pedidos Confirmados</h1>
        <p className="text-gray-600">Pedidos del e-commerce que ya han sido confirmados.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar por número o cliente" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Cargando pedidos...</div>
        ) : orders.length===0 ? (
          <div className="p-8 text-center text-gray-600">No hay pedidos confirmados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pedido</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.saleNumber}</div>
                      <div className="text-sm text-gray-500">{order.receiptType} {order.series}-{order.receiptNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.client.name}</div>
                      <div className="text-sm text-gray-500">{order.client.documentNumber}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <CheckCircle className="h-4 w-4 mr-1" /> Pagado
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(order.issueDate).toLocaleDateString('es-PE')}</td>
                    <td className="px-6 py-4">
                      <button onClick={()=>{ setSelectedOrder(order); setShowDetailsModal(true) }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b"><h2 className="text-2xl font-bold">Detalles del Pedido</h2></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="font-semibold mb-2">Cliente</div>
                  <p>{selectedOrder.client.name}</p>
                  <p>{selectedOrder.client.documentNumber}</p>
                  <p>{selectedOrder.client.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="font-semibold mb-2">Pedido</div>
                  <p>Comprobante: {selectedOrder.receiptType} {selectedOrder.series}-{selectedOrder.receiptNumber}</p>
                  <p>Fecha: {new Date(selectedOrder.issueDate).toLocaleString('es-PE')}</p>
                  {selectedOrder.confirmedBy && <p>Confirmado por: {selectedOrder.confirmedBy.name} ({selectedOrder.confirmedBy.employeeId})</p>}
                  {selectedOrder.confirmedAt && <p>Confirmado el: {new Date(selectedOrder.confirmedAt).toLocaleString('es-PE')}</p>}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="font-semibold mb-2">Productos</div>
                <div className="space-y-2">
                  {selectedOrder.items.map(it=> (
                    <div key={it._id} className="flex justify-between">
                      <div>
                        <div className="font-medium">{it.product?.name}</div>
                        <div className="text-xs text-gray-500">{it.product?.code}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{it.quantity} x S/ {it.unitPrice.toFixed(2)}</div>
                        <div className="font-semibold">{formatPrice(it.subtotal)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t pt-2 text-right">
                  <div>Subtotal: <span className="font-semibold">{formatPrice(selectedOrder.subtotal)}</span></div>
                  <div>IGV (18%): <span className="font-semibold">{formatPrice(selectedOrder.igv)}</span></div>
                  <div className="text-lg">Total: <span className="font-bold">{formatPrice(selectedOrder.total)}</span></div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={()=>{ setShowDetailsModal(false); setSelectedOrder(null) }} className="px-4 py-2 border rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
