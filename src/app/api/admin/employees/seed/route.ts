import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import Role from '@/models/Role';
import Department from '@/models/Department';

export async function POST() {
  try {
    await connectDB();

    // Limpiar caché del modelo Employee para forzar la recarga
    if (mongoose.models.Employee) {
      delete mongoose.models.Employee;
    }

    // Definir el esquema Employee directamente aquí para evitar problemas de caché
    const EmployeeSchema = new Schema({
      employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        uppercase: true
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
      },
      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
      },
      role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'Role is required']
      },
      department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }, {
      timestamps: true
    });

    // Pre-save middleware to hash password
    EmployeeSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      
      try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password as string, salt);
        next();
      } catch (error) {
        next(error as Error);
      }
    });

    // Method to get safe employee data (without password)
    EmployeeSchema.methods.toSafeObject = function() {
      const employee = this.toObject();
      delete employee.password;
      return employee;
    };

    // Crear el modelo Employee con el esquema actualizado
    const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

    // Obtener roles y departamentos existentes
    const roles = await Role.find({ isActive: true });
    const departments = await Department.find({ isActive: true });

    console.log('Roles encontrados:', roles.map(r => ({ name: r.name, _id: r._id })));
    console.log('Departamentos encontrados:', departments.map(d => ({ name: d.name, _id: d._id })));

    if (roles.length === 0 || departments.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Primero debe crear roles y departamentos'
      }, { status: 400 });
    }

    // Datos de ejemplo de empleados
    const sampleEmployees = [
      {
        employeeId: 'EMP001',
        password: 'password123',
        name: 'Juan Pérez',
        email: 'juan.perez@techstore.com',
        role: roles.find(r => r.name === 'gerente')?._id || roles[0]._id,
        department: departments.find(d => d.name === 'Ventas')?._id || departments[0]._id,
        isActive: true
      },
      {
        employeeId: 'EMP002',
        password: 'password123',
        name: 'María García',
        email: 'maria.garcia@techstore.com',
        role: roles.find(r => r.name === 'vendedor')?._id || roles[0]._id,
        department: departments.find(d => d.name === 'Ventas')?._id || departments[0]._id,
        isActive: true
      },
      {
        employeeId: 'EMP003',
        password: 'password123',
        name: 'Carlos López',
        email: 'carlos.lopez@techstore.com',
        role: roles.find(r => r.name === 'desarrollador')?._id || roles[0]._id,
        department: departments.find(d => d.name === 'Tecnología')?._id || departments[0]._id,
        isActive: true
      },
      {
        employeeId: 'EMP004',
        password: 'password123',
        name: 'Ana Martínez',
        email: 'ana.martinez@techstore.com',
        role: roles.find(r => r.name === 'analista')?._id || roles[0]._id,
        department: departments.find(d => d.name === 'Finanzas')?._id || departments[0]._id,
        isActive: true
      },
      {
        employeeId: 'EMP005',
        password: 'password123',
        name: 'Luis Rodríguez',
        email: 'luis.rodriguez@techstore.com',
        role: roles.find(r => r.name === 'soporte')?._id || roles[0]._id,
        department: departments.find(d => d.name === 'Soporte Técnico')?._id || departments[0]._id,
        isActive: true
      },
      {
        employeeId: 'EMP006',
        password: 'password123',
        name: 'Sofia Herrera',
        email: 'sofia.herrera@techstore.com',
        role: roles.find(r => r.name === 'marketing')?._id || roles[0]._id,
        department: departments.find(d => d.name === 'Marketing')?._id || departments[0]._id,
        isActive: true
      },
      {
        employeeId: 'EMP007',
        password: 'password123',
        name: 'Diego Torres',
        email: 'diego.torres@techstore.com',
        role: roles.find(r => r.name === 'contador')?._id || roles[0]._id,
        department: departments.find(d => d.name === 'Finanzas')?._id || departments[0]._id,
        isActive: true
      },
      {
        employeeId: 'EMP008',
        password: 'password123',
        name: 'Laura Jiménez',
        email: 'laura.jimenez@techstore.com',
        role: roles.find(r => r.name === 'desarrollador')?._id || roles[0]._id,
        department: departments.find(d => d.name === 'Investigación y Desarrollo')?._id || departments[0]._id,
        isActive: true
      }
    ];

    // Verificar si ya existen empleados de ejemplo
    const existingEmployees = await Employee.find({ 
      employeeId: { $in: sampleEmployees.map(emp => emp.employeeId) }
    });

    if (existingEmployees.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Algunos empleados de ejemplo ya existen',
        existing: existingEmployees.map(emp => emp.employeeId)
      }, { status: 400 });
    }

    // Crear empleados de ejemplo usando la colección directamente para evitar problemas de caché
    const createdEmployees = [];
    for (const employeeData of sampleEmployees) {
      console.log('Creando empleado:', {
        employeeId: employeeData.employeeId,
        name: employeeData.name,
        role: employeeData.role,
        department: employeeData.department
      });
      
      // Encriptar contraseña
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(employeeData.password, salt);
      
      const employeeDoc = {
        ...employeeData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await mongoose.connection.db!.collection('employees').insertOne(employeeDoc);
      
      createdEmployees.push({
        employeeId: employeeData.employeeId,
        name: employeeData.name,
        email: employeeData.email
      });
    }

    return NextResponse.json({
      success: true,
      message: `${createdEmployees.length} empleados de ejemplo creados exitosamente`,
      employees: createdEmployees
    });

  } catch (error) {
    console.error('Error creating sample employees:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear empleados de ejemplo'
    }, { status: 500 });
  }
}
