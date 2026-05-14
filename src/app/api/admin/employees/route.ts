import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Role from '@/models/Role';
import Department from '@/models/Department';

// GET - Obtener todos los empleados con sus roles y departamentos
export async function GET() {
  try {
    await connectDB();
    
    // Obtener empleados sin populate primero
    const employees = await Employee.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    // Obtener roles y departamentos por separado
    const roles = await Role.find({ isActive: true });
    const departments = await Department.find({ isActive: true });
    
    // Crear mapas para búsqueda rápida
    const roleMap = new Map(roles.map(role => [role._id.toString(), role]));
    const departmentMap = new Map(departments.map(dept => [dept._id.toString(), dept]));
    
    // Combinar datos manualmente
    const employeesWithDetails = employees.map(emp => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeEmp = (emp as any).toSafeObject();
      const role = roleMap.get(safeEmp.role?.toString() || '');
      const department = departmentMap.get(safeEmp.department?.toString() || '');
      
      return {
        ...safeEmp,
        role: role ? {
          _id: role._id,
          name: role.name,
          description: role.description,
          permissions: role.permissions
        } : null,
        department: department ? {
          _id: department._id,
          name: department.name,
          description: department.description,
          location: department.location
        } : null
      };
    });
    
    return NextResponse.json({
      success: true,
      employees: employeesWithDetails
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los empleados',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear nuevo empleado
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { employeeId, password, name, email, role, department } = body;

    // Validar campos requeridos
    if (!employeeId || !password || !name || !email || !role || !department) {
      return NextResponse.json({
        success: false,
        message: 'Todos los campos son requeridos'
      }, { status: 400 });
    }

    // Verificar si el empleado ya existe
    const existingEmployee = await Employee.findOne({ 
      $or: [
        { employeeId: employeeId.toUpperCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingEmployee) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un empleado con ese ID o email'
      }, { status: 400 });
    }

    // Verificar que el rol existe
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return NextResponse.json({
        success: false,
        message: 'El rol especificado no existe'
      }, { status: 400 });
    }

    // Verificar que el departamento existe
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return NextResponse.json({
        success: false,
        message: 'El departamento especificado no existe'
      }, { status: 400 });
    }

    // Crear nuevo empleado
    const newEmployee = new Employee({
      employeeId: employeeId.toUpperCase(),
      password,
      name,
      email: email.toLowerCase(),
      role,
      department
    });

    await newEmployee.save();

    // Obtener el empleado con las referencias pobladas
    const populatedEmployee = await Employee.findById(newEmployee._id)
      .populate('role', 'name description permissions')
      .populate('department', 'name description location');

    return NextResponse.json({
      success: true,
      message: 'Empleado creado exitosamente',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      employee: populatedEmployee ? (populatedEmployee as any).toSafeObject() : null
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear el empleado'
    }, { status: 500 });
  }
}
