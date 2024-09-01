import { Transform } from 'class-transformer'

export function TransformToObject() {
    return Transform(({ value }) =>
        typeof value === 'string' ? JSON.parse(value) : value
    )
}
