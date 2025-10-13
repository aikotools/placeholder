import type { PlaceholderPlugin } from './PlaceholderPlugin';
import type {
  PluginResolveRequest,
  PluginMatcherRequest,
  PlaceholderResult,
  MatchContext,
} from '../core/types';
import type { Matcher } from '../compare/Matcher';

/**
 * Mock plugin for testing the plugin system
 *
 * Supports actions:
 * - echo:value - Returns the value as-is
 * - uppercase:value - Returns uppercase string
 * - reverse:value - Returns reversed string
 * - number:value - Returns a number
 * - constant:value - Returns a constant value (for testing)
 *
 * Examples:
 * - {{mock:echo:hello}} → "hello"
 * - {{mock:uppercase:hello}} → "HELLO"
 * - {{mock:reverse:hello}} → "olleh"
 * - {{mock:number:42}} → 42 (as number)
 */
export class MockPlugin implements PlaceholderPlugin {
  readonly name = 'mock';

  resolve(request: PluginResolveRequest): PlaceholderResult {
    const { action, args } = request.placeholder;

    if (args.length === 0) {
      throw new Error(`Mock plugin: action '${action}' requires at least one argument`);
    }

    const value = args[0];

    switch (action) {
      case 'echo':
        return {
          value,
          type: 'string',
        };

      case 'uppercase':
        return {
          value: value.toUpperCase(),
          type: 'string',
        };

      case 'reverse':
        return {
          value: value.split('').reverse().join(''),
          type: 'string',
        };

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Mock plugin: cannot convert '${value}' to number`);
        }
        return {
          value: num,
          type: 'number',
        };

      case 'constant':
        // Return a constant value for testing
        return {
          value,
          type: 'string',
        };

      case 'async':
        // For testing async behavior - will be handled by AsyncMockPlugin
        throw new Error('Async action should be handled by AsyncMockPlugin');

      default:
        throw new Error(
          `Mock plugin: unknown action '${action}'. Available: echo, uppercase, reverse, number, constant`
        );
    }
  }

  createMatcher?(request: PluginMatcherRequest): Matcher {
    const { action, args } = request.placeholder;

    // Simple mock matcher that always matches for testing
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      match: (_actual: any, _expected: any, _context: MatchContext) => {
        return {
          success: true,
          error: `Mock matcher for action '${action}' with args [${args.join(', ')}]`,
        };
      },
    };
  }
}
