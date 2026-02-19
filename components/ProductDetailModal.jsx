import React, { useState } from 'react'
import { X, Check } from 'lucide-react'

export default function ProductDetailModal({ 
  product, 
  isOpen, 
  onClose, 
  onAddToSelection 
}) {
  const [selectedVariants, setSelectedVariants] = useState([])
  const [selectedFlavors, setSelectedFlavors] = useState([])

  if (!isOpen || !product) return null

  const hasVariants = product.hasVariants && product.variants?.length > 0
  const hasFlavors = product.flavors?.length > 0

  const toggleVariant = (variant) => {
    setSelectedVariants(prev => {
      const exists = prev.find(v => JSON.stringify(v) === JSON.stringify(variant))
      if (exists) {
        return prev.filter(v => JSON.stringify(v) !== JSON.stringify(variant))
      }
      return [...prev, variant]
    })
  }

  const toggleFlavor = (flavor) => {
    setSelectedFlavors(prev => {
      const exists = prev.find(f => JSON.stringify(f) === JSON.stringify(flavor))
      if (exists) {
        return prev.filter(f => JSON.stringify(f) !== JSON.stringify(flavor))
      }
      return [...prev, flavor]
    })
  }

  const handleAdd = () => {
    onAddToSelection(product, selectedVariants, selectedFlavors)
    setSelectedVariants([])
    setSelectedFlavors([])
  }

  const isVariantSelected = (variant) => {
    return selectedVariants.some(v => JSON.stringify(v) === JSON.stringify(variant))
  }

  const isFlavorSelected = (flavor) => {
    return selectedFlavors.some(f => JSON.stringify(f) === JSON.stringify(flavor))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-semibold">{product.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {product.images?.[0] && (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}

          {hasVariants && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Select Size(s):</h4>
              <div className="grid grid-cols-2 gap-3">
                {product.variants.map((variant, idx) => {
                  const isOutOfStock = (variant.stock || 0) <= 0
                  return (
                    <button
                      key={idx}
                      onClick={() => !isOutOfStock && toggleVariant(variant)}
                      disabled={isOutOfStock}
                      className={`p-3 border-2 rounded-lg transition relative ${
                        isOutOfStock
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                          : isVariantSelected(variant)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {variant.size.value}{variant.size.unit === 'grams' ? 'G' : variant.size.unit === 'pieces' ? ' pcs' : variant.size.unit.toUpperCase()}
                          </div>
                          <div className={`text-sm ${isOutOfStock ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                            {isOutOfStock ? 'Out of Stock' : `$${Number(variant.price).toFixed(2)}`}
                          </div>
                        </div>
                        {isVariantSelected(variant) && !isOutOfStock && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {hasFlavors && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Select Flavor(s):</h4>
              <div className="grid grid-cols-2 gap-3">
                {product.flavors.map((flavor, idx) => {
                  const isOutOfStock = (flavor.stock || 0) <= 0
                  return (
                    <button
                      key={idx}
                      onClick={() => !isOutOfStock && toggleFlavor(flavor)}
                      disabled={isOutOfStock}
                      className={`p-3 border-2 rounded-lg transition relative ${
                        isOutOfStock
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                          : isFlavorSelected(flavor)
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{flavor.name}</div>
                          <div className={`text-sm ${isOutOfStock ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                            {isOutOfStock ? 'Out of Stock' : (flavor.price > 0 ? `+$${Number(flavor.price).toFixed(2)}` : 'Free')}
                          </div>
                        </div>
                        {isFlavorSelected(flavor) && !isOutOfStock && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!hasVariants && !hasFlavors && (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-2">No variants or flavors available</p>
              <p className="text-2xl font-bold text-green-600">${Number(product.price).toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Add to Selection
          </button>
        </div>
      </div>
    </div>
  )
}
