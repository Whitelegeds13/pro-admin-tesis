import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Brand from '@/models/Brand';
import Category from '@/models/Category';

// GET - Obtener todos los productos con sus marcas y categorías
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const isActive = searchParams.get('isActive') !== 'false';

    // Construir filtros
    const filters: { isActive?: boolean; name?: { $regex: string; $options: string }; brand?: string; category?: string; price?: { $gte?: number; $lte?: number }; $or?: { name?: { $regex: string; $options: string }; code?: { $regex: string; $options: string }; description?: { $regex: string; $options: string }; tags?: { $in: RegExp[] } }[] } = {};
    
    if (isActive !== null) {
      filters.isActive = isActive;
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (brand) {
      filters.brand = brand;
    }
    
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Obtener productos con populate
    const products = await Product.find(filters)
      .populate('brand', 'name logo')
      .populate('category', 'name description image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Contar total para paginación
    const total = await Product.countDocuments(filters);

    // Obtener productos con stock bajo si se solicita
    let lowStockProducts = [];
    if (lowStock) {
      lowStockProducts = await Product.find({
        $expr: { $lte: ['$stock', '$minStock'] },
        isActive: true
      }).populate('brand', 'name logo').populate('category', 'name image');
    }

    return NextResponse.json({
      success: true,
      products: products.map(product => product.toSafeObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      lowStockProducts: lowStockProducts.map(product => product.toSafeObject())
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los productos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      code,
      name,
      description,
      brand,
      category,
      price,
      costPrice,
      stock,
      minStock,
      maxStock,
      images,
      specifications,
      tags,
      isDigital,
      weight,
      dimensions,
      sku,
      barcode
    } = body;

    // Validar campos requeridos
    if (!code || !name || !brand || !category || !price || stock === undefined || minStock === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      }, { status: 400 });
    }

    // Verificar si el producto ya existe (solo para campos no vacíos)
    const orConditions: Array<{ code?: string; sku?: string; barcode?: string }> = [{ code: code.toUpperCase() }];
    if (sku && sku.trim() !== '') {
      orConditions.push({ sku: sku });
    }
    if (barcode && barcode.trim() !== '') {
      orConditions.push({ barcode: barcode });
    }

    const existingProduct = await Product.findOne({
      $or: orConditions
    });
    
    if (existingProduct) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un producto con ese código, SKU o código de barras'
      }, { status: 400 });
    }

    // Verificar que la marca existe
    const brandExists = await Brand.findById(brand);
    if (!brandExists) {
      return NextResponse.json({
        success: false,
        message: 'La marca especificada no existe'
      }, { status: 400 });
    }

    // Verificar que la categoría existe
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return NextResponse.json({
        success: false,
        message: 'La categoría especificada no existe'
      }, { status: 400 });
    }

    // Crear nuevo producto (solo incluir sku y barcode si no están vacíos)
    const productData: Record<string, unknown> = {
      code: code.toUpperCase(),
      name,
      description,
      brand,
      category,
      price,
      costPrice,
      stock,
      minStock,
      maxStock,
      images: images || [],
      specifications: specifications || {},
      tags: tags || [],
      isDigital: isDigital || false,
      weight,
      dimensions
    };

    // Solo incluir sku y barcode si no están vacíos
    if (sku && sku.trim() !== '') {
      productData.sku = sku;
    }
    if (barcode && barcode.trim() !== '') {
      productData.barcode = barcode;
    }

    const newProduct = new Product(productData);

    await newProduct.save();

    // Actualizar contadores en marca y categoría
    await Brand.findByIdAndUpdate(brand, { $inc: { productCount: 1 } });
    await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

    // Obtener el producto con las referencias pobladas
    const populatedProduct = await Product.findById(newProduct._id)
      .populate('brand', 'name logo')
      .populate('category', 'name description image');

    return NextResponse.json({
      success: true,
      message: 'Producto creado exitosamente',
      product: populatedProduct?.toSafeObject()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear el producto',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
