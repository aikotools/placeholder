import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceholderParser } from '@core/PlaceholderParser';
import { PluginRegistry } from '@core/PluginRegistry';
import { MockPlugin } from '@/plugins/MockPlugin';
import { ToNumberTransform, ToStringTransform, ToBooleanTransform } from '@/transforms';

describe('Plugin Integration Tests', () => {
  let parser: PlaceholderParser;
  let registry: PluginRegistry;

  beforeEach(() => {
    parser = new PlaceholderParser();
    registry = new PluginRegistry();

    // Register mock plugin
    registry.registerPlugin(new MockPlugin());

    // Register standard transforms
    registry.registerTransform(new ToNumberTransform());
    registry.registerTransform(new ToStringTransform());
    registry.registerTransform(new ToBooleanTransform());
  });

  describe('Basic plugin resolution', () => {
    it('should resolve simple plugin placeholder', () => {
      const placeholder = '{{mock:echo:hello}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe('hello');
      expect(result.type).toBe('string');
    });

    it('should resolve plugin with uppercase action', () => {
      const placeholder = '{{mock:uppercase:hello}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe('HELLO');
      expect(result.type).toBe('string');
    });

    it('should resolve plugin with reverse action', () => {
      const placeholder = '{{mock:reverse:hello}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe('olleh');
      expect(result.type).toBe('string');
    });

    it('should resolve plugin that returns number', () => {
      const placeholder = '{{mock:number:42}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe(42);
      expect(result.type).toBe('number');
    });
  });

  describe('Plugin + Transform pipeline', () => {
    it('should convert string to number via transform', () => {
      const placeholder = '{{mock:echo:42|toNumber}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      let result = plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      // Apply toNumber transform
      for (const transformDef of parsed.transforms) {
        const transform = registry.getTransform(transformDef.name);
        result = transform.apply(result, transformDef.params);
      }

      expect(result.value).toBe(42);
      expect(result.type).toBe('number');
    });

    it('should apply toString transform to number', () => {
      const placeholder = '{{mock:number:42|toString}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      let result = plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe(42);
      expect(result.type).toBe('number');

      // Apply toString transform
      for (const transformDef of parsed.transforms) {
        const transform = registry.getTransform(transformDef.name);
        result = transform.apply(result, transformDef.params);
      }

      expect(result.value).toBe('42');
      expect(result.type).toBe('string');
    });

    it('should chain multiple transforms', () => {
      const placeholder = '{{mock:echo:yes|toBoolean|toString}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      let result = plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      // Apply all transforms in order
      for (const transformDef of parsed.transforms) {
        const transform = registry.getTransform(transformDef.name);
        result = transform.apply(result, transformDef.params);
      }

      expect(result.value).toBe('true');
      expect(result.type).toBe('string');
    });
  });

  describe('Complete replacement pipeline', () => {
    it('should replace placeholder in string with plugin resolution', () => {
      const content = 'Hello {{mock:echo:World}}!';

      const result = parser.replaceAll(content, (placeholder: string) => {
        const parsed = parser.parse(placeholder);
        const plugin = registry.getPlugin(parsed.module);
        const resolved = plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });

        // Apply transforms if any
        let finalResult = resolved;
        for (const transformDef of parsed.transforms) {
          const transform = registry.getTransform(transformDef.name);
          finalResult = transform.apply(finalResult, transformDef.params);
        }

        return String(finalResult.value);
      });

      expect(result).toBe('Hello World!');
    });

    it('should replace multiple placeholders with different plugins', () => {
      const content = '{{mock:echo:A}}_{{mock:uppercase:b}}_{{mock:reverse:xyz}}';

      const result = parser.replaceAll(content, (placeholder: string) => {
        const parsed = parser.parse(placeholder);
        const plugin = registry.getPlugin(parsed.module);
        const resolved = plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });

        let finalResult = resolved;
        for (const transformDef of parsed.transforms) {
          const transform = registry.getTransform(transformDef.name);
          finalResult = transform.apply(finalResult, transformDef.params);
        }

        return String(finalResult.value);
      });

      expect(result).toBe('A_B_zyx');
    });

    it('should handle placeholders with transforms in replacement', () => {
      const content = 'Value: {{mock:echo:42|toNumber}}';

      const result = parser.replaceAll(content, (placeholder: string) => {
        const parsed = parser.parse(placeholder);
        const plugin = registry.getPlugin(parsed.module);
        const resolved = plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });

        let finalResult = resolved;
        for (const transformDef of parsed.transforms) {
          const transform = registry.getTransform(transformDef.name);
          finalResult = transform.apply(finalResult, transformDef.params);
        }

        return String(finalResult.value);
      });

      expect(result).toBe('Value: 42');
    });
  });

  describe('Nested placeholder resolution', () => {
    it('should resolve nested placeholders', () => {
      const content = '{{mock:uppercase:{{mock:echo:hello}}}}';

      const result = parser.replaceAll(content, (placeholder: string) => {
        const parsed = parser.parse(placeholder);
        const plugin = registry.getPlugin(parsed.module);
        const resolved = plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });

        let finalResult = resolved;
        for (const transformDef of parsed.transforms) {
          const transform = registry.getTransform(transformDef.name);
          finalResult = transform.apply(finalResult, transformDef.params);
        }

        return String(finalResult.value);
      });

      expect(result).toBe('HELLO');
    });

    it('should resolve deeply nested placeholders with transforms', () => {
      const content = '{{mock:reverse:{{mock:uppercase:{{mock:echo:abc}}}}}}';

      const result = parser.replaceAll(content, (placeholder: string) => {
        const parsed = parser.parse(placeholder);
        const plugin = registry.getPlugin(parsed.module);
        const resolved = plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });

        let finalResult = resolved;
        for (const transformDef of parsed.transforms) {
          const transform = registry.getTransform(transformDef.name);
          finalResult = transform.apply(finalResult, transformDef.params);
        }

        return String(finalResult.value);
      });

      expect(result).toBe('CBA');
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown plugin', () => {
      const placeholder = '{{unknown:action:arg}}';
      const parsed = parser.parse(placeholder);

      expect(() => registry.getPlugin(parsed.module)).toThrow(
        "Plugin 'unknown' not found. Available plugins: mock"
      );
    });

    it('should throw error for unknown action', () => {
      const placeholder = '{{mock:unknownAction:arg}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);

      expect(() =>
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        })
      ).toThrow("Mock plugin: unknown action 'unknownAction'");
    });

    it('should throw error for invalid number conversion', () => {
      const placeholder = '{{mock:number:notANumber}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);

      expect(() =>
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        })
      ).toThrow("Mock plugin: cannot convert 'notANumber' to number");
    });

    it('should throw error for unknown transform', () => {
      const placeholder = '{{mock:echo:hello|unknownTransform}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);
      const resolved = plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(() => {
        for (const transformDef of parsed.transforms) {
          registry.getTransform(transformDef.name);
        }
      }).toThrow("Transform 'unknownTransform' not found");
    });
  });

  describe('Matcher creation', () => {
    it('should create matcher from plugin', () => {
      const placeholder = '{{mock:echo:test}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);

      if (plugin.createMatcher) {
        const matcher = plugin.createMatcher({
          placeholder: parsed,
          context: {},
          registry
        });

        const result = matcher.match('actual', 'expected', { path: [], actual: 'actual', expected: 'expected' });
        expect(result.success).toBe(true);
        expect(result.error).toContain('Mock matcher');
      }
    });
  });
});
