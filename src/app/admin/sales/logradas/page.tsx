'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Filter, CheckCircle, DollarSign, TrendingUp, ShoppingCart, FileDown, FileText } from 'lucide-react'
import { exportTableToPDF, exportTableToWord } from '@/lib/export'

interface Sale {
  _id: string
  client: { _id: string; name: string; documentNumber: string; email: string }
  employee?: { _id: string; name: string; employeeId: string; email: string }
  worker?: { _id: string; name: string; employeeId: string; email: string }
  receiptType: string
  receiptNumber: string
  series: string
  currency: string
  paymentMethod: string
  issueDate: string
  status: string
  igv: number
  total: number
  createdAt: string
}

export default function SalesAchievedPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0, avgSale: 0 })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('status', 'PAGADO')
      if (searchTerm) params.append('search', searchTerm)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const res = await fetch(`/api/admin/sales?${params}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setSales(data.sales || [])
        setStats(data.stats || { totalSales: data.sales?.length || 0, totalRevenue: (data.sales||[]).reduce((s: number, v: Sale)=> s+v.total, 0), avgSale: 0 })
      } else {
        setSales([])
        setError(data.message || 'Error al cargar ventas logradas')
      }
    } finally {
      setLoading(false)
    }
  }, [searchTerm, startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredSales = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return sales
    return sales.filter(s =>
      s.receiptNumber.toLowerCase().includes(term) ||
      s.series.toLowerCase().includes(term) ||
      s.client.name.toLowerCase().includes(term) ||
      (s.client.documentNumber || '').toLowerCase().includes(term)
    )
  }, [sales, searchTerm])

  const handleExportPDF = async () => {
    const columns = ['Venta', 'Cliente', 'Vendedor', 'Total', 'Fecha']
    const rows = filteredSales.map((sale) => [
      `${sale.receiptType} ${sale.series}-${sale.receiptNumber}`,
      sale.client.name,
      sale.employee?.name || sale.worker?.name || '',
      Number(sale.total).toFixed(2),
      new Date(sale.issueDate).toLocaleDateString('es-PE')
    ])
    await exportTableToPDF('Ventas logradas', columns, rows, 'ventas_logradas.pdf')
  }

  const handleExportWord = () => {
    const columns = ['Venta', 'Cliente', 'Vendedor', 'Total', 'Fecha']
    const rows = filteredSales.map((sale) => [
      `${sale.receiptType} ${sale.series}-${sale.receiptNumber}`,
      sale.client.name,
      sale.employee?.name || sale.worker?.name || '',
      Number(sale.total).toFixed(2),
      new Date(sale.issueDate).toLocaleDateString('es-PE')
    ])
    exportTableToWord('Ventas logradas', columns, rows, 'ventas_logradas.doc')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ventas Logradas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">S/ {(stats.totalRevenue || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio por Venta</p>
              <p className="text-2xl font-bold text-gray-900">S/ {(stats.avgSale || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
          <div className="flex items-center justify-end">
            <span className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
              <CheckCircle className="h-4 w-4 mr-2" /> Solo PAGADO
            </span>
          </div>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{sale.receiptType} {sale.series}-{sale.receiptNumber}</div>
                        <div className="text-sm text-gray-500">{sale.paymentMethod} • {sale.currency}</div>
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
                    <td className="px-6 py-4 font-semibold">S/ {sale.total.toFixed(2)}</td>
                    <td className="px-6 py-4">{new Date(sale.issueDate).toLocaleDateString('es-PE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
