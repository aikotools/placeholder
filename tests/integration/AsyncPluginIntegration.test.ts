import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceholderParser, PluginRegistry, ToNumberTransform, ToStringTransform } from '../../src';
import { AsyncMockPlugin } from '../helpers/AsyncMockPlugin';

describe('Async Plugin Integration Tests', () => {
  let parser: PlaceholderParser;
  let registry: PluginRegistry;

  beforeEach(() => {
    parser = new PlaceholderParser();
    registry = new PluginRegistry();

    // Register async mock plugin
    registry.registerPlugin(new AsyncMockPlugin());

    // Register standard transforms
    registry.registerTransform(new ToNumberTransform());
    registry.registerTransform(new ToStringTransform());
  });

  describe('Basic async plugin resolution', () => {
    it('should resolve async plugin placeholder', async () => {
      const placeholder = '{{asyncMock:echo:hello}}';
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

    it('should resolve async plugin with uppercase action', async () => {
      const placeholder = '{{asyncMock:uppercase:hello}}';
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

    it('should handle delay action', async () => {
      const placeholder = '{{asyncMock:delay:test:50}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const startTime = Date.now();
      const result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });
      const endTime = Date.now();

      expect(result.value).toBe('test');
      expect(result.type).toBe('string');
      expect(endTime - startTime).toBeGreaterThanOrEqual(45); // Allow some margin
    });

    it('should simulate fetching value from external source', async () => {
      const placeholder = '{{asyncMock:fetchValue:user}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe('John Doe');
      expect(result.type).toBe('string');
    });

    it('should fetch number value', async () => {
      const placeholder = '{{asyncMock:fetchValue:age}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe(30);
      expect(result.type).toBe('number');
    });

    it('should fetch boolean value', async () => {
      const placeholder = '{{asyncMock:fetchValue:active}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      const result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe(true);
      expect(result.type).toBe('boolean');
    });
  });

  describe('Async plugin + Transform pipeline', () => {
    it('should apply transform after async plugin resolution', async () => {
      const placeholder = '{{asyncMock:echo:42|toNumber}}';
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

    it('should convert async number to string via transform', async () => {
      const placeholder = '{{asyncMock:number:99|toString}}';
      const parsed = parser.parse(placeholder);

      const plugin = registry.getPlugin(parsed.module);
      let result = await plugin.resolve({
        placeholder: parsed,
        context: {},
        registry
      });

      expect(result.value).toBe(99);
      expect(result.type).toBe('number');

      // Apply toString transform
      for (const transformDef of parsed.transforms) {
        const transform = registry.getTransform(transformDef.name);
        result = transform.apply(result, transformDef.params);
      }

      expect(result.value).toBe('99');
      expect(result.type).toBe('string');
    });
  });

  describe('Async placeholder replacement', () => {
    it('should replace async placeholder in string', async () => {
      const content = 'Hello {{asyncMock:echo:World}}!';
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

      expect(result).toBe('Hello World!');
    });

    it('should handle multiple async placeholders', async () => {
      const content = '{{asyncMock:echo:A}}_{{asyncMock:uppercase:b}}_{{asyncMock:fetchValue:user}}';
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

      expect(result).toBe('A_B_John Doe');
    });

    it('should handle async placeholders with concurrent resolution', async () => {
      const content = '{{asyncMock:delay:A:20}}_{{asyncMock:delay:B:20}}_{{asyncMock:delay:C:20}}';
      const placeholders = parser.findPlaceholders(content);

      // Resolve all placeholders concurrently
      const startTime = Date.now();
      const resolutions = await Promise.all(
        placeholders.map(async (placeholder) => {
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

          return { placeholder, value: String(finalResult.value) };
        })
      );
      const endTime = Date.now();

      let result = content;
      for (const { placeholder, value } of resolutions) {
        result = result.replace(placeholder, value);
      }

      expect(result).toBe('A_B_C');
      // Should be faster than sequential (3 * 20ms = 60ms)
      // With concurrent execution, should be around 20-30ms
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown key in fetchValue', async () => {
      const placeholder = '{{asyncMock:fetchValue:unknownKey}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);

      await expect(
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        })
      ).rejects.toThrow("AsyncMock plugin: key 'unknownKey' not found in mock data");
    });

    it('should throw error for invalid number conversion', async () => {
      const placeholder = '{{asyncMock:number:notANumber}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);

      await expect(
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        })
      ).rejects.toThrow("AsyncMock plugin: cannot convert 'notANumber' to number");
    });

    it('should throw error for unknown action', async () => {
      const placeholder = '{{asyncMock:unknownAction:arg}}';
      const parsed = parser.parse(placeholder);
      const plugin = registry.getPlugin(parsed.module);

      await expect(
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry
        })
      ).rejects.toThrow("AsyncMock plugin: unknown action 'unknownAction'");
    });
  });

  describe('Matcher creation', () => {
    it('should create matcher from async plugin', () => {
      const placeholder = '{{asyncMock:echo:test}}';
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
        expect(result.error).toContain('AsyncMock matcher');
      }
    });
  });
});
