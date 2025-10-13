import type { PlaceholderResult } from '../core/types';
import type { Transform } from './Transform';

/**
 * Transform that converts values to booleans
 *
 * Converts various value types to boolean using standard JavaScript truthiness rules.
 * Also supports common string representations like "true", "false", "yes", "no", "1", "0".
 *
 * Examples:
 * - "true" → true
 * - "false" → false
 * - "yes" → true
 * - "no" → false
 * - "1" → true
 * - "0" → false
 * - 1 → true
 * - 0 → false
 * - "" → false
 * - "any string" → true
 */
export class ToBooleanTransform implements Transform {
  readonly name = 'toBoolean';

  private readonly truthyStrings = new Set(['true', 'yes', '1', 'on', 'y']);
  private readonly falsyStrings = new Set(['false', 'no', '0', 'off', 'n', '']);

  apply(input: PlaceholderResult, _params: string[]): PlaceholderResult {
    // If already a boolean, return as-is
    if (input.type === 'boolean') {
      return input;
    }

    let boolValue: boolean;

    if (typeof input.value === 'string') {
      const lower = input.value.toLowerCase().trim();

      if (this.truthyStrings.has(lower)) {
        boolValue = true;
      } else if (this.falsyStrings.has(lower)) {
        boolValue = false;
      } else {
        // Non-empty strings that don't match known patterns are truthy
        boolValue = Boolean(input.value);
      }
    } else if (typeof input.value === 'number') {
      // 0 is false, everything else is true
      boolValue = input.value !== 0;
    } else {
      // Use JavaScript truthiness
      boolValue = Boolean(input.value);
    }

    return {
      value: boolValue,
      type: 'boolean',
    };
  }
}
