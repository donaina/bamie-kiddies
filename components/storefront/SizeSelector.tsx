'use client'

interface Variant {
  id: string
  size: string
  quantity: number
}

interface Props {
  variants: Variant[]
  selectedVariantId: string | null
  onChange: (variantId: string) => void
}

export default function SizeSelector({ variants, selectedVariantId, onChange }: Props) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2">Select Size</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const soldOut  = v.quantity === 0
          const selected = v.id === selectedVariantId
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => !soldOut && onChange(v.id)}
              disabled={soldOut}
              className={`
                relative px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all
                ${soldOut
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through bg-gray-50'
                  : selected
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                }
              `}
              style={selected && !soldOut ? { backgroundColor: '#e45826', borderColor: '#e45826' } : {}}
            >
              {v.size}
              {!soldOut && v.quantity <= 3 && (
                <span className="absolute -top-2 -right-2 text-xs bg-yellow-400 text-yellow-900 rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {v.quantity}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
