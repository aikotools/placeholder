import { PlaceholderParser } from './PlaceholderParser'
import { PluginRegistry } from './PluginRegistry'
import { JsonProcessor } from '../formats/JsonProcessor'
import { TextProcessor } from '../formats/TextProcessor'
import type { ProcessOptions, CompareOptions, CompareResult } from './types'
import type { PlaceholderPlugin } from '../plugins/PlaceholderPlugin'
import type { Transform } from '../transforms/Transform'

/**
 * Main engine for placeholder processing
 *
 * This is the primary entry point for the template engine.
 * It orchestrates:
 * - Plugin registration
 * - Transform registration
 * - Format-specific processing (JSON, XML, Text)
 * - Multi-phase processing (Gen → Time → Compare)
 *
 * Example usage:
 * ```typescript
 * const engine = new PlaceholderEngine();
 * engine.registerPlugin(new TimePlugin());
 * engine.registerTransform(new ToNumberTransform());
 *
 * const result = await engine.processGenerate(jsonString, {
 *   format: 'json',
 *   mode: 'generate'
 * });
 * ```
 */
export class PlaceholderEngine {
  private parser: PlaceholderParser
  private registry: PluginRegistry
  private jsonProcessor: JsonProcessor
  private textProcessor: TextProcessor

  constructor() {
    this.parser = new PlaceholderParser()
    this.registry = new PluginRegistry()
    this.jsonProcessor = new JsonProcessor(this.parser, this.registry)
    this.textProcessor = new TextProcessor(this.parser, this.registry)
  }

  /**
   * Register a placeholder plugin
   *
   * @param plugin - Plugin to register
   */
  registerPlugin(plugin: PlaceholderPlugin): void {
    this.registry.registerPlugin(plugin)
  }

  /**
   * Register multiple plugins at once
   *
   * @param plugins - Array of plugins to register
   */
  registerPlugins(plugins: PlaceholderPlugin[]): void {
    this.registry.registerPlugins(plugins)
  }

  /**
   * Register a transform
   *
   * @param transform - Transform to register
   */
  registerTransform(transform: Transform): void {
    this.registry.registerTransform(transform)
  }

  /**
   * Register multiple transforms at once
   *
   * @param transforms - Array of transforms to register
   */
  registerTransforms(transforms: Transform[]): void {
    this.registry.registerTransforms(transforms)
  }

  /**
   * Process content in generate mode
   *
   * This resolves all placeholders to concrete values.
   *
   * @param content - Content with placeholders
   * @param options - Processing options
   * @returns Processed content with placeholders replaced
   */
  async processGenerate(content: string, options: ProcessOptions): Promise<string> {
    // Select processor based on format
    switch (options.format) {
      case 'json':
        return await this.jsonProcessor.process(content, options)

      case 'text':
        return await this.textProcessor.process(content, options)

      case 'xml':
        // XML processor not implemented yet
        throw new Error('XML format not yet implemented')

      default:
        throw new Error(`Unknown format: ${options.format}`)
    }
  }

  /**
   * Process content in compare mode
   *
   * This is used for comparing actual vs expected with smart matchers.
   * Will be implemented in Phase 6.
   *
   * @param actual - Actual content
   * @param expected - Expected content (with compare placeholders)
   * @param options - Comparison options
   * @returns Comparison result
   */
  async processCompare(
    _actual: string,
    _expected: string,
    _options: CompareOptions
  ): Promise<CompareResult> {
    // To be implemented in Phase 6
    throw new Error('Compare mode not yet implemented')
  }

  /**
   * Multi-phase processing for test expectations
   *
   * Processes an expected file in three phases:
   * 1. Gen phase: Only {{gen:...}} placeholders
   * 2. Time phase: Only {{time:...}} placeholders
   * 3. Compare phase: Converts time + compare placeholders to matchers
   *
   * This is the core workflow for the user's original use case.
   *
   * @param template - Template content (expected file)
   * @param actual - Actual content to compare against
   * @param options - Comparison options with context
   * @returns Comparison result
   */
  async processThreePhase(
    template: string,
    actual: string,
    options: CompareOptions
  ): Promise<CompareResult> {
    // Phase 1: Generate phase (only gen module)
    const afterGen = await this.processGenerate(template, {
      format: options.format,
      mode: 'generate',
      includePlugins: ['gen'],
      context: options.context,
    })

    // Phase 2: Time phase (only time module)
    const afterTime = await this.processGenerate(afterGen, {
      format: options.format,
      mode: 'generate',
      includePlugins: ['time'],
      context: options.context,
    })

    // Phase 3: Compare phase (convert to matchers and compare)
    return await this.processCompare(actual, afterTime, options)
  }

  /**
   * Get the parser instance (for advanced usage)
   */
  getParser(): PlaceholderParser {
    return this.parser
  }

  /**
   * Get the registry instance (for advanced usage)
   */
  getRegistry(): PluginRegistry {
    return this.registry
  }
}
