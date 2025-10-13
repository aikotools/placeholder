import { describe, it, expect, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import { PlaceholderEngine } from '@core/PlaceholderEngine';
import { TimePlugin } from '@/plugins/TimePlugin';

/**
 * Integration tests for escaped colons in placeholders
 *
 * Tests the escape mechanism that allows colons in format strings:
 * - \: → : (escaped colon)
 */
describe('Escaped Colons Integration', () => {
  let engine: PlaceholderEngine;
  let baseTime: DateTime;

  beforeEach(() => {
    engine = new PlaceholderEngine();
    engine.registerPlugin(new TimePlugin());

    // Set up base time for predictable tests
    baseTime = DateTime.fromISO('2025-03-15T14:30:45.000Z', { zone: 'utc' });
  });

  describe('Time formatting with escaped colons', () => {
    it('should format time with HH:mm:ss using escaped colons', async () => {
      const template = JSON.stringify({
        time: '{{time:calc:0:HH\\:mm\\:ss}}'
      });

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.time).toBe('14:30:45');
      expect(typeof parsed.time).toBe('string');
    });

    it('should format datetime with escaped colons', async () => {
      const template = JSON.stringify({
        datetime: '{{time:calc:0:yyyy-MM-dd\\:HH\\:mm\\:ss}}'
      });

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.datetime).toBe('2025-03-15:14:30:45');
      expect(typeof parsed.datetime).toBe('string');
    });

    it('should handle multiple placeholders with escaped colons', async () => {
      const template = JSON.stringify({
        time1: '{{time:calc:0:HH\\:mm}}',
        time2: '{{time:calc:3600:HH\\:mm\\:ss}}',
        date: '{{time:calc:0:dd.MM.yyyy}}'
      });

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.time1).toBe('14:30');
      expect(parsed.time2).toBe('15:30:45');
      expect(parsed.date).toBe('15.03.2025');
    });

    it('should work in text format', async () => {
      const template = 'The time is {{time:calc:0:HH\\:mm\\:ss}}';

      const result = await engine.processGenerate(template, {
        format: 'text',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      expect(result).toBe('The time is 14:30:45');
    });

    it('should work with time:format action', async () => {
      const template = JSON.stringify({
        formatted: '{{time:format:1710508245:HH\\:mm\\:ss}}'
      });

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate'
      });

      const parsed = JSON.parse(result);

      // 1710508245 = 2024-03-15 13:10:45 UTC
      expect(parsed.formatted).toBe('13:10:45');
    });
  });

  describe('String interpolation with escaped colons', () => {
    it('should work in string interpolation', async () => {
      const template = JSON.stringify({
        filename: 'log_{{time:calc:0:yyyy-MM-dd\\:HH-mm-ss}}.txt'
      });

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.filename).toBe('log_2025-03-15:14-30-45.txt');
    });
  });

  describe('Real-world use cases', () => {
    it('should generate ISO-like timestamp format', async () => {
      const template = JSON.stringify({
        timestamp: '{{time:calc:0:yyyy-MM-dd\\:HH\\:mm\\:ss}}',
        modified: '{{time:calc:3600:yyyy-MM-dd\\:HH\\:mm\\:ss}}'
      });

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.timestamp).toBe('2025-03-15:14:30:45');
      expect(parsed.modified).toBe('2025-03-15:15:30:45');
    });

    it('should support log timestamp format', async () => {
      const template = '[{{time:calc:0:yyyy-MM-dd HH\\:mm\\:ss}}] INFO: Test completed';

      const result = await engine.processGenerate(template, {
        format: 'text',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      expect(result).toBe('[2025-03-15 14:30:45] INFO: Test completed');
    });
  });
});
