import type { PlaceholderResult } from '../core/types';
import type { Transform } from './Transform';

/**
 * Transform that converts values to numbers
 *
 * Converts string representations of numbers to actual number types.
 * This is crucial for JSON where placeholders are strings but need to be numbers.
 *
 * Examples:
 * - "123" → 123
 * - "45.67" → 45.67
 * - "-10" → -10
 */
export class ToNumberTransform implements Transform {
  readonly name = 'toNumber';

  apply(input: PlaceholderResult, _params: string[]): PlaceholderResult {
    // If already a number, return as-is
    if (input.type === 'number') {
      return input;
    }

    // Try to convert to number
    const value = input.value;
    let numValue: number;

    if (typeof value === 'string') {
      numValue = Number(value);
    } else if (typeof value === 'boolean') {
      numValue = value ? 1 : 0;
    } else if (value === null || value === undefined) {
      throw new Error('Cannot convert null or undefined to number');
    } else {
      numValue = Number(value);
    }

    // Check if conversion was successful
    if (isNaN(numValue)) {
      throw new Error(`Cannot convert "${value}" to number`);
    }

    return {
      value: numValue,
      type: 'number',
    };
  }
}
