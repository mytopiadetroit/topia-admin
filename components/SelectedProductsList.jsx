import React from 'react'
import { X } from 'lucide-react'

export default function SelectedProductsList({ 
  selectedProducts, 
  productVariants, 
  onRemove, 
  onAddToBox 
}) {
  if (selectedProducts.length === 0) return null

  return (
    <div className="p-4 bg-blue-50 border-b">
      <h4 className="font-semibold text-gray-900 mb-3">Selected Products:</h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {selectedProducts.map(product => {
          const variants = productVariants[product._id]
          const selectedVariant = variants?.selectedVariant
          const selectedFlavor = variants?.selectedFlavor
          
          let price = 0
          if (selectedFlavor && selectedFlavor.price) {
            price = Number(selectedFlavor.price)
          } else if (selectedVariant && selectedVariant.price) {
            price = Number(selectedVariant.price)
          } else {
            price = Number(product.price || 0)
          }
          
          return (
            <div key={product._id} className="bg-white p-3 rounded-lg border flex items-center justify-between">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">{product.name}</h5>
                <div className="flex gap-2 mt-1">
                  {selectedVariant && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {selectedVariant.size.value}{selectedVariant.size.unit === 'grams' ? 'G' : selectedVariant.size.unit === 'pieces' ? ' pcs' : selectedVariant.size.unit.toUpperCase()}
                    </span>
                  )}
                  {selectedFlavor && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {selectedFlavor.name}
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-green-600 mt-1">
                  ${price.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => onRemove(product._id)}
                className="text-red-600 hover:text-red-800 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )
        })}
      </div>
      <button
        onClick={onAddToBox}
        className="mt-3 w-full bg-[#80A6F7] text-white py-2 rounded-lg  font-semibold"
      >
        Add {selectedProducts.length} Product(s) to Box
      </button>
    </div>
  )
}
