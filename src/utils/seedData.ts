// Datos de ejemplo para poblar la base de datos

export const sampleDepartments = [
  {
    name: "Tecnología",
    description: "Departamento encargado del desarrollo y mantenimiento de sistemas tecnológicos",
    manager: "EMP001",
    budget: 150000,
    location: "Edificio A - Piso 3",
    isActive: true
  },
  {
    name: "Recursos Humanos",
    description: "Gestión del talento humano, reclutamiento y desarrollo organizacional",
    manager: "EMP002",
    budget: 80000,
    location: "Edificio B - Piso 2",
    isActive: true
  },
  {
    name: "Ventas",
    description: "Departamento comercial encargado de las ventas y relaciones con clientes",
    manager: "EMP003",
    budget: 200000,
    location: "Edificio A - Piso 1",
    isActive: true
  },
  {
    name: "Marketing",
    description: "Estrategias de marketing digital y tradicional, branding y comunicaciones",
    manager: "EMP004",
    budget: 120000,
    location: "Edificio B - Piso 3",
    isActive: true
  },
  {
    name: "Finanzas",
    description: "Control financiero, contabilidad y análisis de costos",
    manager: "EMP005",
    budget: 90000,
    location: "Edificio A - Piso 2",
    isActive: true
  },
  {
    name: "Operaciones",
    description: "Gestión de procesos operativos y cadena de suministro",
    manager: "EMP006",
    budget: 180000,
    location: "Edificio C - Piso 1",
    isActive: true
  },
  {
    name: "Soporte Técnico",
    description: "Atención al cliente y soporte técnico especializado",
    manager: "EMP007",
    budget: 70000,
    location: "Edificio A - Piso 4",
    isActive: true
  },
  {
    name: "Investigación y Desarrollo",
    description: "Innovación, investigación de nuevas tecnologías y desarrollo de productos",
    manager: "EMP008",
    budget: 250000,
    location: "Edificio C - Piso 2",
    isActive: true
  }
];

export const sampleRoles = [
  {
    name: "administrador",
    description: "Acceso completo al sistema con todos los permisos administrativos",
    permissions: [
      "read_users",
      "write_users", 
      "delete_users",
      "read_products",
      "write_products",
      "delete_products",
      "read_orders",
      "write_orders",
      "delete_orders",
      "read_reports",
      "write_reports",
      "admin_access"
    ],
    isActive: true
  },
  {
    name: "gerente",
    description: "Permisos de gestión con acceso a reportes y administración de equipos",
    permissions: [
      "read_users",
      "write_users",
      "read_products",
      "write_products",
      "read_orders",
      "write_orders",
      "read_reports",
      "write_reports"
    ],
    isActive: true
  },
  {
    name: "vendedor",
    description: "Acceso a gestión de productos, órdenes y clientes para actividades de venta",
    permissions: [
      "read_users",
      "read_products",
      "write_products",
      "read_orders",
      "write_orders"
    ],
    isActive: true
  },
  {
    name: "analista",
    description: "Acceso de solo lectura para análisis y generación de reportes",
    permissions: [
      "read_users",
      "read_products",
      "read_orders",
      "read_reports"
    ],
    isActive: true
  },
  {
    name: "soporte",
    description: "Permisos para atención al cliente y soporte técnico",
    permissions: [
      "read_users",
      "read_products",
      "read_orders",
      "write_orders"
    ],
    isActive: true
  },
  {
    name: "desarrollador",
    description: "Acceso técnico para desarrollo y mantenimiento de sistemas",
    permissions: [
      "read_users",
      "read_products",
      "write_products",
      "read_orders",
      "admin_access"
    ],
    isActive: true
  },
  {
    name: "marketing",
    description: "Permisos para gestión de productos y análisis de mercado",
    permissions: [
      "read_users",
      "read_products",
      "write_products",
      "read_orders",
      "read_reports"
    ],
    isActive: true
  },
  {
    name: "contador",
    description: "Acceso financiero para gestión contable y reportes financieros",
    permissions: [
      "read_orders",
      "read_reports",
      "write_reports"
    ],
    isActive: true
  }
];