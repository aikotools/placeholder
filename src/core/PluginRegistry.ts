import type { PlaceholderPlugin } from '../plugins/PlaceholderPlugin'
import type { Transform } from '../transforms/Transform'

/**
 * Registry for managing placeholder plugins and transforms
 *
 * Provides centralized access to registered plugins and transforms.
 * Plugins and transforms can be registered and retrieved by name.
 */
export class PluginRegistry {
  private plugins: Map<string, PlaceholderPlugin> = new Map()
  private transforms: Map<string, Transform> = new Map()

  /**
   * Register a placeholder plugin
   *
   * @param plugin - Plugin to register
   * @throws Error if plugin with same name already exists
   */
  registerPlugin(plugin: PlaceholderPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`)
    }
    this.plugins.set(plugin.name, plugin)
  }

  /**
   * Register multiple plugins at once
   *
   * @param plugins - Array of plugins to register
   */
  registerPlugins(plugins: PlaceholderPlugin[]): void {
    for (const plugin of plugins) {
      this.registerPlugin(plugin)
    }
  }

  /**
   * Get a registered plugin by name
   *
   * @param name - Plugin name
   * @returns Plugin instance
   * @throws Error if plugin not found
   */
  getPlugin(name: string): PlaceholderPlugin {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      const available = Array.from(this.plugins.keys()).join(', ')
      throw new Error(`Plugin '${name}' not found. Available plugins: ${available || 'none'}`)
    }
    return plugin
  }

  /**
   * Check if a plugin is registered
   *
   * @param name - Plugin name
   * @returns True if plugin exists
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * Get all registered plugin names
   *
   * @returns Array of plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys())
  }

  /**
   * Register a transform
   *
   * @param transform - Transform to register
   * @throws Error if transform with same name already exists
   */
  registerTransform(transform: Transform): void {
    if (this.transforms.has(transform.name)) {
      throw new Error(`Transform '${transform.name}' is already registered`)
    }
    this.transforms.set(transform.name, transform)
  }

  /**
   * Register multiple transforms at once
   *
   * @param transforms - Array of transforms to register
   */
  registerTransforms(transforms: Transform[]): void {
    for (const transform of transforms) {
      this.registerTransform(transform)
    }
  }

  /**
   * Get a registered transform by name
   *
   * @param name - Transform name
   * @returns Transform instance
   * @throws Error if transform not found
   */
  getTransform(name: string): Transform {
    const transform = this.transforms.get(name)
    if (!transform) {
      const available = Array.from(this.transforms.keys()).join(', ')
      throw new Error(`Transform '${name}' not found. Available transforms: ${available || 'none'}`)
    }
    return transform
  }

  /**
   * Check if a transform is registered
   *
   * @param name - Transform name
   * @returns True if transform exists
   */
  hasTransform(name: string): boolean {
    return this.transforms.has(name)
  }

  /**
   * Get all registered transform names
   *
   * @returns Array of transform names
   */
  getTransformNames(): string[] {
    return Array.from(this.transforms.keys())
  }

  /**
   * Clear all registered plugins and transforms
   */
  clear(): void {
    this.plugins.clear()
    this.transforms.clear()
  }
}
