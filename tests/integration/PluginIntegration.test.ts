import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceholderParser, PluginRegistry, ToNumberTransform, ToStringTransform, ToBooleanTransform } from '../../src';
import { MockPlugin } from '../helpers/MockPlugin';

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
    it('should resolve simple plugin placeholder', async () => {
      const placeholder = '{{mock:echo:hello}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe('hello');
      expect(result.type).toBe('string');
    });

    it('should resolve plugin with uppercase action', async () => {
      const placeholder = '{{mock:uppercase:hello}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe('HELLO');
      expect(result.type).toBe('string');
    });

    it('should resolve plugin with reverse action', async () => {
      const placeholder = '{{mock:reverse:hello}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe('olleh');
      expect(result.type).toBe('string');
    });

    it('should resolve plugin that returns number', async () => {
      const placeholder = '{{mock:number:42}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe(42);
      expect(result.type).toBe('number');
    });
  });

  describe('Plugin + Transform pipeline', () => {
    it('should convert string to number via transform', async () => {
      const placeholder = '{{mock:echo:42|toNumber}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      let result = await plugin.resolve({
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

    it('should apply toString transform to number', async () => {
      const placeholder = '{{mock:number:42|toString}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      let result = await plugin.resolve({
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

    it('should chain multiple transforms', async () => {
      const placeholder = '{{mock:echo:yes|toBoolean|toString}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      let result = await plugin.resolve({
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
    it('should replace placeholder in string with plugin resolution', async () => {
      const content = 'Hello {{mock:echo:World}}!';
      const placeholders = parser.findPlaceholders(content);

      let result = content;
      for (const placeholder of placeholders) {
        const parsed = parser.parse(placeholder);
        const plugin = registry.getPlugin(parsed.module);
        const resolved = await plugin.resolve({
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

        result = result.replace(placeholder, String(finalResult.value));
      }

      expect(result).toBe('Hello World!');
    });

    it('should replace multiple placeholders with different plugins', async () => {
      const content = '{{mock:echo:A}}_{{mock:uppercase:b}}_{{mock:reverse:xyz}}';
      const placeholders = parser.findPlaceholders(content);

      let result = content;
      for (const placeholder of placeholders) {
        const parsed = parser.parse(placeholder);
        const plugin = registry.getPlugin(parsed.module);
        const resolved = await plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });

        let finalResult = resolved;
        for (const transformDef of parsed.transforms) {
          const transform = registry.getTransform(transformDef.name);
          finalResult = transform.apply(finalResult, transformDef.params);
        }

        result = result.replace(placeholder, String(finalResult.value));
      }

      expect(result).toBe('A_B_zyx');
    });

    it('should handle placeholders with transforms in replacement', async () => {
      const content = 'Value: {{mock:echo:42|toNumber}}';
      const placeholders = parser.findPlaceholders(content);

      let result = content;
      for (const placeholder of placeholders) {
        const parsed = parser.parse(placeholder);
        const plugin = registry.getPlugin(parsed.module);
        const resolved = await plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });

        let finalResult = resolved;
        for (const transformDef of parsed.transforms) {
          const transform = registry.getTransform(transformDef.name);
          finalResult = transform.apply(finalResult, transformDef.params);
        }

        result = result.replace(placeholder, String(finalResult.value));
      }

      expect(result).toBe('Value: 42');
    });
  });

  describe('Nested placeholder resolution', () => {
    it('should resolve nested placeholders', async () => {
      let content = '{{mock:uppercase:{{mock:echo:hello}}}}';

      // Process multiple passes for nested placeholders
      let previousContent = '';
      let iterations = 0;
      const maxIterations = 10;

      while (content !== previousContent && iterations < maxIterations) {
        previousContent = content;
        const placeholders = parser.findPlaceholders(content);

        // Sort innermost first
        const sorted = placeholders.sort((a, b) => {
          if (a.includes(b)) return 1;
          if (b.includes(a)) return -1;
          return content.indexOf(a) - content.indexOf(b);
        });

        for (const placeholder of sorted) {
          if (!content.includes(placeholder)) continue;

          const parsed = parser.parse(placeholder);
          const plugin = registry.getPlugin(parsed.module);
          const resolved = await plugin.resolve({
            placeholder: parsed,
            context: {},
            registry
          });

          let finalResult = resolved;
          for (const transformDef of parsed.transforms) {
            const transform = registry.getTransform(transformDef.name);
            finalResult = transform.apply(finalResult, transformDef.params);
          }

          content = content.replaceAll(placeholder, String(finalResult.value));
        }
        iterations++;
      }

      expect(content).toBe('HELLO');
    });

    it('should resolve deeply nested placeholders with transforms', async () => {
      let content = '{{mock:reverse:{{mock:uppercase:{{mock:echo:abc}}}}}}';

      // Process multiple passes for nested placeholders
      let previousContent = '';
      let iterations = 0;
      const maxIterations = 10;

      while (content !== previousContent && iterations < maxIterations) {
        previousContent = content;
        const placeholders = parser.findPlaceholders(content);

        // Sort innermost first
        const sorted = placeholders.sort((a, b) => {
          if (a.includes(b)) return 1;
          if (b.includes(a)) return -1;
          return content.indexOf(a) - content.indexOf(b);
        });

        for (const placeholder of sorted) {
          if (!content.includes(placeholder)) continue;

          const parsed = parser.parse(placeholder);
          const plugin = registry.getPlugin(parsed.module);
          const resolved = await plugin.resolve({
            placeholder: parsed,
            context: {},
            registry
          });

          let finalResult = resolved;
          for (const transformDef of parsed.transforms) {
            const transform = registry.getTransform(transformDef.name);
            finalResult = transform.apply(finalResult, transformDef.params);
          }

          content = content.replaceAll(placeholder, String(finalResult.value));
        }
        iterations++;
      }

      expect(content).toBe('CBA');
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

    it('should throw error for unknown action', async () => {
      const placeholder = '{{mock:unknownAction:arg}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);

      await expect(async () => {
        await plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });
      }).rejects.toThrow("Mock plugin: unknown action 'unknownAction'");
    });

    it('should throw error for invalid number conversion', async () => {
      const placeholder = '{{mock:number:notANumber}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);

      await expect(async () => {
        await plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        });
      }).rejects.toThrow("Mock plugin: cannot convert 'notANumber' to number");
    });

    it('should throw error for unknown transform', async () => {
      const placeholder = '{{mock:echo:hello|unknownTransform}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);
      const resolved = await plugin.resolve({
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
