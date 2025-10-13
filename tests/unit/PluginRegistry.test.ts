import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from '../../src/core/PluginRegistry';
import type { PlaceholderPlugin } from '../../src/plugins/PlaceholderPlugin';
import type { Transform } from '../../src/transforms/Transform';
import type { PlaceholderResult } from '../../src/core/types';

// Mock plugin for testing
class MockPlugin implements PlaceholderPlugin {
  constructor(public readonly name: string) {}

  resolve(): PlaceholderResult {
    return { value: 'mock', type: 'string' };
  }
}

// Mock transform for testing
class MockTransform implements Transform {
  constructor(public readonly name: string) {}

  apply(input: PlaceholderResult): PlaceholderResult {
    return input;
  }
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('registerPlugin', () => {
    it('should register a plugin', () => {
      const plugin = new MockPlugin('test');
      registry.registerPlugin(plugin);

      expect(registry.hasPlugin('test')).toBe(true);
      expect(registry.getPlugin('test')).toBe(plugin);
    });

    it('should throw error when registering duplicate plugin', () => {
      const plugin1 = new MockPlugin('test');
      const plugin2 = new MockPlugin('test');

      registry.registerPlugin(plugin1);

      expect(() => registry.registerPlugin(plugin2)).toThrow(
        "Plugin 'test' is already registered"
      );
    });
  });

  describe('registerPlugins', () => {
    it('should register multiple plugins', () => {
      const plugins = [
        new MockPlugin('plugin1'),
        new MockPlugin('plugin2'),
        new MockPlugin('plugin3')
      ];

      registry.registerPlugins(plugins);

      expect(registry.hasPlugin('plugin1')).toBe(true);
      expect(registry.hasPlugin('plugin2')).toBe(true);
      expect(registry.hasPlugin('plugin3')).toBe(true);
    });
  });

  describe('getPlugin', () => {
    it('should return registered plugin', () => {
      const plugin = new MockPlugin('test');
      registry.registerPlugin(plugin);

      const retrieved = registry.getPlugin('test');

      expect(retrieved).toBe(plugin);
    });

    it('should throw error for unregistered plugin', () => {
      expect(() => registry.getPlugin('nonexistent')).toThrow(
        "Plugin 'nonexistent' not found"
      );
    });

    it('should list available plugins in error message', () => {
      registry.registerPlugin(new MockPlugin('plugin1'));
      registry.registerPlugin(new MockPlugin('plugin2'));

      expect(() => registry.getPlugin('nonexistent')).toThrow(
        'Available plugins: plugin1, plugin2'
      );
    });
  });

  describe('hasPlugin', () => {
    it('should return true for registered plugin', () => {
      registry.registerPlugin(new MockPlugin('test'));

      expect(registry.hasPlugin('test')).toBe(true);
    });

    it('should return false for unregistered plugin', () => {
      expect(registry.hasPlugin('test')).toBe(false);
    });
  });

  describe('getPluginNames', () => {
    it('should return empty array when no plugins registered', () => {
      expect(registry.getPluginNames()).toEqual([]);
    });

    it('should return all registered plugin names', () => {
      registry.registerPlugin(new MockPlugin('plugin1'));
      registry.registerPlugin(new MockPlugin('plugin2'));
      registry.registerPlugin(new MockPlugin('plugin3'));

      const names = registry.getPluginNames();

      expect(names).toHaveLength(3);
      expect(names).toContain('plugin1');
      expect(names).toContain('plugin2');
      expect(names).toContain('plugin3');
    });
  });

  describe('registerTransform', () => {
    it('should register a transform', () => {
      const transform = new MockTransform('test');
      registry.registerTransform(transform);

      expect(registry.hasTransform('test')).toBe(true);
      expect(registry.getTransform('test')).toBe(transform);
    });

    it('should throw error when registering duplicate transform', () => {
      const transform1 = new MockTransform('test');
      const transform2 = new MockTransform('test');

      registry.registerTransform(transform1);

      expect(() => registry.registerTransform(transform2)).toThrow(
        "Transform 'test' is already registered"
      );
    });
  });

  describe('registerTransforms', () => {
    it('should register multiple transforms', () => {
      const transforms = [
        new MockTransform('transform1'),
        new MockTransform('transform2'),
        new MockTransform('transform3')
      ];

      registry.registerTransforms(transforms);

      expect(registry.hasTransform('transform1')).toBe(true);
      expect(registry.hasTransform('transform2')).toBe(true);
      expect(registry.hasTransform('transform3')).toBe(true);
    });
  });

  describe('getTransform', () => {
    it('should return registered transform', () => {
      const transform = new MockTransform('test');
      registry.registerTransform(transform);

      const retrieved = registry.getTransform('test');

      expect(retrieved).toBe(transform);
    });

    it('should throw error for unregistered transform', () => {
      expect(() => registry.getTransform('nonexistent')).toThrow(
        "Transform 'nonexistent' not found"
      );
    });

    it('should list available transforms in error message', () => {
      registry.registerTransform(new MockTransform('transform1'));
      registry.registerTransform(new MockTransform('transform2'));

      expect(() => registry.getTransform('nonexistent')).toThrow(
        'Available transforms: transform1, transform2'
      );
    });
  });

  describe('hasTransform', () => {
    it('should return true for registered transform', () => {
      registry.registerTransform(new MockTransform('test'));

      expect(registry.hasTransform('test')).toBe(true);
    });

    it('should return false for unregistered transform', () => {
      expect(registry.hasTransform('test')).toBe(false);
    });
  });

  describe('getTransformNames', () => {
    it('should return empty array when no transforms registered', () => {
      expect(registry.getTransformNames()).toEqual([]);
    });

    it('should return all registered transform names', () => {
      registry.registerTransform(new MockTransform('transform1'));
      registry.registerTransform(new MockTransform('transform2'));
      registry.registerTransform(new MockTransform('transform3'));

      const names = registry.getTransformNames();

      expect(names).toHaveLength(3);
      expect(names).toContain('transform1');
      expect(names).toContain('transform2');
      expect(names).toContain('transform3');
    });
  });

  describe('clear', () => {
    it('should clear all plugins and transforms', () => {
      registry.registerPlugin(new MockPlugin('plugin1'));
      registry.registerPlugin(new MockPlugin('plugin2'));
      registry.registerTransform(new MockTransform('transform1'));
      registry.registerTransform(new MockTransform('transform2'));

      registry.clear();

      expect(registry.getPluginNames()).toEqual([]);
      expect(registry.getTransformNames()).toEqual([]);
    });
  });
});
