import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Brand from '@/models/Brand';
import Category from '@/models/Category';

// GET - Obtener inventario con estadísticas
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const outOfStock = searchParams.get('outOfStock') === 'true';
    const isActive = searchParams.get('isActive') !== 'false';

    // Construir filtros
    const filters: { isActive?: boolean; name?: { $regex: string; $options: string }; category?: string; brand?: string; $or?: { name?: { $regex: string; $options: string }; code?: { $regex: string; $options: string }; description?: { $regex: string; $options: string } }[]; $expr?: { $lte: string[] }; stock?: number } = {};
    
    if (isActive !== null) {
      filters.isActive = isActive;
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (brand) {
      filters.brand = brand;
    }
    
    if (lowStock) {
      filters.$expr = { $lte: ['$stock', '$minStock'] };
    }
    
    if (outOfStock) {
      filters.stock = 0;
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Obtener productos sin populate
    const products = await Product.find(filters)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Contar total para paginación
    const total = await Product.countDocuments(filters);

    // Obtener brands y categories por separado
    const brands = await Brand.find({ isActive: true });
    const categories = await Category.find({ isActive: true });

    // Crear mapas para búsqueda rápida
    const brandMap = new Map(brands.map(brand => [brand._id.toString(), brand]));
    const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat]));

    // Combinar datos manualmente
    const productsWithDetails = products.map(product => {
      const safeProduct = product.toSafeObject();
      const brand = brandMap.get(safeProduct.brand?.toString() || '');
      const category = categoryMap.get(safeProduct.category?.toString() || '');

      return {
        ...safeProduct,
        brand: brand ? {
          _id: brand._id,
          name: brand.name,
          logo: brand.logo
        } : null,
        category: category ? {
          _id: category._id,
          name: category.name,
          description: category.description
        } : null
      };
    });

    // Obtener estadísticas del inventario
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          lowStockProducts: {
            $sum: {
              $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Obtener productos con stock bajo
    const lowStockProductsRaw = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true
    }).sort({ stock: 1 });

    // Obtener productos agotados
    const outOfStockProductsRaw = await Product.find({
      stock: 0,
      isActive: true
    }).sort({ name: 1 });

    // Combinar datos para productos con stock bajo
    const lowStockProducts = lowStockProductsRaw.map(product => {
      const safeProduct = product.toSafeObject();
      const brand = brandMap.get(safeProduct.brand?.toString() || '');
      const category = categoryMap.get(safeProduct.category?.toString() || '');

      return {
        ...safeProduct,
        brand: brand ? { _id: brand._id, name: brand.name } : null,
        category: category ? { _id: category._id, name: category.name } : null
      };
    });

    // Combinar datos para productos agotados
    const outOfStockProducts = outOfStockProductsRaw.map(product => {
      const safeProduct = product.toSafeObject();
      const brand = brandMap.get(safeProduct.brand?.toString() || '');
      const category = categoryMap.get(safeProduct.category?.toString() || '');

      return {
        ...safeProduct,
        brand: brand ? { _id: brand._id, name: brand.name } : null,
        category: category ? { _id: category._id, name: category.name } : null
      };
    });

    return NextResponse.json({
      success: true,
      products: productsWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0
      },
      lowStockProducts,
      outOfStockProducts
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el inventario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
