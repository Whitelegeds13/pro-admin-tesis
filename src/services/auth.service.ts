/**
 * Auth Service — Lógica de negocio de autenticación.
 *
 * Centraliza toda la lógica de login, registro, JWT y validación
 * separándola de las API routes.
 */
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import Employee from '@/models/Employee';
import { generateTokenPair, verifyRefreshToken, type TokenPair } from '@/infrastructure/security/jwt';
import { ROLES, type RoleType } from '@/core/constants/roles';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app-error';
import type { ClientLoginInput, ClientRegisterInput, AdminLoginInput } from '@/core/dtos/auth.dto';

// ─── Tipos ───────────────────────────────────────────────────

export interface AuthResult {
  user: Record<string, unknown>;
  tokens: TokenPair;
  role: RoleType;
}

// ─── Client Auth ─────────────────────────────────────────────

/**
 * Autenticar un cliente y generar tokens JWT.
 */
export async function loginClient(input: ClientLoginInput): Promise<AuthResult> {
  await connectDB();

  const client = await Client.findOne({ email: input.email }).select('+password');

  if (!client) {
    throw new AuthenticationError('Credenciales inválidas');
  }

  if (!client.isActive) {
    throw new AuthenticationError('Tu cuenta ha sido desactivada. Contacta con soporte.');
  }

  const isPasswordValid = await client.comparePassword(input.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Credenciales inválidas');
  }

  const clientData = client.toSafeObject();
  const tokens = await generateTokenPair({
    sub: clientData._id.toString(),
    email: clientData.email,
    name: clientData.name,
    role: ROLES.CLIENT,
  });

  return {
    user: clientData,
    tokens,
    role: ROLES.CLIENT,
  };
}

/**
 * Registrar un nuevo cliente y generar tokens JWT.
 */
export async function registerClient(input: ClientRegisterInput): Promise<AuthResult> {
  await connectDB();

  // Verificar email duplicado
  const existingEmail = await Client.findOne({ email: input.email });
  if (existingEmail) {
    throw new ConflictError('Ya existe una cuenta con este email');
  }

  // Verificar documento duplicado
  const existingDoc = await Client.findOne({ documentNumber: input.documentNumber });
  if (existingDoc) {
    throw new ConflictError('Ya existe una cuenta con este número de documento');
  }

  const client = new Client(input);
  await client.save();

  const clientData = client.toSafeObject();
  const tokens = await generateTokenPair({
    sub: clientData._id.toString(),
    email: clientData.email,
    name: clientData.name,
    role: ROLES.CLIENT,
  });

  return {
    user: clientData,
    tokens,
    role: ROLES.CLIENT,
  };
}

// ─── Admin/Employee Auth ─────────────────────────────────────

/**
 * Autenticar un empleado/admin y generar tokens JWT.
 */
export async function loginAdmin(input: AdminLoginInput): Promise<AuthResult> {
  await connectDB();

  const employee = await Employee.findOne({
    employeeId: input.employeeId,
    isActive: true,
  });

  if (!employee) {
    throw new AuthenticationError('Credenciales inválidas');
  }

  // Verificar contraseña usando bcrypt
  const bcrypt = await import('bcryptjs');
  const isPasswordValid = await bcrypt.compare(input.password, employee.password);

  if (!isPasswordValid) {
    throw new AuthenticationError('Credenciales inválidas');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeEmployee = (employee as any).toSafeObject();

  // Determinar rol basado en el rol del empleado
  const role: RoleType = ROLES.ADMIN; // Por ahora todos son admin

  const tokens = await generateTokenPair({
    sub: safeEmployee._id.toString(),
    email: safeEmployee.email,
    name: safeEmployee.name,
    role,
  });

  return {
    user: {
      id: safeEmployee._id,
      employeeId: safeEmployee.employeeId,
      name: safeEmployee.name,
      email: safeEmployee.email,
      role: 'Administrador',
      department: 'Administración',
    },
    tokens,
    role,
  };
}

// ─── Token Refresh ───────────────────────────────────────────

/**
 * Generar nuevos tokens usando un refresh token válido.
 */
export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const payload = await verifyRefreshToken(refreshToken);

  // Verificar que el usuario aún existe y está activo
  await connectDB();

  if (payload.role === ROLES.CLIENT) {
    const client = await Client.findById(payload.sub);
    if (!client || !client.isActive) {
      throw new AuthenticationError('Sesión inválida');
    }
  } else {
    const employee = await Employee.findById(payload.sub);
    if (!employee || !employee.isActive) {
      throw new AuthenticationError('Sesión inválida');
    }
  }

  return generateTokenPair({
    sub: payload.sub!,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  });
}

// ─── Obtener Perfil ──────────────────────────────────────────

/**
 * Obtener datos del cliente autenticado.
 */
export async function getClientProfile(clientId: string) {
  await connectDB();

  const client = await Client.findById(clientId);
  if (!client || !client.isActive) {
    throw new NotFoundError('Cliente');
  }

  return client.toSafeObject();
}
