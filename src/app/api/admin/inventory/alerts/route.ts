import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Brand from '@/models/Brand';
import Category from '@/models/Category';

// GET - Obtener alertas de inventario
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get('alertType') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    // const filters: { isActive: boolean } = { isActive: true };
    let productsRaw = [];

    // Obtener brands y categories una vez
    const brands = await Brand.find({ isActive: true });
    const categories = await Category.find({ isActive: true });

    // Crear mapas para búsqueda rápida
    const brandMap = new Map(brands.map(brand => [brand._id.toString(), brand]));
    const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat]));

    const combineProductData = (product: { toSafeObject: () => { _id: string; name: string; stock: number; minStock: number; brand?: string; category: string } }, alertType?: string) => {
      const safeProduct = product.toSafeObject();
      const brand = brandMap.get(safeProduct.brand?.toString() || '');
      const category = categoryMap.get(safeProduct.category?.toString() || '');

      return {
        ...safeProduct,
        brand: brand ? { _id: brand._id, name: brand.name } : null,
        category: category ? { _id: category._id, name: category.name } : null,
        ...(alertType && { alertType })
      };
    };

    let products = [];

    switch (alertType) {
      case 'lowStock':
        // Productos con stock bajo
        productsRaw = await Product.find({
          $expr: { $lte: ['$stock', '$minStock'] },
          isActive: true
        })
        .sort({ stock: 1 })
        .limit(limit);
        
        products = productsRaw.map(p => combineProductData(p));
        break;

      case 'outOfStock':
        // Productos agotados
        productsRaw = await Product.find({
          stock: 0,
          isActive: true
        })
        .sort({ name: 1 })
        .limit(limit);
        
        products = productsRaw.map(p => combineProductData(p));
        break;

      case 'overStock':
        // Productos con exceso de stock
        productsRaw = await Product.find({
          $expr: { $gte: ['$stock', '$maxStock'] },
          isActive: true
        })
        .sort({ stock: -1 })
        .limit(limit);
        
        products = productsRaw.map(p => combineProductData(p));
        break;

      case 'expiring':
        // Productos próximos a vencer (si implementamos fechas de vencimiento)
        productsRaw = await Product.find({
          isActive: true,
          // Aquí se agregarían filtros de fecha de vencimiento
        })
        .sort({ name: 1 })
        .limit(limit);
        
        products = productsRaw.map(p => combineProductData(p));
        break;

      default:
        // Todas las alertas
        const lowStockProductsRaw = await Product.find({
          $expr: { $lte: ['$stock', '$minStock'] },
          isActive: true
        }).sort({ stock: 1 });

        const outOfStockProductsRaw = await Product.find({
          stock: 0,
          isActive: true
        }).sort({ name: 1 });

        const overStockProductsRaw = await Product.find({
          $expr: { $gte: ['$stock', '$maxStock'] },
          isActive: true
        }).sort({ stock: -1 });

        products = [
          ...lowStockProductsRaw.map(p => combineProductData(p, 'lowStock')),
          ...outOfStockProductsRaw.map(p => combineProductData(p, 'outOfStock')),
          ...overStockProductsRaw.map(p => combineProductData(p, 'overStock'))
        ];
        break;
    }

    // Obtener estadísticas de alertas
    const alertStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          },
          overStockCount: {
            $sum: {
              $cond: [{ $gte: ['$stock', '$maxStock'] }, 1, 0]
            }
          },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          lowStockValue: {
            $sum: {
              $cond: [
                { $lte: ['$stock', '$minStock'] },
                { $multiply: ['$stock', '$price'] },
                0
              ]
            }
          }
        }
      }
    ]);

    // Obtener productos más críticos (stock más bajo)
    const criticalProductsRaw = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true
    })
    .sort({ stock: 1 })
    .limit(10);

    const criticalProducts = criticalProductsRaw.map(p => combineProductData(p));

    return NextResponse.json({
      success: true,
      products,
      stats: alertStats[0] || {
        totalProducts: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        overStockCount: 0,
        totalValue: 0,
        lowStockValue: 0
      },
      criticalProducts
    });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener las alertas de inventario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}