/**
 * Errores personalizados para manejo centralizado.
 * Cada error tiene un statusCode HTTP y un código de error interno.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Recurso ya existe') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes. Intenta de nuevo más tarde.') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class InternalError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}

/**
 * Formatea un AppError para respuesta JSON segura (no expone detalles internos).
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      message: error.message,
      code: error.code,
    };

    if (error instanceof ValidationError && Object.keys(error.errors).length > 0) {
      response.errors = error.errors;
    }

    return {
      body: response,
      status: error.statusCode,
    };
  }

  // Error no operacional — no exponer detalles
  console.error('❌ Error no controlado:', error);
  return {
    body: {
      success: false,
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    },
    status: 500,
  };
}
