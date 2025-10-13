import { PlaceholderParser } from '../core/PlaceholderParser';
import { PluginRegistry } from '../core/PluginRegistry';
import type { ProcessOptions, PlaceholderResult } from '../core/types';

/**
 * JSON Processor with AST-based placeholder replacement
 *
 * This processor is critical for maintaining type information in JSON.
 * It parses JSON to an AST, finds and replaces placeholders while preserving types.
 *
 * Example:
 * Input JSON: {"count": "{{gen:number:42|toNumber}}"}
 * After processing: {"count": 42}  // Note: number type, not string!
 */
export class JsonProcessor {
  private parser: PlaceholderParser;
  private registry: PluginRegistry;

  constructor(parser: PlaceholderParser, registry: PluginRegistry) {
    this.parser = parser;
    this.registry = registry;
  }

  /**
   * Process JSON content and replace placeholders
   *
   * @param jsonString - JSON string with placeholders
   * @param options - Processing options
   * @returns Processed JSON string with placeholders replaced
   */
  async process(jsonString: string, options: ProcessOptions): Promise<string> {
    // Parse JSON to AST
    const ast = JSON.parse(jsonString);

    // Process AST recursively
    const processed = await this.processNode(ast, options, []);

    // Convert back to JSON string
    return JSON.stringify(processed, null, 2);
  }

  /**
   * Process a single AST node recursively
   *
   * @param node - Current AST node
   * @param options - Processing options
   * @param path - Current path in the AST (for error reporting)
   * @returns Processed node
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processNode(node: any, options: ProcessOptions, path: string[]): Promise<any> {
    // Handle null/undefined
    if (node === null || node === undefined) {
      return node;
    }

    // Handle arrays
    if (Array.isArray(node)) {
      const processed = [];
      for (let i = 0; i < node.length; i++) {
        processed.push(await this.processNode(node[i], options, [...path, `[${i}]`]));
      }
      return processed;
    }

    // Handle objects
    if (typeof node === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processed: Record<string, any> = {};
      for (const [key, value] of Object.entries(node)) {
        processed[key] = await this.processNode(value, options, [...path, key]);
      }
      return processed;
    }

    // Handle strings (potential placeholders)
    if (typeof node === 'string') {
      return await this.processStringValue(node, options, path);
    }

    // Handle primitives (number, boolean) - return as-is
    return node;
  }

  /**
   * Process a string value that may contain placeholders
   *
   * @param value - String value to process
   * @param options - Processing options
   * @param path - Current path (for error reporting)
   * @returns Processed value (may be different type!)
   */
  private async processStringValue(
    value: string,
    options: ProcessOptions,
    path: string[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    // Get all placeholders in this string
    const placeholders = this.parser.findPlaceholders(value);

    if (placeholders.length === 0) {
      // No placeholders, return as-is
      return value;
    }

    // Check if this is a pure placeholder (entire string is one placeholder)
    const isPurePlaceholder = this.parser.isPlaceholder(value);

    if (isPurePlaceholder && placeholders.length === 1) {
      // Pure placeholder without nested placeholders - can preserve type
      return await this.resolvePlaceholder(value, options, path);
    }

    // Either string interpolation OR pure placeholder with nested placeholders
    // In both cases, we need to resolve nested placeholders first as strings
    let result = value;
    let previousResult = '';
    let iterations = 0;
    const maxIterations = 10;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastResolvedValue: any = null;

    while (result !== previousResult && iterations < maxIterations) {
      previousResult = result;

      // Get current placeholders and sort by position (innermost first)
      const currentPlaceholders = this.parser.findPlaceholders(result);
      if (currentPlaceholders.length === 0) break;

      const sorted = this.sortPlaceholdersByPosition(result, currentPlaceholders);

      // Only resolve placeholders that don't contain other placeholders
      for (const placeholder of sorted) {
        // Check if this placeholder contains other placeholders from our list
        const containsOthers = currentPlaceholders.some(
          other => other !== placeholder && placeholder.includes(other)
        );

        if (!containsOthers) {
          const resolved = await this.resolvePlaceholder(placeholder, options, path);

          // If this was the last placeholder and it's a pure placeholder, keep the typed value
          if (isPurePlaceholder && currentPlaceholders.length === 1) {
            lastResolvedValue = resolved;
          }

          // Always convert to string for replacement
          result = result.replaceAll(placeholder, String(resolved));
        }
      }

      iterations++;
    }

    // If it was originally a pure placeholder, return the typed value
    if (isPurePlaceholder) {
      // If we have a last resolved value with the correct type, return it
      if (lastResolvedValue !== null) {
        return lastResolvedValue;
      }
      // Otherwise, if result is still a placeholder, resolve it
      if (this.parser.isPlaceholder(result)) {
        return await this.resolvePlaceholder(result, options, path);
      }
    }

    // String interpolation - result stays as string
    return result;
  }

  /**
   * Sort placeholders by position in string (innermost first for nested placeholders)
   *
   * @param content - Content string
   * @param placeholders - Placeholders to sort
   * @returns Sorted placeholders
   */
  private sortPlaceholdersByPosition(content: string, placeholders: string[]): string[] {
    return placeholders
      .map(ph => ({
        placeholder: ph,
        start: content.indexOf(ph),
        end: content.indexOf(ph) + ph.length,
      }))
      .sort((a, b) => {
        // If one placeholder contains another, process inner first
        if (a.start >= b.start && a.end <= b.end) return -1;
        if (b.start >= a.start && b.end <= a.end) return 1;
        // Otherwise sort by position
        return a.start - b.start;
      })
      .map(item => item.placeholder);
  }

  /**
   * Resolve a single placeholder
   *
   * @param placeholder - Placeholder string to resolve
   * @param options - Processing options
   * @param path - Current path (for error reporting)
   * @returns Resolved value (with correct type)
   */
  private async resolvePlaceholder(
    placeholder: string,
    options: ProcessOptions,
    path: string[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
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

      // Return the typed value
      return result.value;
    } catch (error) {
      const pathStr = path.join('.');
      throw new Error(
        `Failed to resolve placeholder "${placeholder}" at path "${pathStr}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
