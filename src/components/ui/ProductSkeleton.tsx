import { Package, Star } from 'lucide-react';

interface ProductSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export default function ProductSkeleton({ viewMode = 'grid' }: ProductSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
        <div className="flex">
          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-gray-300" />
                <div className="h-4 bg-gray-200 rounded w-8 ml-1"></div>
                <div className="h-4 bg-gray-200 rounded w-12 ml-1"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="relative">
        <div className="aspect-w-16 aspect-h-12 bg-gray-200 relative h-48 flex items-center justify-center">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
        
        {/* Badges skeleton */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-12"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
        
        {/* Actions skeleton */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="h-4 bg-gray-200 rounded w-8 ml-1"></div>
            <div className="h-4 bg-gray-200 rounded w-12 ml-1"></div>
          </div>
        </div>
        
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export function CatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}
