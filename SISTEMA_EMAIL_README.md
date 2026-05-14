# 📧 Sistema de Email - Palacio Gamer

## ✅ Implementación Completada

El sistema de email ha sido implementado exitosamente para enviar confirmaciones automáticas de compra y actualizaciones de estado de pedidos.

---

## 🎯 Funcionalidades Implementadas

### 1. **Confirmación de Compra Inicial**
- Se envía automáticamente cuando un cliente realiza una compra
- Incluye:
  - Número de pedido
  - Detalles de productos
  - Total y método de pago
  - Estado del pedido
  - Dirección de envío (si aplica)

### 2. **Actualización de Estado de Pedido**
- Se envía cuando:
  - El pago es confirmado por el administrador
  - El pedido es cancelado
- Incluye información actualizada del estado

### 3. **Templates HTML Profesionales**
- Diseño responsive y moderno
- Compatible con la mayoría de clientes de email
- Incluye estilos inline para mejor compatibilidad

---

## 📁 Archivos Creados

### `src/lib/email.ts`
Servicio principal para envío de emails usando Nodemailer.

**Características:**
- Soporte para SMTP estándar (Gmail, Outlook, etc.)
- Modo desarrollo con Ethereal Email (emails de prueba)
- Manejo de errores robusto
- No bloquea la operación principal si el email falla

### `src/lib/email-templates.ts`
Templates HTML para diferentes tipos de emails.

**Templates disponibles:**
- `orderConfirmationTemplate()` - Confirmación inicial de compra
- `orderStatusUpdateTemplate()` - Actualización de estado
- `welcomeEmailTemplate()` - Email de bienvenida (preparado para futuro uso)

---

## ⚙️ Configuración

### Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion
SMTP_FROM=tu-email@gmail.com
SMTP_FROM_NAME=Palacio Gamer

# URL de la aplicación (para links en emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Configuración para Gmail

1. **Habilita la verificación en 2 pasos** en tu cuenta de Google
2. **Genera una "Contraseña de aplicación"**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Ingresa "Palacio Gamer" como nombre
   - Copia la contraseña generada
3. **Usa la contraseña generada** en `SMTP_PASS`

### Configuración para Desarrollo (Ethereal Email)

Para pruebas sin configurar SMTP real:

1. Visita https://ethereal.email
2. Genera credenciales temporales
3. Usa estas variables en `.env.local`:

```env
ETHEREAL_USER=ethereal.user@ethereal.email
ETHEREAL_PASS=ethereal.pass
```

Los emails se enviarán a una cuenta temporal de Ethereal que puedes verificar en su sitio web.

---

## 🔌 Integración

### Puntos de Integración Actuales

1. **Checkout de Cliente** (`/api/auth/client/checkout`)
   - Envía email de confirmación al crear una venta
   - Se ejecuta de forma asíncrona (no bloquea la respuesta)

2. **Confirmación de Pago** (`/api/admin/sales/[id]/confirm-payment`)
   - Envía email cuando se confirma un pago
   - Envía email cuando se rechaza un pago

### Cómo Funciona

```typescript
// Ejemplo de uso en cualquier API route
import { sendEmail } from '@/lib/email';
import { orderConfirmationTemplate } from '@/lib/email-templates';

// Preparar datos
const emailData = {
  orderNumber: 'SALE-1234567890',
  clientName: 'Juan Pérez',
  clientEmail: 'juan@example.com',
  // ... más datos
};

// Enviar email (no bloquea si falla)
try {
  await sendEmail({
    to: emailData.clientEmail,
    subject: `Confirmación de Pedido #${emailData.orderNumber}`,
    html: orderConfirmationTemplate(emailData)
  });
} catch (error) {
  console.error('Error enviando email:', error);
  // No fallar la operación principal
}
```

---

## 📧 Tipos de Email

### 1. Confirmación de Compra
**Cuándo se envía:** Al crear una nueva venta desde el checkout

**Contenido:**
- Saludo personalizado
- Número de pedido
- Lista de productos
- Totales (subtotal, IGV, total)
- Método de pago
- Estado del pedido
- Dirección de envío
- Botón para ver pedidos

### 2. Actualización de Estado
**Cuándo se envía:** Al cambiar el estado de un pedido (confirmado, pagado, cancelado)

**Contenido:**
- Nuevo estado del pedido
- Mensaje según el estado
- Detalles del pedido
- Botón para ver detalles

---

## 🧪 Testing

### Verificar Conexión SMTP

Puedes crear un endpoint de prueba para verificar la configuración:

```typescript
// src/app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { verifyEmailConnection, sendEmail } from '@/lib/email';

export async function GET() {
  const isConnected = await verifyEmailConnection();
  
  if (!isConnected) {
    return NextResponse.json({ 
      success: false, 
      message: 'No se pudo conectar al servidor SMTP' 
    });
  }

  // Enviar email de prueba
  const result = await sendEmail({
    to: 'test@example.com',
    subject: 'Email de Prueba',
    html: '<h1>Este es un email de prueba</h1>'
  });

  return NextResponse.json(result);
}
```

### Probar en Desarrollo

1. Usa Ethereal Email para pruebas sin configurar SMTP real
2. Los emails se generan pero no se envían realmente
3. Puedes ver los emails en https://ethereal.email

---

## 🚀 Próximos Pasos (Opcional)

### Funcionalidades Adicionales Sugeridas

1. **Email de Bienvenida**
   - Enviar al registrar un nuevo cliente
   - Template ya está preparado en `welcomeEmailTemplate()`

2. **Recuperación de Contraseña**
   - Enviar token de reset por email
   - Template personalizado para reset

3. **Notificaciones de Stock**
   - Notificar cuando un producto vuelve a estar disponible
   - Notificar productos en oferta

4. **Newsletter**
   - Sistema de suscripción
   - Envío masivo de promociones

---

## 📝 Notas Importantes

1. **No Bloquea Operaciones**: El envío de emails es asíncrono y no bloquea las operaciones principales. Si falla, solo se registra en los logs.

2. **Manejo de Errores**: Todos los envíos de email están envueltos en try-catch para evitar que errores de email afecten la funcionalidad principal.

3. **Variables de Entorno**: Nunca commitees el archivo `.env.local` con credenciales reales. Usa `.env.example` como plantilla.

4. **Producción**: En producción, considera usar servicios especializados como:
   - SendGrid
   - Mailgun
   - AWS SES
   - Resend

---

## 🔧 Solución de Problemas

### Error: "Invalid login"
- Verifica que `SMTP_USER` y `SMTP_PASS` sean correctos
- Para Gmail, asegúrate de usar una "Contraseña de aplicación"

### Error: "Connection timeout"
- Verifica que `SMTP_HOST` y `SMTP_PORT` sean correctos
- Verifica tu conexión a internet
- Algunos proveedores bloquean conexiones desde ciertos IPs

### Emails no se envían pero no hay error
- Verifica los logs de la consola
- Revisa la carpeta de spam del destinatario
- Usa Ethereal Email para verificar que la configuración funciona

---

**Última actualización**: $(date)
**Estado**: ✅ Implementación Completa

