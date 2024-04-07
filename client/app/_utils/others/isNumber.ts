export const isNumber = (value) => (
  typeof value === 'number' && Number.isFinite(value)
)
