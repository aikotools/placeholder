import type { PlaceholderPlugin } from './PlaceholderPlugin'
import type { PluginResolveRequest, PluginMatcherRequest, PlaceholderResult } from '../core/types'
import type { Matcher } from '../compare/Matcher'

/**
 * Generator Plugin for creating test data
 *
 * Supports various data generation actions:
 * - uuid: Generate or use provided UUID
 * - number: Generate or use provided number
 * - string: Generate or use provided string
 * - zugnummer: Generate train number (alias for number)
 *
 * Examples:
 * - {{gen:uuid:12345678-1234-1234-1234-123456789012}} → "12345678-1234-1234-1234-123456789012"
 * - {{gen:number:42}} → 42 (as number)
 * - {{gen:string:Hello}} → "Hello"
 * - {{gen:zugnummer:4837}} → 4837
 */
export class GeneratorPlugin implements PlaceholderPlugin {
  readonly name = 'gen'

  resolve(request: PluginResolveRequest): PlaceholderResult {
    const { action, args } = request.placeholder

    switch (action) {
      case 'uuid':
        return this.handleUuid(args)

      case 'number':
      case 'zugnummer': // Alias for number
        return this.handleNumber(args)

      case 'string':
        return this.handleString(args)

      case 'boolean':
        return this.handleBoolean(args)

      default:
        throw new Error(
          `Generator plugin: unknown action '${action}'. Available: uuid, number, zugnummer, string, boolean`
        )
    }
  }

  /**
   * Handle UUID generation
   *
   * If an argument is provided, use it as the UUID (or any unique identifier).
   * Otherwise, generate a random UUID.
   *
   * Note: The argument can be any string, not just a valid UUID format.
   * This is useful for test data where you want predictable IDs.
   *
   * @param args - Arguments (optional UUID or identifier)
   * @returns UUID/ID string
   */
  private handleUuid(args: string[]): PlaceholderResult {
    let uuid: string

    if (args.length > 0 && args[0]) {
      // Use provided UUID/ID (no validation - allows any identifier for tests)
      uuid = args[0]
    } else {
      // Generate random UUID (v4 format)
      uuid = this.generateUuid()
    }

    return {
      value: uuid,
      type: 'string',
    }
  }

  /**
   * Handle number generation
   *
   * If an argument is provided, use it as the number.
   * Otherwise, generate a random number.
   *
   * @param args - Arguments (optional number)
   * @returns Number value
   */
  private handleNumber(args: string[]): PlaceholderResult {
    let value: number

    if (args.length > 0 && args[0]) {
      // Use provided number
      value = parseFloat(args[0])

      if (isNaN(value)) {
        throw new Error(`Generator plugin: invalid number '${args[0]}'`)
      }
    } else {
      // Generate random number (0-9999)
      value = Math.floor(Math.random() * 10000)
    }

    return {
      value,
      type: 'number',
    }
  }

  /**
   * Handle string generation
   *
   * If an argument is provided, use it as the string.
   * Otherwise, generate a random string.
   *
   * @param args - Arguments (optional string)
   * @returns String value
   */
  private handleString(args: string[]): PlaceholderResult {
    let value: string

    if (args.length > 0 && args[0]) {
      // Use provided string
      value = args[0]
    } else {
      // Generate random string
      value = this.generateRandomString(8)
    }

    return {
      value,
      type: 'string',
    }
  }

  /**
   * Handle boolean generation
   *
   * If an argument is provided, parse it as boolean.
   * Otherwise, generate random boolean.
   *
   * @param args - Arguments (optional boolean)
   * @returns Boolean value
   */
  private handleBoolean(args: string[]): PlaceholderResult {
    let value: boolean

    if (args.length > 0 && args[0]) {
      // Parse provided boolean
      const arg = args[0].toLowerCase()
      if (arg === 'true' || arg === '1' || arg === 'yes') {
        value = true
      } else if (arg === 'false' || arg === '0' || arg === 'no') {
        value = false
      } else {
        throw new Error(`Generator plugin: invalid boolean '${args[0]}'`)
      }
    } else {
      // Generate random boolean
      value = Math.random() >= 0.5
    }

    return {
      value,
      type: 'boolean',
    }
  }

  /**
   * Generate random UUID v4
   *
   * @returns UUID string
   */
  private generateUuid(): string {
    // Simple UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Generate random alphanumeric string
   *
   * @param length - Length of string
   * @returns Random string
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Create matcher for compare mode
   *
   * Will be fully implemented in Phase 6
   */
  createMatcher?(request: PluginMatcherRequest): Matcher {
    const { action, args } = request.placeholder

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      match: (_actual: any, _expected: any, _context: any) => {
        return {
          success: true,
          error: `Generator matcher for action '${action}' with args [${args.join(', ')}] - not yet implemented`,
        }
      },
    }
  }
}
