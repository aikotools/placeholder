import { describe, it, expect, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import { TimePlugin } from '@/plugins/TimePlugin';
import { PlaceholderParser } from '@core/PlaceholderParser';

describe('TimePlugin', () => {
  let plugin: TimePlugin;
  let parser: PlaceholderParser;

  beforeEach(() => {
    plugin = new TimePlugin();
    parser = new PlaceholderParser();
  });

  describe('Basic functionality', () => {
    it('should have correct name', () => {
      expect(plugin.name).toBe('time');
    });

    it('should throw error for unknown action', () => {
      const parsed = parser.parse('{{time:unknown:arg}}');

      expect(() =>
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry: null
        })
      ).toThrow("Time plugin: unknown action 'unknown'");
    });
  });

  describe('calc action with time units', () => {
    const baseTime = DateTime.fromISO('2025-03-15T12:00:00.000Z');
    const baseTimestamp = baseTime.toMillis();

    it('should calculate seconds offset', () => {
      const parsed = parser.parse('{{time:calc:300:seconds}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.type).toBe('number');
      expect(result.value).toBe(baseTime.plus({ seconds: 300 }).toSeconds());
      expect(typeof result.value).toBe('number');
    });

    it('should calculate negative offset', () => {
      const parsed = parser.parse('{{time:calc:-60:seconds}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.type).toBe('number');
      expect(result.value).toBe(baseTime.plus({ seconds: -60 }).toSeconds());
    });

    it('should calculate minutes offset', () => {
      const parsed = parser.parse('{{time:calc:5:minutes}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.type).toBe('number');
      expect(result.value).toBe(Math.floor(baseTime.plus({ minutes: 5 }).toSeconds()));
    });

    it('should calculate hours offset', () => {
      const parsed = parser.parse('{{time:calc:2:hours}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.type).toBe('number');
      expect(result.value).toBe(Math.floor(baseTime.plus({ hours: 2 }).toSeconds()));
    });

    it('should calculate days offset', () => {
      const parsed = parser.parse('{{time:calc:7:days}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.type).toBe('number');
      expect(result.value).toBe(Math.floor(baseTime.plus({ days: 7 }).toSeconds()));
    });

    it('should handle zero offset', () => {
      const parsed = parser.parse('{{time:calc:0:seconds}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.value).toBe(baseTime.toSeconds());
    });

    it('should use startTimeScript if startTimeTest not available', () => {
      const parsed = parser.parse('{{time:calc:0:seconds}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeScript: baseTimestamp }
      });

      expect(result.value).toBe(baseTime.toSeconds());
    });

    it('should prefer startTimeTest over startTimeScript', () => {
      const testTime = DateTime.fromISO('2025-01-01T00:00:00.000Z');
      const scriptTime = DateTime.fromISO('2025-12-31T23:59:59.000Z');

      const parsed = parser.parse('{{time:calc:0:seconds}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: {
          startTimeTest: testTime.toMillis(),
          startTimeScript: scriptTime.toMillis()
        }
      });

      expect(result.value).toBe(testTime.toSeconds());
    });
  });

  describe('calc action with date formatting', () => {
    const baseTime = DateTime.fromISO('2025-03-15T14:30:45.000Z', { zone: 'utc' });
    const baseTimestamp = baseTime.toMillis();

    it('should format with no offset', () => {
      const parsed = parser.parse('{{time:calc:0:dd.MM.yyyy}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.type).toBe('string');
      expect(result.value).toBe(baseTime.toFormat('dd.MM.yyyy'));
    });

    it('should format with positive offset (seconds)', () => {
      const parsed = parser.parse('{{time:calc:3600:dd.MM.yyyy HH}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      const expected = baseTime.plus({ seconds: 3600 }).toFormat('dd.MM.yyyy HH');
      expect(result.value).toBe(expected);
    });

    it('should format with negative offset', () => {
      const parsed = parser.parse('{{time:calc:-86400:yyyy-MM-dd}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      const expected = baseTime.plus({ seconds: -86400 }).toFormat('yyyy-MM-dd');
      expect(result.value).toBe(expected);
    });

    it('should support various date formats', () => {
      const parsed = parser.parse('{{time:calc:0:yyyy-MM-dd HH}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}$/);
    });

    it('should support time-only format', () => {
      const parsed = parser.parse('{{time:calc:0:HH}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.value).toBe(baseTime.toFormat('HH'));
    });

    it('should support escaped colons in format string', () => {
      const parsed = parser.parse('{{time:calc:0:HH\\:mm\\:ss}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.type).toBe('string');
      expect(result.value).toBe(baseTime.toFormat('HH:mm:ss'));
    });

    it('should support complex format with escaped colons', () => {
      const parsed = parser.parse('{{time:calc:0:yyyy-MM-dd\\:HH\\:mm\\:ss}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: baseTimestamp }
      });

      expect(result.value).toBe(baseTime.toFormat('yyyy-MM-dd:HH:mm:ss'));
    });
  });

  describe('format action', () => {
    it('should format Unix timestamp in seconds', () => {
      const timestamp = 1710508245; // 2024-03-15 14:30:45 UTC
      const parsed = parser.parse('{{time:format:1710508245:dd.MM.yyyy}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: {}
      });

      expect(result.type).toBe('string');
      expect(result.value).toBe('15.03.2024');
    });

    it('should format Unix timestamp in milliseconds', () => {
      const timestamp = 1710508245000; // 2024-03-15 13:10:45 UTC
      const parsed = parser.parse('{{time:format:1710508245000:dd.MM.yyyy HH}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: {}
      });

      expect(result.value).toBe('15.03.2024 13');
    });

    it('should support various formats in format action', () => {
      const timestamp = 1710508245;
      const parsed = parser.parse('{{time:format:1710508245:yyyy-MM-dd}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: {}
      });

      expect(result.value).toBe('2024-03-15');
    });
  });

  describe('Context time parsing', () => {
    it('should parse ISO string from context', () => {
      const isoString = '2025-03-15T12:00:00.000Z';
      const parsed = parser.parse('{{time:calc:0:dd.MM.yyyy}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: isoString }
      });

      expect(result.value).toBe('15.03.2025');
    });

    it('should parse timestamp string from context', () => {
      const timestampString = '1710504000000';
      const parsed = parser.parse('{{time:calc:0:dd.MM.yyyy}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: timestampString }
      });

      const dt = DateTime.fromMillis(parseInt(timestampString, 10), { zone: 'utc' });
      expect(result.value).toBe(dt.toFormat('dd.MM.yyyy'));
    });

    it('should parse numeric timestamp from context', () => {
      const timestamp = 1710504000000;
      const parsed = parser.parse('{{time:calc:0:dd.MM.yyyy}}');

      const result = plugin.resolve({
        placeholder: parsed,
        context: { startTimeTest: timestamp }
      });

      const dt = DateTime.fromMillis(timestamp, { zone: 'utc' });
      expect(result.value).toBe(dt.toFormat('dd.MM.yyyy'));
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid offset', () => {
      const parsed = parser.parse('{{time:calc:invalid:seconds}}');

      expect(() =>
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry: null
        })
      ).toThrow("Time plugin calc: invalid offset 'invalid'");
    });

    it('should throw error for missing arguments in calc', () => {
      const parsed = parser.parse('{{time:calc:300}}');

      expect(() =>
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry: null
        })
      ).toThrow('Time plugin calc: requires 2 arguments');
    });

    it('should throw error for missing arguments in format', () => {
      const parsed = parser.parse('{{time:format:1234567890}}');

      expect(() =>
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry: null
        })
      ).toThrow('Time plugin format: requires 2 arguments');
    });

    it('should throw error for invalid timestamp in format', () => {
      const parsed = parser.parse('{{time:format:invalid:dd.MM.yyyy}}');

      expect(() =>
        plugin.resolve({
          placeholder: parsed,
          context: {},
          registry: null
        })
      ).toThrow("Time plugin format: invalid timestamp 'invalid'");
    });

    it('should throw error for invalid context time', () => {
      const parsed = parser.parse('{{time:calc:0:dd.MM.yyyy}}');

      expect(() =>
        plugin.resolve({
          placeholder: parsed,
          context: { startTimeTest: 'not-a-valid-time' },
          registry: null
        })
      ).toThrow("Time plugin: cannot parse time value 'not-a-valid-time'");
    });
  });

  describe('Matcher creation', () => {
    it('should create matcher (placeholder for Phase 8)', () => {
      const parsed = parser.parse('{{time:calc:300:seconds}}');

      if (plugin.createMatcher) {
        const matcher = plugin.createMatcher({
          placeholder: parsed,
          context: {},
          registry: null
        });

        const result = matcher.match(1234567890, 1234567890, {
          path: [],
          actual: 1234567890,
          expected: 1234567890
        });

        expect(result.success).toBe(true);
        expect(result.error).toContain('Time matcher');
      }
    });
  });
});
