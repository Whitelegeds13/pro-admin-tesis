export default function SidebarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Search skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-16 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
      </div>

      {/* Categories skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gray-200 rounded mr-3"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Brands skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-16 mb-4"></div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gray-200 rounded mr-3"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Price range skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="space-y-4">
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>

      {/* Features skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="w-5 h-5 bg-gray-200 rounded mr-3"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
