import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceholderParser } from '../../src/core/PlaceholderParser';

describe('PlaceholderParser', () => {
  let parser: PlaceholderParser;

  beforeEach(() => {
    parser = new PlaceholderParser();
  });

  describe('isPlaceholder', () => {
    it('should return true for valid placeholder', () => {
      expect(parser.isPlaceholder('{{gen:uuid}}')).toBe(true);
      expect(parser.isPlaceholder('{{time:calc:350:iso}}')).toBe(true);
      expect(parser.isPlaceholder('  {{gen:uuid}}  ')).toBe(true);
    });

    it('should return false for invalid placeholder', () => {
      expect(parser.isPlaceholder('not a placeholder')).toBe(false);
      expect(parser.isPlaceholder('{{incomplete')).toBe(false);
      expect(parser.isPlaceholder('incomplete}}')).toBe(false);
      expect(parser.isPlaceholder('{single}')).toBe(false);
    });
  });

  describe('findPlaceholders', () => {
    it('should find single placeholder', () => {
      const content = 'Hello {{gen:uuid:inst1}} world';
      const placeholders = parser.findPlaceholders(content);

      expect(placeholders).toEqual(['{{gen:uuid:inst1}}']);
    });

    it('should find multiple placeholders', () => {
      const content = '{{gen:uuid:inst1}}_{{time:calc:350:iso}}_End';
      const placeholders = parser.findPlaceholders(content);

      expect(placeholders).toHaveLength(2);
      expect(placeholders).toContain('{{gen:uuid:inst1}}');
      expect(placeholders).toContain('{{time:calc:350:iso}}');
    });

    it('should find nested placeholders', () => {
      const content = '{{compare:startsWith:{{time:calc:0:dd.MM.yyyy}}}}';
      const placeholders = parser.findPlaceholders(content);

      expect(placeholders).toContain('{{compare:startsWith:{{time:calc:0:dd.MM.yyyy}}}}');
      expect(placeholders).toContain('{{time:calc:0:dd.MM.yyyy}}');
    });

    it('should return empty array when no placeholders found', () => {
      const content = 'No placeholders here';
      const placeholders = parser.findPlaceholders(content);

      expect(placeholders).toEqual([]);
    });

    it('should deduplicate identical placeholders', () => {
      const content = '{{gen:uuid:inst1}} and {{gen:uuid:inst1}} again';
      const placeholders = parser.findPlaceholders(content);

      expect(placeholders).toHaveLength(1);
      expect(placeholders).toEqual(['{{gen:uuid:inst1}}']);
    });
  });

  describe('parse', () => {
    it('should parse simple placeholder', () => {
      const result = parser.parse('{{gen:uuid}}');

      expect(result).toEqual({
        original: '{{gen:uuid}}',
        module: 'gen',
        action: 'uuid',
        args: [],
        transforms: []
      });
    });

    it('should parse placeholder with single argument', () => {
      const result = parser.parse('{{gen:uuid:inst1}}');

      expect(result).toEqual({
        original: '{{gen:uuid:inst1}}',
        module: 'gen',
        action: 'uuid',
        args: ['inst1'],
        transforms: []
      });
    });

    it('should parse placeholder with multiple arguments', () => {
      const result = parser.parse('{{time:calc:350:iso}}');

      expect(result).toEqual({
        original: '{{time:calc:350:iso}}',
        module: 'time',
        action: 'calc',
        args: ['350', 'iso'],
        transforms: []
      });
    });

    it('should parse placeholder with single transform', () => {
      const result = parser.parse('{{gen:zugnummer:4837|toNumber}}');

      expect(result).toEqual({
        original: '{{gen:zugnummer:4837|toNumber}}',
        module: 'gen',
        action: 'zugnummer',
        args: ['4837'],
        transforms: [{ name: 'toNumber', params: [] }]
      });
    });

    it('should parse placeholder with multiple transforms', () => {
      const result = parser.parse('{{gen:value:test|toNumber|multiply:2}}');

      expect(result).toEqual({
        original: '{{gen:value:test|toNumber|multiply:2}}',
        module: 'gen',
        action: 'value',
        args: ['test'],
        transforms: [
          { name: 'toNumber', params: [] },
          { name: 'multiply', params: ['2'] }
        ]
      });
    });

    it('should parse transform with parameters', () => {
      const result = parser.parse('{{gen:value:test|round:2:up}}');

      expect(result).toEqual({
        original: '{{gen:value:test|round:2:up}}',
        module: 'gen',
        action: 'value',
        args: ['test'],
        transforms: [{ name: 'round', params: ['2', 'up'] }]
      });
    });

    it('should parse nested placeholder in args', () => {
      const result = parser.parse('{{compare:startsWith:{{time:calc:0:dd.MM.yyyy}}}}');

      expect(result).toEqual({
        original: '{{compare:startsWith:{{time:calc:0:dd.MM.yyyy}}}}',
        module: 'compare',
        action: 'startsWith',
        args: ['{{time:calc:0:dd.MM.yyyy}}'],
        transforms: []
      });
    });

    it('should handle whitespace', () => {
      const result = parser.parse('  {{ gen : uuid : inst1 }}  ');

      expect(result.module).toBe('gen');
      expect(result.action).toBe('uuid');
      expect(result.args).toEqual(['inst1']);
    });

    it('should throw error for invalid format', () => {
      expect(() => parser.parse('{{invalid}}')).toThrow('Invalid placeholder format');
      expect(() => parser.parse('not a placeholder')).toThrow('Invalid placeholder format');
    });

    it('should throw error for missing action', () => {
      expect(() => parser.parse('{{gen}}')).toThrow('Invalid placeholder format');
    });

    it('should parse escaped colons in arguments', () => {
      const result = parser.parse('{{time:calc:0:HH\\:mm\\:ss}}');

      expect(result).toEqual({
        original: '{{time:calc:0:HH\\:mm\\:ss}}',
        module: 'time',
        action: 'calc',
        args: ['0', 'HH:mm:ss'],
        transforms: []
      });
    });

    it('should parse multiple escaped colons', () => {
      const result = parser.parse('{{time:format:12345:yyyy-MM-dd\\:HH\\:mm\\:ss}}');

      expect(result).toEqual({
        original: '{{time:format:12345:yyyy-MM-dd\\:HH\\:mm\\:ss}}',
        module: 'time',
        action: 'format',
        args: ['12345', 'yyyy-MM-dd:HH:mm:ss'],
        transforms: []
      });
    });

    it('should handle mixed escaped and unescaped colons', () => {
      const result = parser.parse('{{module:action:arg1\\:with\\:colons:arg2}}');

      expect(result).toEqual({
        original: '{{module:action:arg1\\:with\\:colons:arg2}}',
        module: 'module',
        action: 'action',
        args: ['arg1:with:colons', 'arg2'],
        transforms: []
      });
    });
  });

  describe('replaceAll', () => {
    it('should replace single placeholder', () => {
      const content = 'Hello {{gen:uuid:inst1}} world';
      const result = parser.replaceAll(content, () => 'REPLACED');

      expect(result).toBe('Hello REPLACED world');
    });

    it('should replace multiple placeholders', () => {
      const content = '{{gen:uuid:1}}_{{time:calc:0:iso}}_End';
      let callCount = 0;

      const result = parser.replaceAll(content, () => {
        callCount++;
        return `REPLACED${callCount}`;
      });

      expect(result).toBe('REPLACED1_REPLACED2_End');
    });

    it('should replace nested placeholders from inside out', () => {
      const content = '{{compare:startsWith:{{time:calc:0:dd.MM.yyyy}}}}';
      const replacements: Record<string, string> = {
        '{{time:calc:0:dd.MM.yyyy}}': '15.03.2015',
        '{{compare:startsWith:{{time:calc:0:dd.MM.yyyy}}}}': 'COMPARE_RESULT',
        // After first replacement, the outer placeholder changes
        '{{compare:startsWith:15.03.2015}}': 'COMPARE_RESULT'
      };

      const result = parser.replaceAll(content, (ph) => replacements[ph] || ph);

      expect(result).toBe('COMPARE_RESULT');
    });

    it('should handle duplicate placeholders', () => {
      const content = '{{gen:uuid:1}} and {{gen:uuid:1}}';
      const result = parser.replaceAll(content, () => 'REPLACED');

      expect(result).toBe('REPLACED and REPLACED');
    });
  });
});
