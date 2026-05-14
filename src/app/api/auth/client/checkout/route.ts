/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';
import Product from '@/models/Product';
import Client from '@/models/Client';
import Employee from '@/models/Employee';
import { sendEmail } from '@/lib/email';
import { orderConfirmationTemplate } from '@/lib/email-templates';

// POST - Crear venta desde checkout del cliente
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      clientId,
      items,
      shippingAddress,
      paymentMethod,
      paymentProofImage
    } = body;

    // Validar campos requeridos
    if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Datos de compra inválidos'
      }, { status: 400 });
    }

    // Verificar que el cliente existe
    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Cliente no encontrado'
      }, { status: 404 });
    }

    // Buscar un empleado por defecto (puede ser un empleado del sistema)
    // Por ahora, buscaremos cualquier empleado activo o crearemos uno por defecto
    const employee = await Employee.findOne({ isActive: true });
    
    if (!employee) {
      // Si no hay empleados, retornar error
      return NextResponse.json({
        success: false,
        message: 'No hay empleados disponibles para procesar la venta'
      }, { status: 500 });
    }

    // Verificar stock y calcular totales
    let subtotal = 0;
    const saleItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({
          success: false,
          message: `El producto ${item.productId} no existe`
        }, { status: 400 });
      }

      if (!product.isActive) {
        return NextResponse.json({
          success: false,
          message: `El producto ${product.name} no está disponible`
        }, { status: 400 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({
          success: false,
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
        }, { status: 400 });
      }

      const itemSubtotal = item.quantity * item.price;
      subtotal += itemSubtotal;
      
      saleItems.push({
        product,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal
      });
    }

    // Calcular IGV (18% en Perú)
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Determinar estado según método de pago
    const requiresProof = ['QR', 'APP', 'YAPE', 'PLIN'].includes(paymentMethod);
    const initialStatus = requiresProof ? 'SOLICITADO' : 'PAGADO';
    
    // Validar que se proporcione comprobante si es requerido
    if (requiresProof && !paymentProofImage) {
      return NextResponse.json({
        success: false,
        message: 'Debe proporcionar una imagen del comprobante de pago'
      }, { status: 400 });
    }

    // Generar número de comprobante único
    const timestamp = Date.now();
    const receiptNumber = `V-${timestamp}`;
    const series = 'F001'; // Serie por defecto

    // Debug: Verificar valores antes de crear la venta
    console.log('Creating sale with:', {
      paymentMethod,
      status: initialStatus,
      hasProof: !!paymentProofImage
    });

    // Crear la venta
    const newSale = new Sale({
      saleNumber: `SALE-${timestamp}`,
      client: clientId,
      employee: employee._id,
      receiptType: 'BOLETA', // Por defecto boleta para e-commerce
      receiptNumber,
      series,
      currency: 'PEN',
      exchangeRate: 1,
      paymentMethod: paymentMethod || 'EFECTIVO',
      issueDate: new Date(),
      status: initialStatus,
      paymentProofImage: paymentProofImage || undefined,
      subtotal,
      igv,
      total,
      notes: shippingAddress ? `Dirección de envío: ${shippingAddress}` : undefined
    });

    await newSale.save();

    // Crear items de venta
    const createdItems = [];
    for (const item of saleItems) {
      const saleItem = new SaleItem({
        sale: newSale._id,
        product: item.product._id,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.subtotal
      });

      await saleItem.save();
      createdItems.push(saleItem);
    }

    // Solo actualizar stock si el pago está confirmado (PAGADO)
    // Para métodos QR/APP, el stock se actualizará cuando se confirme el pago
    if (initialStatus === 'PAGADO') {
      for (const item of saleItems) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    // Actualizar estadísticas del cliente
    await Client.findByIdAndUpdate(clientId, {
      $inc: { totalPurchases: 1 },
      lastPurchaseDate: new Date()
    });

    // Obtener la venta con las referencias pobladas
    const populatedSale = await Sale.findById(newSale._id)
      .populate('client', 'name documentNumber email')
      .populate('employee', 'name employeeId email')
      .populate('items');

    // Obtener items de venta con productos para el email
    const saleItemsWithProducts = await SaleItem.find({ sale: newSale._id })
      .populate('product', 'name');

    // Preparar datos para el email
    const emailItems = saleItemsWithProducts.map((item: any) => ({
      productName: item.product?.name || 'Producto',
      quantity: item.quantity,
      price: item.unitPrice,
      subtotal: item.subtotal
    }));

    // Enviar email de confirmación (no bloquea la respuesta si falla)
    if (client.email) {
      try {
        const emailHtml = orderConfirmationTemplate({
          orderNumber: newSale.saleNumber,
          clientName: client.name,
          clientEmail: client.email,
          orderDate: new Date().toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          items: emailItems,
          subtotal,
          igv,
          total,
          paymentMethod: paymentMethod || 'EFECTIVO',
          status: initialStatus,
          shippingAddress,
          receiptNumber,
          receiptType: 'BOLETA'
        });

        await sendEmail({
          to: client.email,
          subject: `Confirmación de Pedido #${newSale.saleNumber} - Palacio Gamer`,
          html: emailHtml
        });
      } catch (emailError) {
        // No fallar la operación si el email falla, solo loguear
        console.error('Error enviando email de confirmación:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Compra realizada exitosamente',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sale: populatedSale ? (populatedSale as any).toSafeObject() : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: createdItems.map(item => (item as any).toSafeObject())
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing checkout:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al procesar la compra',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

