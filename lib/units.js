// Kitchen conversion chart — consistent with Melissa's Southern Style Kitchen reference
// Weight base: grams (g) | Volume base: milliliters (ml)
// 1 tbsp = 3 tsp = 15 mL | 1 cup = 16 tbsp = 240 mL | 1 fl oz = 2 tbsp = 30 mL
export const CONV = {
  g: 1, kg: 1000,
  oz: 28.3495, lb: 453.592,
  ml: 1, l: 1000,
  tsp: 5, tbsp: 15, cup: 240, 'fl oz': 30,
  pinch: 0.625, dash: 0.3125,
  unit: 1,
}

export const UNITS = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz', 'pinch', 'dash', 'unit']

export function toBase(qty, unit) {
  return qty * (CONV[unit] || 1)
}

// Returns stock quantity converted to base ml/g for threshold comparisons
export function stockToBase(stockQty, baseUnit) {
  return parseFloat(stockQty || 0) * (CONV[baseUnit] || 1)
}

// Low-stock threshold: <100g / <100ml / <5 units
export function isLowStock(supply) {
  const stock = parseFloat(supply.stock_qty || 0)
  if (stock <= 0) return false
  const bu = supply.base_unit || 'g'
  if (bu === 'unit') return stock < 5
  return stock * (CONV[bu] || 1) < 100
}
