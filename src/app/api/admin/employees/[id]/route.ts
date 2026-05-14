/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Role from '@/models/Role';
import Department from '@/models/Department';

// GET - Obtener empleado por ID
export async function GET(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return NextResponse.json({
        success: false,
        message: 'Empleado no encontrado'
      }, { status: 404 });
    }

    // Obtener rol y departamento por separado
    const role = await Role.findById(employee.role);
    const department = await Department.findById(employee.department);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeEmp = (employee as any).toSafeObject();
    const employeeWithDetails = {
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

    return NextResponse.json({
      success: true,
      employee: employeeWithDetails
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el empleado',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar empleado
export async function PUT(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { employeeId, name, email, role, department, isActive } = body;

    // Verificar que el empleado existe
    const { id } = await context.params;
    const existingEmployee = await Employee.findById(id);
    if (!existingEmployee) {
      return NextResponse.json({
        success: false,
        message: 'Empleado no encontrado'
      }, { status: 404 });
    }

    // Verificar que el rol existe (si se proporciona)
    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return NextResponse.json({
          success: false,
          message: 'El rol especificado no existe'
        }, { status: 400 });
      }
    }

    // Verificar que el departamento existe (si se proporciona)
    if (department) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return NextResponse.json({
          success: false,
          message: 'El departamento especificado no existe'
        }, { status: 400 });
      }
    }

    // Verificar si el nuevo employeeId o email ya existe en otro empleado
    if (employeeId || email) {
      const duplicateEmployee = await Employee.findOne({
        _id: { $ne: id },
        $or: [
          ...(employeeId ? [{ employeeId: employeeId.toUpperCase() }] : []),
          ...(email ? [{ email: email.toLowerCase() }] : [])
        ]
      });

      if (duplicateEmployee) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe otro empleado con ese ID o email'
        }, { status: 400 });
      }
    }

    // Actualizar empleado
    const updateData: { employeeId?: string; name?: string; email?: string; role?: string; department?: string; isActive?: boolean } = {};
    if (employeeId) updateData.employeeId = employeeId.toUpperCase();
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('role', 'name description permissions')
     .populate('department', 'name description location');

    return NextResponse.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      employee: updatedEmployee ? (updatedEmployee as any).toSafeObject() : null
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el empleado'
    }, { status: 500 });
  }
}

// DELETE - Eliminar empleado (soft delete)
export async function DELETE(request: NextRequest, context: any) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({
        success: false,
        message: 'Empleado no encontrado'
      }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    await Employee.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Empleado eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar el empleado'
    }, { status: 500 });
  }
}
