import { Transform } from 'class-transformer'

export function TransformToArray() {
    return Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',').map(item => item.trim())
        }
        return value
    })
}
