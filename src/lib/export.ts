import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function exportTableToPDF(title: string, columns: string[], rows: Array<Array<string | number>>, fileName = 'export.pdf') {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  let y = 800
  page.drawText(title, { x: 40, y, size: 18, font: fontBold, color: rgb(0, 0, 0) })
  y -= 30
  const colWidths = columns.map(() => 100)
  const startX = 40
  let x = startX
  columns.forEach((col, i) => {
    page.drawText(String(col), { x, y, size: 12, font: fontBold })
    x += colWidths[i]
  })
  y -= 16
  rows.forEach(r => {
    x = startX
    r.forEach((cell, i) => {
      page.drawText(String(cell), { x, y, size: 11, font })
      x += colWidths[i]
    })
    y -= 14
    if (y < 60) {
      const p = doc.addPage([595, 842])
      y = 800
      x = startX
      columns.forEach((col, i) => {
        p.drawText(String(col), { x, y, size: 12, font: fontBold })
        x += colWidths[i]
      })
      y -= 16
    }
  })
  const base64 = await doc.saveAsBase64()
  const url = `data:application/pdf;base64,${base64}`
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  // data URLs no requieren revocación
}

export async function exportCartToPDF(
  items: Array<{ name: string; brand: string; quantity: number; price: number }>,
  options?: { fileName?: string; currency?: 'COP' | 'PEN' | 'USD'; title?: string }
) {
  const fileName = options?.fileName ?? 'cotizacion-productos.pdf'
  const currency = options?.currency ?? 'COP'
  const title = options?.title ?? 'Productos seleccionados'

  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const formatPrice = (n: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'COP' ? 0 : 2
  }).format(n)

  // Encabezado limpio sin imagen
  const headerLeft = 40
  const headerTop = 800
  page.drawText('Palacio Gamer', { x: headerLeft, y: headerTop - 6, size: 22, font: fontBold, color: rgb(0, 0, 0) })
  page.drawText('Cotización de productos', { x: headerLeft, y: headerTop - 30, size: 12, font, color: rgb(0.25, 0.25, 0.25) })

  // Línea separadora
  page.drawRectangle({ x: headerLeft, y: headerTop - 42, width: 515, height: 1.2, color: rgb(0.85, 0.85, 0.85) })

  // Título de sección
  let y = headerTop - 68
  page.drawText(title, { x: headerLeft, y, size: 16, font: fontBold })
  y -= 24

  // Tabla
  const columns = ['Producto', 'Marca', 'Cantidad', 'Precio', 'Subtotal']
  // Ajustar columnas para que quepan exactamente en 515px (márgenes de 40)
  const colWidths = [230, 100, 65, 60, 60]
  const startX = headerLeft
  const tableWidth = colWidths.reduce((a, b) => a + b, 0)
  let x = startX

  // Header de la tabla con fondo
  page.drawRectangle({ x: startX - 4, y: y - 4, width: tableWidth + 8, height: 24, color: rgb(0.95, 0.95, 0.95) })
  columns.forEach((col, i) => {
    page.drawText(String(col), { x, y, size: 12, font: fontBold, color: rgb(0, 0, 0) })
    x += colWidths[i]
  })
  y -= 20

  // Filas
  items.forEach(item => {
    x = startX
    const subtotal = item.price * item.quantity
    const cells = [
      item.name,
      item.brand,
      String(item.quantity),
      formatPrice(item.price),
      formatPrice(subtotal)
    ]
    cells.forEach((cell, i) => {
      const isMoney = i >= 3
      if (isMoney) {
        const textWidth = font.widthOfTextAtSize(cell, 11)
        page.drawText(cell, { x: x + colWidths[i] - textWidth, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) })
      } else {
        page.drawText(cell, { x, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) })
      }
      x += colWidths[i]
    })
    y -= 16
    if (y < 70) {
      const p = doc.addPage([595, 842])
      // nueva página: repetir encabezado de columnas
      y = 800
      x = startX
      p.drawRectangle({ x: startX - 4, y: y - 4, width: tableWidth + 8, height: 24, color: rgb(0.95, 0.95, 0.95) })
      columns.forEach((col, i) => {
        p.drawText(String(col), { x, y, size: 12, font: fontBold })
        x += colWidths[i]
      })
      y -= 20
    }
  })

  // Totales (debajo de la tabla)
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  // Colocar el total al lado derecho al fondo del documento
  const bottomMarginY = 70
  const totalY = bottomMarginY
  const boxWidth = 220
  const rightMarginX = 595 - headerLeft
  const boxX = rightMarginX - boxWidth
  page.drawRectangle({ x: boxX, y: totalY - 8, width: boxWidth, height: 54, color: rgb(0.97, 0.97, 0.97) })
  // Etiqueta "Total" a la izquierda del recuadro, valor alineado a la derecha
  page.drawText('Total', { x: boxX + 12, y: totalY, size: 12, font: fontBold, color: rgb(0.15, 0.15, 0.15) })
  const totalStr = formatPrice(total)
  const tw = fontBold.widthOfTextAtSize(totalStr, 14)
  page.drawText(totalStr, { x: boxX + boxWidth - tw - 12, y: totalY, size: 14, font: fontBold, color: rgb(0, 0, 0) })

  const base64 = await doc.saveAsBase64()
  const url = `data:application/pdf;base64,${base64}`
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function exportTableToWord(title: string, columns: string[], rows: Array<Array<string | number>>, fileName = 'export.doc') {
  const tableHead = `<tr>${columns.map(c => `<th style="border:1px solid #aaa;padding:6px;text-align:left">${String(c)}</th>`).join('')}</tr>`
  const tableRows = rows.map(r => `<tr>${r.map(cell => `<td style="border:1px solid #ddd;padding:6px">${String(cell)}</td>`).join('')}</tr>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h2>${title}</h2><table style="border-collapse:collapse">${tableHead}${tableRows}</table></body></html>`
  const blob = new Blob([html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
