/**
 * RUTA DE SEED — PROTEGIDA
 *
 * Solo accesible en modo development con la variable ENABLE_SEED_ROUTES=true.
 * NUNCA debe estar habilitada en producción.
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Role from '@/models/Role';
import Department from '@/models/Department';
import { sampleRoles } from '@/utils/seedData';

function isSeedAllowed(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_SEED_ROUTES === 'true'
  );
}

export async function POST() {
  if (!isSeedAllowed()) {
    return NextResponse.json(
      { success: false, message: 'Ruta de seed deshabilitada. Solo disponible en development con ENABLE_SEED_ROUTES=true' },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    const existingAdmin = await Employee.findOne({ employeeId: 'ADMIN001' });
    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'El usuario administrador por defecto ya existe',
      });
    }

    let adminRole = await Role.findOne({ name: 'administrador' });
    if (!adminRole) {
      const adminRoleData = sampleRoles.find(r => r.name === 'administrador');
      if (adminRoleData) {
        adminRole = new Role(adminRoleData);
        await adminRole.save();
      }
    }

    let adminDepartment = await Department.findOne({ name: 'Administración' });
    if (!adminDepartment) {
      adminDepartment = new Department({
        name: 'Administración',
        description: 'Departamento de administración general',
        manager: 'ADMIN001',
        budget: 100000,
        location: 'Edificio Principal - Piso 1',
        isActive: true,
      });
      await adminDepartment.save();
    }

    const defaultAdmin = new Employee({
      employeeId: 'ADMIN001',
      password: 'Admin123!', // Contraseña más segura
      name: 'Administrador Principal',
      email: 'admin@palaciogamer.com',
      role: adminRole?._id,
      department: adminDepartment._id,
      isActive: true,
    });

    await defaultAdmin.save();

    return NextResponse.json({
      success: true,
      message: 'Usuario administrador creado. Cambia la contraseña inmediatamente.',
      employee: {
        employeeId: defaultAdmin.employeeId,
        name: defaultAdmin.name,
      },
    });
  } catch (error) {
    console.error('Error en seed:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!isSeedAllowed()) {
    return NextResponse.json(
      { success: false, message: 'Ruta deshabilitada' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const existingAdmin = await Employee.findOne({ employeeId: 'ADMIN001' });
    return NextResponse.json({ exists: !!existingAdmin });
  } catch {
    return NextResponse.json({ success: false, message: 'Error' }, { status: 500 });
  }
}