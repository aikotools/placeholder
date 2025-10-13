/**
 * Core types and interfaces for the advanced template engine
 */

/**
 * Result of a placeholder resolution
 */
export interface PlaceholderResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

/**
 * Parsed placeholder structure
 */
export interface ParsedPlaceholder {
  original: string; // Original placeholder string
  module: string; // Module name (gen, time, compare)
  action: string; // Action (calc, uuid, startsWith, etc.)
  args: string[]; // Arguments
  transforms: ParsedTransform[]; // Transform pipeline
}

/**
 * Parsed transform in a placeholder
 */
export interface ParsedTransform {
  name: string; // Transform name (toNumber, toString, etc.)
  params: string[]; // Transform parameters
}

/**
 * Options for processing content in generate mode
 */
export interface ProcessOptions {
  format: 'json' | 'xml' | 'text';
  mode: 'generate';

  // Selective plugin execution
  includePlugins?: string[];
  excludePlugins?: string[];

  // Context for plugins
  context?: ProcessContext;

  // Security
  maxNestingDepth?: number;
}

/**
 * Context passed to plugins during processing
 */
export interface ProcessContext {
  testcaseId?: string;
  startTimeTest?: string;
  startTimeScript?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Options for comparing content
 */
export interface CompareOptions {
  format: 'json' | 'xml' | 'text';
  context?: ProcessContext;
}

/**
 * Result of a comparison
 */
export interface CompareResult {
  success: boolean;
  errors: CompareError[];
  details: CompareDetail[];
}

/**
 * A single comparison error
 */
export interface CompareError {
  path: string;
  message: string;
}

/**
 * Detailed comparison information
 */
export interface CompareDetail {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actual: any;
  message: string;
}

/**
 * Options for template-based comparison (3-phase)
 */
export interface TemplateCompareOptions {
  template: string;
  actual: string;
  format: 'json' | 'xml' | 'text';
  context: ProcessContext;
}

/**
 * Context for matchers during comparison
 */
export interface MatchContext {
  path: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actual: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any;
}

/**
 * Result of a matcher execution
 */
export interface MatchResult {
  success: boolean;
  error?: string;
}

/**
 * Request for plugin resolution
 */
export interface PluginResolveRequest {
  placeholder: ParsedPlaceholder;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registry?: any; // PluginRegistry (avoiding circular dependency)
}

/**
 * Request for creating a matcher
 */
export interface PluginMatcherRequest {
  placeholder: ParsedPlaceholder;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registry?: any; // PluginRegistry (avoiding circular dependency)
}
