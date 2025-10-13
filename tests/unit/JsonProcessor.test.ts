import { describe, it, expect, beforeEach } from 'vitest';
import { JsonProcessor } from '@/formats/JsonProcessor';
import { PlaceholderParser } from '@core/PlaceholderParser';
import { PluginRegistry } from '@core/PluginRegistry';
import { MockPlugin } from '@/plugins/MockPlugin';
import { ToNumberTransform, ToStringTransform, ToBooleanTransform } from '@/transforms';
import type { ProcessOptions } from '@core/types';

describe('JsonProcessor', () => {
  let processor: JsonProcessor;
  let parser: PlaceholderParser;
  let registry: PluginRegistry;

  beforeEach(() => {
    parser = new PlaceholderParser();
    registry = new PluginRegistry();

    // Register mock plugin and transforms
    registry.registerPlugin(new MockPlugin());
    registry.registerTransform(new ToNumberTransform());
    registry.registerTransform(new ToStringTransform());
    registry.registerTransform(new ToBooleanTransform());

    processor = new JsonProcessor(parser, registry);
  });

  const defaultOptions: ProcessOptions = {
    format: 'json',
    mode: 'generate'
  };

  describe('Type preservation', () => {
    it('should preserve number type for pure placeholder', async () => {
      const input = JSON.stringify({
        count: '{{mock:number:42}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(42);
      expect(typeof parsed.count).toBe('number');
    });

    it('should convert string to number via transform', async () => {
      const input = JSON.stringify({
        value: '{{mock:echo:123|toNumber}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.value).toBe(123);
      expect(typeof parsed.value).toBe('number');
    });

    it('should preserve boolean type', async () => {
      const input = JSON.stringify({
        active: '{{mock:echo:yes|toBoolean}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.active).toBe(true);
      expect(typeof parsed.active).toBe('boolean');
    });

    it('should preserve string type', async () => {
      const input = JSON.stringify({
        name: '{{mock:echo:John}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('John');
      expect(typeof parsed.name).toBe('string');
    });

    it('should handle multiple different types', async () => {
      const input = JSON.stringify({
        name: '{{mock:echo:Alice}}',
        age: '{{mock:echo:30|toNumber}}',
        active: '{{mock:echo:true|toBoolean}}',
        score: '{{mock:number:95}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Alice');
      expect(typeof parsed.name).toBe('string');

      expect(parsed.age).toBe(30);
      expect(typeof parsed.age).toBe('number');

      expect(parsed.active).toBe(true);
      expect(typeof parsed.active).toBe('boolean');

      expect(parsed.score).toBe(95);
      expect(typeof parsed.score).toBe('number');
    });
  });

  describe('String interpolation', () => {
    it('should keep string type when interpolating', async () => {
      const input = JSON.stringify({
        message: 'Hello {{mock:echo:World}}!'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.message).toBe('Hello World!');
      expect(typeof parsed.message).toBe('string');
    });

    it('should interpolate multiple placeholders', async () => {
      const input = JSON.stringify({
        text: '{{mock:echo:A}}_{{mock:echo:B}}_{{mock:echo:C}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.text).toBe('A_B_C');
      expect(typeof parsed.text).toBe('string');
    });

    it('should convert numbers to strings in interpolation', async () => {
      const input = JSON.stringify({
        label: 'Count: {{mock:number:42}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.label).toBe('Count: 42');
      expect(typeof parsed.label).toBe('string');
    });
  });

  describe('Nested structures', () => {
    it('should process nested objects', async () => {
      const input = JSON.stringify({
        user: {
          name: '{{mock:echo:Alice}}',
          age: '{{mock:number:25}}'
        }
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.user.name).toBe('Alice');
      expect(typeof parsed.user.name).toBe('string');
      expect(parsed.user.age).toBe(25);
      expect(typeof parsed.user.age).toBe('number');
    });

    it('should process arrays', async () => {
      const input = JSON.stringify({
        numbers: ['{{mock:number:1}}', '{{mock:number:2}}', '{{mock:number:3}}']
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.numbers).toEqual([1, 2, 3]);
      expect(typeof parsed.numbers[0]).toBe('number');
      expect(typeof parsed.numbers[1]).toBe('number');
      expect(typeof parsed.numbers[2]).toBe('number');
    });

    it('should process deeply nested structures', async () => {
      const input = JSON.stringify({
        level1: {
          level2: {
            level3: {
              value: '{{mock:number:99}}'
            }
          }
        }
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.level1.level2.level3.value).toBe(99);
      expect(typeof parsed.level1.level2.level3.value).toBe('number');
    });

    it('should process mixed arrays and objects', async () => {
      const input = JSON.stringify({
        items: [
          { id: '{{mock:number:1}}', name: '{{mock:echo:First}}' },
          { id: '{{mock:number:2}}', name: '{{mock:echo:Second}}' }
        ]
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.items[0].id).toBe(1);
      expect(typeof parsed.items[0].id).toBe('number');
      expect(parsed.items[0].name).toBe('First');

      expect(parsed.items[1].id).toBe(2);
      expect(typeof parsed.items[1].id).toBe('number');
      expect(parsed.items[1].name).toBe('Second');
    });
  });

  describe('Nested placeholders', () => {
    it('should resolve nested placeholders', async () => {
      const input = JSON.stringify({
        value: '{{mock:uppercase:{{mock:echo:hello}}}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.value).toBe('HELLO');
    });

    it('should resolve deeply nested placeholders with type conversion', async () => {
      const input = JSON.stringify({
        count: '{{mock:echo:{{mock:echo:42}}|toNumber}}'
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(42);
      expect(typeof parsed.count).toBe('number');
    });
  });

  describe('Edge cases', () => {
    it('should handle null values', async () => {
      const input = JSON.stringify({
        value: null
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.value).toBe(null);
    });

    it('should handle empty strings', async () => {
      const input = JSON.stringify({
        value: ''
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.value).toBe('');
    });

    it('should handle empty objects', async () => {
      const input = JSON.stringify({});

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({});
    });

    it('should handle empty arrays', async () => {
      const input = JSON.stringify({
        items: []
      });

      const result = await processor.process(input, defaultOptions);
      const parsed = JSON.parse(result);

      expect(parsed.items).toEqual([]);
    });
  });

  describe('Plugin filtering', () => {
    it('should only process included plugins', async () => {
      const input = JSON.stringify({
        value: '{{mock:echo:replaced}}'
      });

      const result = await processor.process(input, {
        ...defaultOptions,
        includePlugins: ['mock']
      });

      const parsed = JSON.parse(result);
      expect(parsed.value).toBe('replaced');
    });

    it('should skip excluded plugins', async () => {
      const input = JSON.stringify({
        value: '{{mock:echo:should-not-replace}}'
      });

      const result = await processor.process(input, {
        ...defaultOptions,
        excludePlugins: ['mock']
      });

      const parsed = JSON.parse(result);
      expect(parsed.value).toBe('{{mock:echo:should-not-replace}}');
    });

    it('should keep placeholder if plugin not in include list', async () => {
      const input = JSON.stringify({
        value: '{{mock:echo:test}}'
      });

      const result = await processor.process(input, {
        ...defaultOptions,
        includePlugins: ['otherPlugin']
      });

      const parsed = JSON.parse(result);
      expect(parsed.value).toBe('{{mock:echo:test}}');
    });
  });

  describe('Error handling', () => {
    it('should throw error with path information on failure', async () => {
      const input = JSON.stringify({
        user: {
          age: '{{mock:number:notANumber}}'
        }
      });

      await expect(processor.process(input, defaultOptions)).rejects.toThrow(
        /path "user\.age"/
      );
    });

    it('should throw error for unknown plugin', async () => {
      const input = JSON.stringify({
        value: '{{unknown:action:arg}}'
      });

      await expect(processor.process(input, defaultOptions)).rejects.toThrow(
        /Plugin 'unknown' not found/
      );
    });
  });

  describe('Context passing', () => {
    it('should pass context to plugins', async () => {
      // This test shows that context is passed through
      // The actual behavior depends on the plugin implementation
      const input = JSON.stringify({
        value: '{{mock:echo:test}}'
      });

      const result = await processor.process(input, {
        ...defaultOptions,
        context: {
          testContext: 'value'
        }
      });

      // Should not throw - context is passed but mock plugin doesn't use it
      expect(result).toBeDefined();
    });
  });
});
