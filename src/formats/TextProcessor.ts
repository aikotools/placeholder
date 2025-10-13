import { PlaceholderParser } from '../core/PlaceholderParser';
import { PluginRegistry } from '../core/PluginRegistry';
import type { ProcessOptions, PlaceholderResult } from '../core/types';

/**
 * Text Processor for simple string-based placeholder replacement
 *
 * Unlike JsonProcessor, this works purely with strings and doesn't maintain
 * type information. All placeholders are replaced with their string representation.
 *
 * Use this for:
 * - Plain text files
 * - Templates
 * - Any non-structured format
 *
 * Example:
 * Input: "Hello {{gen:name:World}}!"
 * Output: "Hello World!"
 */
export class TextProcessor {
  private parser: PlaceholderParser;
  private registry: PluginRegistry;

  constructor(parser: PlaceholderParser, registry: PluginRegistry) {
    this.parser = parser;
    this.registry = registry;
  }

  /**
   * Process text content and replace placeholders
   *
   * @param text - Text with placeholders
   * @param options - Processing options
   * @returns Processed text with placeholders replaced
   */
  async process(text: string, options: ProcessOptions): Promise<string> {
    let result = text;
    let previousResult = '';
    let iterations = 0;
    const maxIterations = 10;

    // Multi-pass replacement for nested placeholders
    while (result !== previousResult && iterations < maxIterations) {
      previousResult = result;

      const placeholders = this.parser.findPlaceholders(result);
      if (placeholders.length === 0) {
        break;
      }

      // Process each placeholder
      for (const placeholder of placeholders) {
        const resolved = await this.resolvePlaceholder(placeholder, options);
        result = result.replace(placeholder, resolved);
      }

      iterations++;
    }

    return result;
  }

  /**
   * Resolve a single placeholder to its string representation
   *
   * @param placeholder - Placeholder string to resolve
   * @param options - Processing options
   * @returns Resolved value as string
   */
  private async resolvePlaceholder(placeholder: string, options: ProcessOptions): Promise<string> {
    try {
      // Parse placeholder
      const parsed = this.parser.parse(placeholder);

      // Check if plugin should be included/excluded
      if (options.includePlugins && !options.includePlugins.includes(parsed.module)) {
        // Plugin not in include list, return placeholder as-is
        return placeholder;
      }
      if (options.excludePlugins && options.excludePlugins.includes(parsed.module)) {
        // Plugin in exclude list, return placeholder as-is
        return placeholder;
      }

      // Get plugin
      const plugin = this.registry.getPlugin(parsed.module);

      // Resolve placeholder
      let result: PlaceholderResult = await plugin.resolve({
        placeholder: parsed,
        context: options.context || {},
        registry: this.registry,
      });

      // Apply transforms
      for (const transform of parsed.transforms) {
        const transformImpl = this.registry.getTransform(transform.name);
        result = transformImpl.apply(result, transform.params);
      }

      // Always return as string
      return String(result.value);
    } catch (error) {
      throw new Error(
        `Failed to resolve placeholder "${placeholder}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
