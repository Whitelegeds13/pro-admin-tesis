// User Types
export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin' | 'employee';
  createdAt?: Date;
  updatedAt?: Date;
}

// Product Types
export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  specifications: Record<string, string | number | boolean>;
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  children?: NavItem[];
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}