/**
 * @aikotools/placeholder - Placeholder Engine
 *
 * A powerful template engine with generate and compare modes.
 * Supports nested placeholders, transformations, and smart matching.
 */

// Export types
export type {
  PlaceholderResult,
  ParsedPlaceholder,
  ParsedTransform,
  ProcessOptions,
  ProcessContext,
  CompareOptions,
  CompareResult,
  CompareError,
  CompareDetail,
  TemplateCompareOptions,
  MatchContext,
  MatchResult,
  PluginResolveRequest,
  PluginMatcherRequest,
} from './core/types'

// Export core classes
export { PlaceholderParser } from './core/PlaceholderParser'
export { PluginRegistry } from './core/PluginRegistry'

// Export interfaces
export type { PlaceholderPlugin } from './plugins/PlaceholderPlugin'
export type { Matcher } from './compare/Matcher'
export type { Transform } from './transforms/Transform'

// Export transforms
export {
  ToNumberTransform,
  ToStringTransform,
  ToBooleanTransform,
  createStandardTransforms,
} from './transforms'

// Export plugins
export { TimePlugin } from './plugins/TimePlugin'
export { GeneratorPlugin } from './plugins/GeneratorPlugin'

// Export main engine
export { PlaceholderEngine } from './core/PlaceholderEngine'

// Export processors
export { JsonProcessor } from './formats/JsonProcessor'
export { TextProcessor } from './formats/TextProcessor'
