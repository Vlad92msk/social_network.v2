export const isString = (value) => (
  Object.prototype.toString.call(value) === '[object String]'
)
