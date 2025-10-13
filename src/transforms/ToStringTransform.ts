import type { PlaceholderResult } from '../core/types'
import type { Transform } from './Transform'

/**
 * Transform that converts values to strings
 *
 * Converts any value to its string representation.
 *
 * Examples:
 * - 123 → "123"
 * - true → "true"
 * - {a: 1} → "[object Object]" or JSON.stringify
 */
export class ToStringTransform implements Transform {
  readonly name = 'toString'

  apply(input: PlaceholderResult, _params: string[]): PlaceholderResult {
    // If already a string, return as-is
    if (input.type === 'string') {
      return input
    }

    let stringValue: string

    if (input.value === null) {
      stringValue = 'null'
    } else if (input.value === undefined) {
      stringValue = 'undefined'
    } else if (typeof input.value === 'object' || Array.isArray(input.value)) {
      // For objects and arrays, use JSON.stringify
      try {
        stringValue = JSON.stringify(input.value)
      } catch (_error) {
        stringValue = String(input.value)
      }
    } else {
      stringValue = String(input.value)
    }

    return {
      value: stringValue,
      type: 'string',
    }
  }
}
