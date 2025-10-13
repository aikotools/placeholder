import type { PlaceholderPlugin } from './PlaceholderPlugin';
import type {
  PluginResolveRequest,
  PluginMatcherRequest,
  PlaceholderResult,
  MatchContext,
} from '../core/types';
import type { Matcher } from '../compare/Matcher';

/**
 * Async mock plugin for testing asynchronous plugin resolution
 *
 * All actions return Promises to test async support.
 *
 * Supports actions:
 * - echo:value - Returns the value as-is (async)
 * - delay:value:ms - Returns value after a delay (default 10ms)
 * - uppercase:value - Returns uppercase string (async)
 * - fetchValue:key - Simulates fetching a value from external source
 *
 * Examples:
 * - {{asyncMock:echo:hello}} → "hello" (via Promise)
 * - {{asyncMock:delay:world:100}} → "world" (after 100ms)
 * - {{asyncMock:uppercase:test}} → "TEST" (via Promise)
 */
export class AsyncMockPlugin implements PlaceholderPlugin {
  readonly name = 'asyncMock';

  async resolve(request: PluginResolveRequest): Promise<PlaceholderResult> {
    const { action, args } = request.placeholder;

    if (args.length === 0) {
      throw new Error(`AsyncMock plugin: action '${action}' requires at least one argument`);
    }

    const value = args[0];

    switch (action) {
      case 'echo':
        // Simulate async operation
        return this.delay(
          {
            value,
            type: 'string',
          },
          1
        );

      case 'uppercase':
        return this.delay(
          {
            value: value.toUpperCase(),
            type: 'string',
          },
          1
        );

      case 'delay':
        const delayMs = args.length > 1 ? parseInt(args[1], 10) : 10;
        return this.delay(
          {
            value,
            type: 'string',
          },
          delayMs
        );

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`AsyncMock plugin: cannot convert '${value}' to number`);
        }
        return this.delay(
          {
            value: num,
            type: 'number',
          },
          1
        );

      case 'fetchValue':
        // Simulate fetching from external source
        return this.simulateFetch(value);

      default:
        throw new Error(
          `AsyncMock plugin: unknown action '${action}'. Available: echo, uppercase, delay, number, fetchValue`
        );
    }
  }

  /**
   * Helper to simulate async delay
   */
  private delay(result: PlaceholderResult, ms: number): Promise<PlaceholderResult> {
    return new Promise(resolve => {
      setTimeout(() => resolve(result), ms);
    });
  }

  /**
   * Simulate fetching a value from an external source
   */
  private async simulateFetch(key: string): Promise<PlaceholderResult> {
    // Simulate network delay
    await this.delay({ value: null, type: 'string' }, 5);

    // Return mock data based on key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockData: Record<string, any> = {
      user: 'John Doe',
      age: 30,
      active: true,
    };

    if (key in mockData) {
      const value = mockData[key];
      const type = typeof value as 'string' | 'number' | 'boolean';
      return { value, type };
    }

    throw new Error(`AsyncMock plugin: key '${key}' not found in mock data`);
  }

  createMatcher?(request: PluginMatcherRequest): Matcher {
    const { action, args } = request.placeholder;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      match: (_actual: any, _expected: any, _context: MatchContext) => {
        return {
          success: true,
          error: `AsyncMock matcher for action '${action}' with args [${args.join(', ')}]`,
        };
      },
    };
  }
}
