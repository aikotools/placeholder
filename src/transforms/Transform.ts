import type { PlaceholderResult } from '../core/types'

/**
 * Interface for value transformations
 *
 * Transforms modify the result of a placeholder resolution,
 * such as converting types (toNumber, toString) or
 * applying operations (multiply, round, etc.)
 */
export interface Transform {
  /**
   * Transform name (e.g., 'toNumber', 'toString', 'multiply')
   */
  readonly name: string

  /**
   * Apply the transformation
   *
   * @param input - Input value to transform
   * @param params - Transform parameters (e.g., ['2'] for multiply:2)
   * @returns Transformed value
   * @throws Error if transformation fails
   */
  apply(input: PlaceholderResult, params: string[]): PlaceholderResult
}
