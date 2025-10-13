import { describe, it, expect, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import { PlaceholderEngine, TimePlugin, GeneratorPlugin, ToNumberTransform, ToStringTransform, ToBooleanTransform } from '../../src';

/**
 * End-to-End Integration Tests
 *
 * Tests the complete system with real plugins:
 * - PlaceholderEngine orchestration
 * - JsonProcessor with type preservation
 * - Real TimePlugin and GeneratorPlugin
 * - Transform pipeline
 * - Multi-phase processing (Gen → Time → Compare)
 */
describe('End-to-End Integration', () => {
  let engine: PlaceholderEngine;
  let baseTime: DateTime;

  beforeEach(() => {
    engine = new PlaceholderEngine();

    // Register real plugins
    engine.registerPlugin(new TimePlugin());
    engine.registerPlugin(new GeneratorPlugin());

    // Register transforms
    engine.registerTransforms([
      new ToNumberTransform(),
      new ToStringTransform(),
      new ToBooleanTransform()
    ]);

    // Set up base time for predictable tests
    baseTime = DateTime.fromISO('2025-03-15T12:00:00.000Z');
  });

  describe('Complete JSON processing with type preservation', () => {
    it('should process JSON with generator and time placeholders', async () => {
      const input = JSON.stringify({
        id: '{{gen:uuid:12345678-1234-1234-1234-123456789012}}',
        zugnummer: '{{gen:zugnummer:4837}}',
        timestamp: '{{time:calc:300:seconds}}',
        date: '{{time:calc:0:dd.MM.yyyy}}',
        active: '{{gen:boolean:true}}'
      });

      const result = await engine.processGenerate(input, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      // Check types are preserved
      expect(parsed.id).toBe('12345678-1234-1234-1234-123456789012');
      expect(typeof parsed.id).toBe('string');

      expect(parsed.zugnummer).toBe(4837);
      expect(typeof parsed.zugnummer).toBe('number');

      expect(parsed.timestamp).toBe(baseTime.plus({ seconds: 300 }).toSeconds());
      expect(typeof parsed.timestamp).toBe('number');

      expect(parsed.date).toBe('15.03.2025');
      expect(typeof parsed.date).toBe('string');

      expect(parsed.active).toBe(true);
      expect(typeof parsed.active).toBe('boolean');
    });

    it('should handle number type conversion with transforms', async () => {
      const input = JSON.stringify({
        count: '{{gen:string:42|toNumber}}',
        text: '{{gen:number:99|toString}}'
      });

      const result = await engine.processGenerate(input, {
        format: 'json',
        mode: 'generate'
      });

      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(42);
      expect(typeof parsed.count).toBe('number');

      expect(parsed.text).toBe('99');
      expect(typeof parsed.text).toBe('string');
    });

    it('should handle string interpolation with multiple placeholders', async () => {
      const input = JSON.stringify({
        filename: '{{gen:zugnummer:4837}}_RGE_{{time:calc:0:dd.MM.yyyy}}_{{gen:uuid:abc123}}_Start'
      });

      const result = await engine.processGenerate(input, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.filename).toBe('4837_RGE_15.03.2025_abc123_Start');
      expect(typeof parsed.filename).toBe('string');
    });

    it('should handle nested JSON structures', async () => {
      const input = JSON.stringify({
        train: {
          number: '{{gen:zugnummer:1234}}',
          departure: {
            station: 'Berlin',
            time: '{{time:calc:0:HH}}'
          }
        },
        metadata: {
          created: '{{time:calc:0:yyyy-MM-dd}}',
          version: '{{gen:number:1}}'
        }
      });

      const result = await engine.processGenerate(input, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.train.number).toBe(1234);
      expect(typeof parsed.train.number).toBe('number');

      expect(parsed.train.departure.time).toBe('12');
      expect(typeof parsed.train.departure.time).toBe('string');

      expect(parsed.metadata.created).toBe('2025-03-15');
      expect(parsed.metadata.version).toBe(1);
      expect(typeof parsed.metadata.version).toBe('number');
    });

    it('should handle arrays with placeholders', async () => {
      const input = JSON.stringify({
        timestamps: [
          '{{time:calc:0:seconds}}',
          '{{time:calc:60:seconds}}',
          '{{time:calc:120:seconds}}'
        ],
        ids: [
          '{{gen:number:1}}',
          '{{gen:number:2}}',
          '{{gen:number:3}}'
        ]
      });

      const result = await engine.processGenerate(input, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      // All should be numbers
      expect(parsed.timestamps.every((t: any) => typeof t === 'number')).toBe(true);
      expect(parsed.ids.every((id: any) => typeof id === 'number')).toBe(true);

      // Check values
      expect(parsed.timestamps[0]).toBe(baseTime.toSeconds());
      expect(parsed.timestamps[1]).toBe(baseTime.plus({ seconds: 60 }).toSeconds());
      expect(parsed.timestamps[2]).toBe(baseTime.plus({ seconds: 120 }).toSeconds());

      expect(parsed.ids).toEqual([1, 2, 3]);
    });
  });

  describe('Multi-phase processing (Gen → Time)', () => {
    it('should process only gen plugins when includePlugins is set', async () => {
      const input = JSON.stringify({
        zugnummer: '{{gen:zugnummer:9999}}',
        timestamp: '{{time:calc:300:seconds}}',
        text: 'static'
      });

      // Phase 1: Only gen
      const afterGen = await engine.processGenerate(input, {
        format: 'json',
        mode: 'generate',
        includePlugins: ['gen'],
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsedGen = JSON.parse(afterGen);

      expect(parsedGen.zugnummer).toBe(9999);
      expect(parsedGen.timestamp).toBe('{{time:calc:300:seconds}}'); // Not resolved yet
      expect(parsedGen.text).toBe('static');
    });

    it('should process gen then time in sequence', async () => {
      const input = JSON.stringify({
        id: '{{gen:number:42}}',
        timestamp: '{{time:calc:0:seconds}}'
      });

      // Phase 1: Gen
      const afterGen = await engine.processGenerate(input, {
        format: 'json',
        mode: 'generate',
        includePlugins: ['gen']
      });

      const parsedGen = JSON.parse(afterGen);
      expect(parsedGen.id).toBe(42);
      expect(parsedGen.timestamp).toBe('{{time:calc:0:seconds}}');

      // Phase 2: Time
      const afterTime = await engine.processGenerate(afterGen, {
        format: 'json',
        mode: 'generate',
        includePlugins: ['time'],
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsedTime = JSON.parse(afterTime);
      expect(parsedTime.id).toBe(42);
      expect(parsedTime.timestamp).toBe(baseTime.toSeconds());
      expect(typeof parsedTime.timestamp).toBe('number');
    });
  });

  describe('Text processing', () => {
    it('should process text with placeholders', async () => {
      const input = 'Train {{gen:zugnummer:4837}} departs at {{time:calc:0:HH}}';

      const result = await engine.processGenerate(input, {
        format: 'text',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      expect(result).toBe('Train 4837 departs at 12');
    });

    it('should handle multiple placeholders in text', async () => {
      const input = '{{gen:string:Hello}} {{gen:string:World}}!';

      const result = await engine.processGenerate(input, {
        format: 'text',
        mode: 'generate'
      });

      expect(result).toBe('Hello World!');
    });
  });

  describe('Real-world use cases', () => {
    it('should generate expected file for E2E test', async () => {
      // This simulates the user's original use case
      const expected = JSON.stringify({
        testId: '{{gen:uuid:test-12345}}',
        train: {
          number: '{{gen:zugnummer:4837}}',
          type: 'RGE'
        },
        timing: {
          startTime: '{{time:calc:0:seconds}}',
          endTime: '{{time:calc:300:seconds}}',
          date: '{{time:calc:0:dd.MM.yyyy}}'
        },
        metadata: {
          created: '{{time:calc:0:yyyy-MM-dd}}',
          version: '{{gen:number:1}}'
        }
      });

      const result = await engine.processGenerate(expected, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis(),
          testcaseId: 'TC-001'
        }
      });

      const parsed = JSON.parse(result);

      // Verify structure and types
      expect(parsed.testId).toBe('test-12345');
      expect(parsed.train.number).toBe(4837);
      expect(typeof parsed.train.number).toBe('number');
      expect(parsed.timing.startTime).toBe(baseTime.toSeconds());
      expect(typeof parsed.timing.startTime).toBe('number');
      expect(parsed.timing.endTime).toBe(baseTime.plus({ seconds: 300 }).toSeconds());
      expect(parsed.timing.date).toBe('15.03.2025');
      expect(parsed.metadata.version).toBe(1);
      expect(typeof parsed.metadata.version).toBe('number');
    });

    it('should support filename generation pattern', async () => {
      // Pattern: {{gen:zugnummer:4837}}_RGE_{{time:calc:0:dd.MM.yyyy}}_{{gen:uuid:638iejj39ej9}}_Start
      const input = JSON.stringify({
        filename: '{{gen:zugnummer:4837}}_RGE_{{time:calc:0:dd.MM.yyyy}}_{{gen:uuid:638iejj39ej9}}_Start'
      });

      const result = await engine.processGenerate(input, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.filename).toBe('4837_RGE_15.03.2025_638iejj39ej9_Start');
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown plugin', async () => {
      const input = JSON.stringify({
        value: '{{unknown:action:arg}}'
      });

      await expect(
        engine.processGenerate(input, {
          format: 'json',
          mode: 'generate'
        })
      ).rejects.toThrow(/Plugin 'unknown' not found/);
    });

    it('should throw error for invalid action', async () => {
      const input = JSON.stringify({
        value: '{{gen:invalid:arg}}'
      });

      await expect(
        engine.processGenerate(input, {
          format: 'json',
          mode: 'generate'
        })
      ).rejects.toThrow(/unknown action 'invalid'/);
    });
  });
});
