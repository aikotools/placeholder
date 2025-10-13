import type { PlaceholderResult, PluginResolveRequest, PluginMatcherRequest } from '../core/types';
import type { Matcher } from '../compare/Matcher';

/**
 * Interface for placeholder plugins
 *
 * Plugins handle specific types of placeholders (gen, time, compare, etc.)
 * They can work in two modes:
 * - Generate mode: Resolve placeholder to a concrete value
 * - Compare mode: Create a matcher for smart comparison
 */
export interface PlaceholderPlugin {
  /**
   * Plugin name (e.g., 'gen', 'time', 'compare')
   */
  readonly name: string;

  /**
   * Resolve a placeholder to a concrete value (Generate mode)
   *
   * @param request - Resolution request with action, args, and context
   * @returns Resolved value with type information
   * @throws Error if placeholder cannot be resolved in generate mode
   */
  resolve(request: PluginResolveRequest): PlaceholderResult | Promise<PlaceholderResult>;

  /**
   * Create a matcher for comparison (Compare mode)
   *
   * Only plugins that support compare mode need to implement this.
   *
   * @param request - Matcher request with action, args, and context
   * @returns Matcher instance
   * @throws Error if plugin doesn't support compare mode
   */
  createMatcher?(request: PluginMatcherRequest): Matcher;
}
