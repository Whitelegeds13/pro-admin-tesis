/**
 * Product Service — Lógica de negocio de productos.
 */
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import type { ProductQueryInput } from '@/core/dtos/product.dto';
import { NotFoundError } from '@/core/errors/app-error';

/**
 * Obtener productos con paginación, filtros y ordenamiento.
 */
export async function getProducts(query: ProductQueryInput) {
  await connectDB();

  const { page, limit, search, category, brand, minPrice, maxPrice, isActive, sortBy, sortOrder } = query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (typeof isActive === 'boolean') filter.isActive = isActive;
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

/**
 * Obtener un producto por ID.
 */
export async function getProductById(id: string) {
  await connectDB();

  const product = await Product.findById(id)
    .populate('category', 'name')
    .populate('brand', 'name')
    .lean();

  if (!product) {
    throw new NotFoundError('Producto');
  }

  return product;
}

/**
 * Obtener productos para el contexto del chatbot.
 * Retorna solo los campos necesarios para reducir tokens.
 */
export async function getProductsForChat(options?: {
  categoryFilter?: string;
  limit?: number;
  search?: string;
}) {
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { isActive: true };

  if (options?.categoryFilter) {
    filter.category = options.categoryFilter;
  }

  if (options?.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { tags: { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } },
    ];
  }

  const products = await Product.find(filter)
    .populate({ path: 'category', select: 'name' })
    .populate({ path: 'brand', select: 'name' })
    .select('name price description category brand tags specifications')
    .limit(options?.limit || 30)
    .lean();

  return products;
}

/**
 * Obtener categorías únicas con productos activos.
 */
export async function getActiveCategories() {
  await connectDB();

  const categories = await Product.distinct('category', { isActive: true });
  return categories;
}
