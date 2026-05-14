# 📊 Análisis de Casos de Uso - Palacio Gamer

## 🎯 Resumen Ejecutivo

Este documento mapea los casos de uso del diagrama UML con el estado actual de implementación del sistema.

---

## ✅ CASOS DE USO IMPLEMENTADOS

### 🔴 **Prioridad Alta (Rojo)**

#### **AS_Cliente (Cliente)**

| Caso de Uso | Estado | Implementación | Notas |
|------------|--------|----------------|-------|
| **CUS01_Registro de usuario** | ✅ **COMPLETO** | `/api/auth/client/register`<br>`/registro` | Registro completo con validación |
| **CUS02_Inicio de sesion** | ✅ **COMPLETO** | `/api/auth/client/login`<br>`/login` | Login funcional para clientes |
| **CUS08_Buscar y filtrar producto** | ✅ **COMPLETO** | `/catalogo` | Búsqueda avanzada con filtros |
| **CUS09_Agregar producto al carrito** | ✅ **COMPLETO** | `CartContext`<br>`/catalogo` | Carrito funcional con persistencia |
| **CUS10_Realizar compra en línea** | ✅ **COMPLETO** | `/api/auth/client/checkout`<br>`/checkout` | Proceso completo de compra |
| **CUS12_Procesar pago en pasarela** | ⚠️ **PARCIAL** | Checkout implementado | Falta integración real con pasarela (Culqi, Stripe, etc.) |

#### **AS_Administrador**

| Caso de Uso | Estado | Implementación | Notas |
|------------|--------|----------------|-------|
| **CUS02_Inicio de sesion** | ✅ **COMPLETO** | `/api/auth/admin/login`<br>`/admin/login` | Login para empleados/admin |
| **CUS05_Registrar nuevo producto** | ✅ **COMPLETO** | `/api/admin/products`<br>`/admin/products` | CRUD completo de productos |

#### **AS_Sistema**

| Caso de Uso | Estado | Implementación | Notas |
|------------|--------|----------------|-------|
| **CUS07_Generar alerta de stock bajo** | ✅ **COMPLETO** | `/api/admin/inventory/alerts` | Alertas de stock implementadas |

---

## ⚠️ CASOS DE USO PARCIALMENTE IMPLEMENTADOS

### 🟡 **Prioridad Media (Amarillo)**

| Caso de Uso | Estado | Implementación Actual | Lo que Falta |
|------------|--------|----------------------|--------------|
| **CUS06_Actualizar stock de producto** | ⚠️ **PARCIAL** | Actualización manual en productos<br>Movimientos de inventario | Automatización completa<br>Historial detallado |
| **CUS19_Generar reporte de ventas** | ⚠️ **PARCIAL** | `/api/admin/reports/sales`<br>`/admin/reports` | Exportación PDF/Excel<br>Grafos avanzados |
| **CUS20_Generar reporte de inventario y soporte** | ⚠️ **PARCIAL** | Reportes básicos de inventario | Reporte de soporte<br>Reportes combinados |
| **CUS15_Emitir comprobante de pago** | ⚠️ **PARCIAL** | Modelo Sale con receiptNumber | Generación PDF<br>Visualización de comprobante |

---

## ❌ CASOS DE USO NO IMPLEMENTADOS

### 🟡 **Prioridad Media (Amarillo)**

| Caso de Uso | Actor | Descripción | Prioridad de Implementación |
|------------|-------|-------------|----------------------------|
| **CUS03_Gestion de roles de usuario** | Administrador | Gestión de roles y permisos | 🔴 **ALTA** - Base del sistema |
| **CUS04_Recuperacion de contraseña** | Cliente | Reset de contraseña por email | 🟡 **MEDIA** - Importante para UX |
| **CUS11_Generar proforma o cotización** | Cliente | Sistema de cotizaciones | 🟡 **MEDIA** - Funcionalidad B2B |
| **CUS16_Registrar ticket de soporte** | Cliente | Sistema de tickets de soporte | 🟡 **MEDIA** - Mejora servicio |

### 🔴 **Prioridad Alta (Rojo)**

| Caso de Uso | Actor | Descripción | Prioridad de Implementación |
|------------|-------|-------------|----------------------------|
| **CUS13_Confirmación de compra via correo** | Sistema | Envío de email de confirmación | 🔴 **ALTA** - Crítico para e-commerce |
| **CUS14_Validar estado de transacción** | Sistema/Pasarela | Validación automática de pagos | 🔴 **ALTA** - Integración pasarela |

### 🟢 **Prioridad Baja (Verde)**

| Caso de Uso | Actor | Descripción | Prioridad de Implementación |
|------------|-------|-------------|----------------------------|
| **CUS17_Actualizar estado de ticket** | Técnico | Gestión de tickets de soporte | 🟢 **BAJA** - Requiere CUS16 primero |
| **CUS18_Enviar notificación de soporte** | Sistema | Notificaciones de tickets | 🟢 **BAJA** - Requiere CUS16 primero |

---

## 📋 MATRIZ DE ESTADO COMPLETO

### **AS_Cliente (9 casos de uso)**

| ID | Caso de Uso | Prioridad | Estado | % Completado |
|---|-------------|-----------|--------|--------------|
| CUS01 | Registro de usuario | 🔴 Alta | ✅ Completo | 100% |
| CUS02 | Inicio de sesion | 🔴 Alta | ✅ Completo | 100% |
| CUS04 | Recuperacion de contraseña | 🟡 Media | ❌ No implementado | 0% |
| CUS08 | Buscar y filtrar producto | 🔴 Alta | ✅ Completo | 100% |
| CUS09 | Agregar producto al carrito | 🔴 Alta | ✅ Completo | 100% |
| CUS10 | Realizar compra en línea | 🔴 Alta | ✅ Completo | 100% |
| CUS11 | Generar proforma o cotización | 🟡 Media | ❌ No implementado | 0% |
| CUS12 | Procesar pago en pasarela | 🔴 Alta | ⚠️ Parcial | 60% |
| CUS16 | Registrar ticket de soporte | 🟡 Media | ❌ No implementado | 0% |

**Total Cliente: 6/9 completos (67%)**

### **AS_Técnico (2 casos de uso)**

| ID | Caso de Uso | Prioridad | Estado | % Completado |
|---|-------------|-----------|--------|--------------|
| CUS02 | Inicio de sesion | 🔴 Alta | ✅ Completo | 100% |
| CUS17 | Actualizar estado de ticket | 🟢 Baja | ❌ No implementado | 0% |

**Total Técnico: 1/2 completos (50%)**

### **AS_Administrador (6 casos de uso)**

| ID | Caso de Uso | Prioridad | Estado | % Completado |
|---|-------------|-----------|--------|--------------|
| CUS02 | Inicio de sesion | 🔴 Alta | ✅ Completo | 100% |
| CUS03 | Gestion de roles de usuario | 🟡 Media | ⚠️ Parcial | 40% |
| CUS05 | Registrar nuevo producto | 🔴 Alta | ✅ Completo | 100% |
| CUS06 | Actualizar stock de producto | 🟡 Media | ⚠️ Parcial | 70% |
| CUS19 | Generar reporte de ventas | 🟡 Media | ⚠️ Parcial | 60% |
| CUS20 | Generar reporte de inventario y soporte | 🟡 Media | ⚠️ Parcial | 50% |

**Total Administrador: 1/6 completos, 4 parciales (33% completo, 67% con funcionalidad básica)**

### **AS_Pasarela de pago (2 casos de uso)**

| ID | Caso de Uso | Prioridad | Estado | % Completado |
|---|-------------|-----------|--------|--------------|
| CUS12 | Procesar pago en pasarela | 🔴 Alta | ⚠️ Parcial | 40% |
| CUS14 | Validar estado de transacción | 🔴 Alta | ❌ No implementado | 0% |

**Total Pasarela: 0/2 completos (0%)**

### **AS_Sistema (5 casos de uso)**

| ID | Caso de Uso | Prioridad | Estado | % Completado |
|---|-------------|-----------|--------|--------------|
| CUS07 | Generar alerta de stock bajo | 🟢 Baja | ✅ Completo | 100% |
| CUS10 | Realizar compra en línea | 🔴 Alta | ✅ Completo | 100% |
| CUS13 | Confirmación de compra via correo | 🔴 Alta | ❌ No implementado | 0% |
| CUS14 | Validar estado de transacción | 🔴 Alta | ❌ No implementado | 0% |
| CUS15 | Emitir comprobante de pago | 🟡 Media | ⚠️ Parcial | 30% |
| CUS18 | Enviar notificación de soporte | 🟢 Baja | ❌ No implementado | 0% |

**Total Sistema: 2/6 completos (33%)**

---

## 📊 ESTADÍSTICAS GENERALES

### Por Prioridad

| Prioridad | Total | Completos | Parciales | Faltantes | % Completado |
|-----------|-------|-----------|-----------|-----------|--------------|
| 🔴 **Alta** | 12 | 7 | 2 | 3 | **58%** |
| 🟡 **Media** | 6 | 0 | 4 | 2 | **33%** |
| 🟢 **Baja** | 2 | 1 | 0 | 1 | **50%** |
| **TOTAL** | **20** | **8** | **6** | **6** | **40% completo, 70% con funcionalidad básica** |

### Por Actor

| Actor | Total | Completos | Parciales | Faltantes | % Completado |
|-------|-------|-----------|-----------|-----------|--------------|
| Cliente | 9 | 6 | 1 | 2 | **67%** |
| Administrador | 6 | 1 | 4 | 1 | **17% completo, 83% con funcionalidad** |
| Sistema | 6 | 2 | 1 | 3 | **33%** |
| Técnico | 2 | 1 | 0 | 1 | **50%** |
| Pasarela | 2 | 0 | 1 | 1 | **0%** |

---

## 🎯 PLAN DE IMPLEMENTACIÓN PRIORIZADO

### **FASE 1: Funcionalidades Críticas (Alta Prioridad) - 2-3 semanas**

#### 1. **CUS13 - Confirmación de compra via correo** 🔴
- **Estado**: ❌ No implementado
- **Acciones**:
  - Integrar servicio de email (Nodemailer, SendGrid, Resend)
  - Crear templates de email
  - Enviar email al confirmar compra
  - Enviar email al cambiar estado de pedido

#### 2. **CUS14 - Validar estado de transacción** 🔴
- **Estado**: ❌ No implementado
- **Acciones**:
  - Integrar pasarela de pago (Culqi, Stripe, PayPal)
  - Webhooks para validación automática
  - Actualización automática de estado de venta

#### 3. **CUS12 - Procesar pago en pasarela (Completar)** 🔴
- **Estado**: ⚠️ Parcial (60%)
- **Acciones**:
  - Integrar pasarela real
  - Procesar pagos con tarjeta
  - Manejo de errores de pago

#### 4. **CUS15 - Emitir comprobante de pago (Completar)** 🟡
- **Estado**: ⚠️ Parcial (30%)
- **Acciones**:
  - Generar PDF de comprobante
  - Vista previa de comprobante
  - Descarga de comprobante

### **FASE 2: Funcionalidades Importantes (Media Prioridad) - 3-4 semanas**

#### 5. **CUS03 - Gestión de roles de usuario** 🟡
- **Estado**: ⚠️ Parcial (40% - Modelos existen, falta UI completa)
- **Acciones**:
  - Interfaz de gestión de roles
  - Asignación de permisos
  - Validación de permisos en rutas

#### 6. **CUS04 - Recuperación de contraseña** 🟡
- **Estado**: ❌ No implementado
- **Acciones**:
  - Endpoint de solicitud de reset
  - Envío de email con token
  - Página de reset de contraseña
  - Validación de token

#### 7. **CUS11 - Generar proforma o cotización** 🟡
- **Estado**: ❌ No implementado
- **Acciones**:
  - Modelo Quotation
  - Interfaz de cotización
  - Generación de PDF
  - Conversión de cotización a venta

#### 8. **CUS16 - Registrar ticket de soporte** 🟡
- **Estado**: ❌ No implementado
- **Acciones**:
  - Modelo SupportTicket
  - Interfaz de creación de tickets
  - Historial de tickets
  - Notificaciones

### **FASE 3: Funcionalidades Complementarias (Baja Prioridad) - 2-3 semanas**

#### 9. **CUS17 - Actualizar estado de ticket** 🟢
- **Estado**: ❌ No implementado
- **Depende de**: CUS16
- **Acciones**:
  - Panel de técnico
  - Actualización de estados
  - Asignación de tickets

#### 10. **CUS18 - Enviar notificación de soporte** 🟢
- **Estado**: ❌ No implementado
- **Depende de**: CUS16
- **Acciones**:
  - Sistema de notificaciones
  - Emails de actualización
  - Notificaciones en tiempo real

---

## 🔍 DETALLES DE IMPLEMENTACIÓN ACTUAL

### ✅ **Lo que SÍ está implementado:**

1. **Sistema de Autenticación Completo**
   - Login para clientes y empleados
   - Registro de clientes
   - Context API para manejo de estado

2. **E-commerce Básico**
   - Catálogo de productos con búsqueda y filtros
   - Carrito de compras funcional
   - Proceso de checkout completo
   - Gestión de pedidos

3. **Panel Administrativo**
   - Dashboard con estadísticas
   - CRUD de productos, categorías, marcas, proveedores
   - Gestión de clientes (recién implementado)
   - Gestión de ventas y pedidos
   - Control de inventario básico
   - Reportes básicos

4. **Sistema de Inventario**
   - Alertas de stock bajo
   - Movimientos de inventario
   - Ajustes de stock

### ❌ **Lo que NO está implementado:**

1. **Sistema de Email**
   - No hay servicio de email configurado
   - No se envían confirmaciones
   - No hay recuperación de contraseña

2. **Pasarela de Pago Real**
   - Solo se procesan comprobantes de pago
   - No hay integración con Culqi, Stripe, etc.
   - No hay validación automática de transacciones

3. **Sistema de Cotizaciones**
   - No existe modelo ni funcionalidad

4. **Sistema de Tickets de Soporte**
   - Solo existe página informativa
   - No hay gestión de tickets

5. **Generación de Comprobantes PDF**
   - No se generan PDFs
   - Solo se almacenan datos

6. **Gestión Completa de Roles**
   - Modelos existen pero falta UI completa

---

## 🚀 RECOMENDACIONES DE IMPLEMENTACIÓN

### **Orden Sugerido:**

1. **Semana 1-2**: Sistema de Email + Confirmaciones
2. **Semana 3-4**: Integración de Pasarela de Pago
3. **Semana 5-6**: Recuperación de Contraseña + Comprobantes PDF
4. **Semana 7-8**: Sistema de Cotizaciones
5. **Semana 9-10**: Sistema de Tickets de Soporte
6. **Semana 11-12**: Gestión Completa de Roles

---

## 📝 NOTAS ADICIONALES

- El sistema tiene una base sólida con ~70% de funcionalidad básica
- Las funcionalidades críticas faltantes son principalmente de integración (email, pagos)
- El sistema de roles está parcialmente implementado pero necesita completarse
- La mayoría de funcionalidades de cliente están completas
- Las funcionalidades de administrador necesitan mejoras en reportes y exportación

---

**Última actualización**: $(date)
**Versión del sistema**: 0.1.0

