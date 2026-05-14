// Templates de email en HTML

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderEmailData {
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  igv: number;
  total: number;
  paymentMethod: string;
  status: string;
  shippingAddress?: string;
  receiptNumber?: string;
  receiptType?: string;
  receiptLink?: string;
  qrCodeDataUrl?: string;
}

// Template base con estilos
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Palacio Gamer</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .order-details {
      background-color: #f9fafb;
      border-radius: 5px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .order-total {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #2563eb;
      font-size: 18px;
      font-weight: bold;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-solicitado {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-pagado {
      background-color: #d1fae5;
      color: #065f46;
    }
    .status-confirmado {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .status-cancelado {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} Palacio Gamer. Todos los derechos reservados.</p>
      <p>Este es un email automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
`;

// Template para confirmación de compra inicial
export function orderConfirmationTemplate(data: OrderEmailData): string {
  const statusClass = `status-${data.status.toLowerCase()}`;
  const statusText = {
    'SOLICITADO': 'Solicitado',
    'PENDIENTE': 'Pendiente',
    'CONFIRMADO': 'Confirmado',
    'PAGADO': 'Pagado',
    'CANCELADO': 'Cancelado',
    'DEVUELTO': 'Devuelto'
  }[data.status] || data.status;

  const paymentMethodText = {
    'EFECTIVO': 'Efectivo',
    'TARJETA': 'Tarjeta de Crédito/Débito',
    'TRANSFERENCIA': 'Transferencia Bancaria',
    'YAPE': 'Yape',
    'PLIN': 'Plin',
    'QR': 'QR',
    'APP': 'Aplicación Móvil'
  }[data.paymentMethod] || data.paymentMethod;

  const itemsHtml = data.items.map(item => `
    <div class="order-item">
      <div>
        <strong>${item.productName}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Cantidad: ${item.quantity}</span>
      </div>
      <div style="text-align: right;">
        <strong>S/ ${item.subtotal.toFixed(2)}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">S/ ${item.price.toFixed(2)} c/u</span>
      </div>
    </div>
  `).join('');

  const content = `
    <div class="header">
      <div class="logo">🎮 Palacio Gamer</div>
      <p style="color: #6b7280; margin: 0;">Tu tienda de tecnología favorita</p>
    </div>
    
    <div class="content">
      <h2 style="color: #2563eb; margin-top: 0;">¡Gracias por tu compra, ${data.clientName}!</h2>
      
      <p>Hemos recibido tu pedido y estamos procesándolo. Te notificaremos cuando sea confirmado.</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0; color: #1f2937;">Detalles del Pedido</h3>
        
        <p><strong>Número de Pedido:</strong> ${data.orderNumber}</p>
        <p><strong>Fecha:</strong> ${data.orderDate}</p>
        <p><strong>Estado:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
        ${data.receiptNumber ? `<p><strong>Comprobante:</strong> ${data.receiptType || 'BOLETA'} ${data.receiptNumber}</p>` : ''}
        <p><strong>Método de Pago:</strong> ${paymentMethodText}</p>
        ${data.shippingAddress ? `<p><strong>Dirección de Envío:</strong> ${data.shippingAddress}</p>` : ''}
        
        <h4 style="margin-top: 20px; margin-bottom: 10px;">Productos:</h4>
        ${itemsHtml}
        
        <div class="order-total">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>S/ ${data.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>IGV (18%):</span>
            <span>S/ ${data.igv.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 20px; color: #2563eb;">
            <span>Total:</span>
            <span>S/ ${data.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      ${data.status === 'SOLICITADO' ? `
        <p style="background-color: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
          <strong>⚠️ Importante:</strong> Tu pedido está pendiente de confirmación. Estamos verificando tu comprobante de pago. Te notificaremos cuando sea confirmado.
        </p>
      ` : ''}
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/pedidos" class="button">Ver Mis Pedidos</a>
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos a través de nuestro 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/contacto" style="color: #2563eb;">centro de atención</a>.
      </p>
    </div>
  `;

  return baseTemplate(content);
}

// Template para cambio de estado de pedido
export function orderStatusUpdateTemplate(data: OrderEmailData): string {
  const statusClass = `status-${data.status.toLowerCase()}`;
  const statusText = {
    'SOLICITADO': 'Solicitado',
    'PENDIENTE': 'Pendiente',
    'CONFIRMADO': 'Confirmado',
    'PAGADO': 'Pagado',
    'CANCELADO': 'Cancelado',
    'DEVUELTO': 'Devuelto'
  }[data.status] || data.status;

  let statusMessage = '';
  let statusIcon = '';

  switch (data.status) {
    case 'CONFIRMADO':
      statusMessage = '¡Tu pago ha sido confirmado! Tu pedido está siendo preparado.';
      statusIcon = '✅';
      break;
    case 'PAGADO':
      statusMessage = '¡Tu pedido ha sido procesado exitosamente! Pronto recibirás más información sobre el envío.';
      statusIcon = '🎉';
      break;
    case 'CANCELADO':
      statusMessage = 'Tu pedido ha sido cancelado. Si realizaste un pago, será reembolsado según nuestras políticas.';
      statusIcon = '❌';
      break;
    default:
      statusMessage = `El estado de tu pedido ha cambiado a: ${statusText}`;
      statusIcon = '📦';
  }

  const content = `
    <div class="header">
      <div class="logo">🎮 Palacio Gamer</div>
    </div>
    
    <div class="content">
      <h2 style="color: #2563eb; margin-top: 0;">${statusIcon} Actualización de tu Pedido</h2>
      
      <p>Hola ${data.clientName},</p>
      
      <p>${statusMessage}</p>
      
      <div class="order-details">
        <p><strong>Número de Pedido:</strong> ${data.orderNumber}</p>
        <p><strong>Nuevo Estado:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
        ${data.receiptNumber ? `<p><strong>Comprobante:</strong> ${data.receiptType || 'BOLETA'} ${data.receiptNumber}</p>` : ''}
        <p><strong>Total:</strong> S/ ${data.total.toFixed(2)}</p>
      </div>

      ${data.receiptLink ? `
      <div style="text-align: center; margin-top: 20px;">
        <a href="${data.receiptLink}" class="button">Ver Comprobante</a>
      </div>
      ` : ''}

      ${data.qrCodeDataUrl ? `
      <div style="text-align: center; margin-top: 10px;">
        <p style="color: #6b7280; font-size: 14px;">Escanea el QR para ver tu comprobante</p>
        <img src="${data.qrCodeDataUrl}" alt="QR Comprobante" style="width: 160px; height: 160px; border: 1px solid #e5e7eb; border-radius: 8px;" />
      </div>
      ` : ''}

      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/pedidos" class="button">Ver Detalles del Pedido</a>
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Si tienes alguna pregunta, contáctanos a través de nuestro 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/contacto" style="color: #2563eb;">centro de atención</a>.
      </p>
    </div>
  `;

  return baseTemplate(content);
}

// Template para bienvenida (útil para registro)
export function welcomeEmailTemplate(clientName: string): string {
  const content = `
    <div class="header">
      <div class="logo">🎮 Palacio Gamer</div>
      <p style="color: #6b7280; margin: 0;">Tu tienda de tecnología favorita</p>
    </div>
    
    <div class="content">
      <h2 style="color: #2563eb; margin-top: 0;">¡Bienvenido a Palacio Gamer, ${clientName}!</h2>
      
      <p>Nos complace darte la bienvenida a nuestra tienda. Tu cuenta ha sido creada exitosamente.</p>
      
      <p>Ahora puedes disfrutar de:</p>
      
      <ul style="line-height: 2;">
        <li>✅ Explorar nuestro catálogo completo de productos</li>
        <li>✅ Realizar compras de forma segura</li>
        <li>✅ Rastrear tus pedidos en tiempo real</li>
        <li>✅ Acceder a ofertas exclusivas</li>
        <li>✅ Gestionar tu perfil y direcciones</li>
      </ul>
      
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0; color: #1e40af;"><strong>💡 Consejo:</strong> Completa tu perfil con tus datos para agilizar tus futuras compras.</p>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/catalogo" class="button">Comenzar a Comprar</a>
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Si tienes alguna pregunta, nuestro equipo de atención al cliente está listo para ayudarte.
        Puedes contactarnos a través de nuestro <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/contacto" style="color: #2563eb;">centro de atención</a>.
      </p>
    </div>
  `;

  return baseTemplate(content);
}

// Template para confirmación de actualización de perfil
export function profileUpdateTemplate(clientName: string, updatedFields: string[]): string {
  const fieldsList = updatedFields.length > 0 
    ? updatedFields.map(field => `<li>${field}</li>`).join('')
    : '<li>Información de tu cuenta</li>';

  const content = `
    <div class="header">
      <div class="logo">🎮 Palacio Gamer</div>
    </div>
    
    <div class="content">
      <h2 style="color: #2563eb; margin-top: 0;">✅ Perfil Actualizado</h2>
      
      <p>Hola ${clientName},</p>
      
      <p>Te confirmamos que tu perfil ha sido actualizado exitosamente.</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0; color: #1f2937;">Campos Actualizados:</h3>
        <ul style="line-height: 2;">
          ${fieldsList}
        </ul>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">
          <strong>🔒 Seguridad:</strong> Si no realizaste este cambio, por favor contacta a nuestro equipo de soporte inmediatamente.
        </p>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/perfil" class="button">Ver Mi Perfil</a>
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Si tienes alguna pregunta sobre esta actualización, contáctanos a través de nuestro 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/contacto" style="color: #2563eb;">centro de atención</a>.
      </p>
    </div>
  `;

  return baseTemplate(content);
}

export function passwordResetTemplate(clientName: string, resetLink: string): string {
  const content = `
    <div class="header">
      <div class="logo">🎮 Palacio Gamer</div>
    </div>
    <div class="content">
      <h2 style="color: #2563eb; margin-top: 0;">Restablece tu contraseña</h2>
      <p>Hola ${clientName},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic en el botón para crear una nueva contraseña.</p>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${resetLink}" class="button">Restablecer contraseña</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje y tu contraseña seguirá siendo la misma.</p>
    </div>
  `;
  return baseTemplate(content);
}

export function supportTicketCreatedTemplate(clientName: string, ticketCode: string, subject: string): string {
  const content = `
    <div class="header">
      <div class="logo">🎮 Palacio Gamer</div>
    </div>
    <div class="content">
      <h2 style="color: #2563eb; margin-top: 0;">Ticket de soporte creado</h2>
      <p>Hola ${clientName},</p>
      <p>Tu ticket <strong>${ticketCode}</strong> ha sido registrado con el asunto: <strong>${subject}</strong>.</p>
      <p>Nuestro equipo te contactará pronto.</p>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/soporte-tecnico" class="button">Ver mis tickets</a>
      </p>
    </div>
  `;
  return baseTemplate(content);
}

export function supportTicketUpdatedTemplate(clientName: string, ticketCode: string, status: string): string {
  const content = `
    <div class="header">
      <div class="logo">🎮 Palacio Gamer</div>
    </div>
    <div class="content">
      <h2 style="color: #2563eb; margin-top: 0;">Actualización de ticket</h2>
      <p>Hola ${clientName},</p>
      <p>Tu ticket <strong>${ticketCode}</strong> ahora está en estado <strong>${status}</strong>.</p>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://palaciogamer.com'}/soporte-tecnico" class="button">Ver detalles</a>
      </p>
    </div>
  `;
  return baseTemplate(content);
}
