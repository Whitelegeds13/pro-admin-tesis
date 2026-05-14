'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';

interface ProductItem {
  _id: string;
  product: { name: string; code?: string; brand?: { name: string }; category?: { name: string } };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface SaleData {
  _id: string;
  saleNumber: string;
  receiptType: string;
  receiptNumber: string;
  series?: string;
  issueDate: string;
  paymentMethod: string;
  currency: 'PEN' | 'USD' | 'EUR';
  subtotal: number;
  igv: number;
  total: number;
  client: { name: string; documentNumber: string; email: string };
}

export default function ComprobantePage() {
  const params = useParams();
  const search = useSearchParams();
  const { state } = useAuth();
  const { showToast } = useToast();
  const id = params?.id as string;
  const [sale, setSale] = useState<SaleData | null>(null);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const clientId = state.client?._id || search.get('clientId') || '';
        const res = await fetch(`/api/auth/client/sales/${id}?clientId=${clientId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setSale(data.sale);
          setItems(data.items || []);
        } else {
          setError(data.message || 'No se pudo cargar el comprobante');
        }
      } catch {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, state.client?._id, search]);

  useEffect(() => {
    const genQr = async () => {
      if (!id) return;
      const clientId = state.client?._id || search.get('clientId') || '';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const link = `${baseUrl}/comprobante/${id}?clientId=${clientId}`;
      try {
        const dataUrl = await QRCode.toDataURL(link);
        setQrDataUrl(dataUrl);
      } catch {
        setQrDataUrl('');
      }
    };
    genQr();
  }, [id, state.client?._id, search]);

  const formatCurrency = (n: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!sale) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto p-6 print:p-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold">Palacio Gamer</h1>
                    <p className="text-sm text-gray-600">Comprobante de pago</p>
                  </div>
                  <div className="flex items-center gap-3 print:hidden">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Descargar PDF</button>
                    <button
                      onClick={async () => {
                        try {
                          const clientId = state.client?._id || search.get('clientId') || '';
                          const res = await fetch(`/api/auth/client/sales/${id}/send-pdf?clientId=${clientId}`, { method: 'POST' });
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
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Enviar por correo
                    </button>
                    <button
                      onClick={() => setShowQr(true)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      QR
                    </button>
                  </div>
                </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <div className="font-semibold mb-2">Cliente</div>
            <p>Nombre: {sale.client.name}</p>
            <p>Documento: {sale.client.documentNumber}</p>
            <p>Email: {sale.client.email}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="font-semibold mb-2">Comprobante</div>
            <p>Número de pedido: {sale.saleNumber}</p>
            <p>Comprobante: {sale.receiptType} {sale.series && `${sale.series}-`}{sale.receiptNumber}</p>
            <p>Fecha de emisión: {formatDate(sale.issueDate)}</p>
            <p>Método de pago: {sale.paymentMethod}</p>
          </div>
        </div>

        {qrDataUrl && (
          <div className="flex items-center justify-center mb-6">
            <img src={qrDataUrl} alt="QR Comprobante" className="w-36 h-36 border rounded" />
          </div>
        )}

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Producto</th>
              <th className="text-left p-2">Cantidad</th>
              <th className="text-left p-2">Precio</th>
              <th className="text-left p-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id} className="border-b">
                <td className="p-2">
                  <div className="font-medium">{it.product?.name}</div>
                  <div className="text-gray-500 text-xs">{it.product?.code}</div>
                </td>
                <td className="p-2">{it.quantity}</td>
                <td className="p-2">{formatCurrency(it.unitPrice)}</td>
                <td className="p-2 font-semibold">{formatCurrency(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bg-gray-50 p-4 rounded">
          <div className="flex justify-between mb-1"><span>Subtotal</span><span className="font-medium">{formatCurrency(sale.subtotal)}</span></div>
          <div className="flex justify-between mb-1"><span>IGV (18%)</span><span className="font-medium">{formatCurrency(sale.igv)}</span></div>
          <div className="flex justify-between border-t pt-2 mt-2"><span className="font-bold">Total</span><span className="font-bold">{formatCurrency(sale.total)}</span></div>
        </div>
      </div>

      {showQr && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QR del Comprobante</h3>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Comprobante" className="w-64 h-64 mx-auto border rounded" />
            ) : (
              <div className="p-12 text-center text-gray-600">Generando...</div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowQr(false)} className="px-4 py-2 border rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { margin: 0; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
