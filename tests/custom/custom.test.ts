import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { DateTime } from 'luxon';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PlaceholderEngine } from '@core/PlaceholderEngine';
import { TimePlugin } from '@/plugins/TimePlugin';
import { GeneratorPlugin } from '@/plugins/GeneratorPlugin';
import { ToNumberTransform, ToStringTransform, ToBooleanTransform } from '@/transforms';
import { TrainPlugin } from './TrainPlugin';

/**
 * Custom Plugin Example - Real-World Usage
 *
 * This test demonstrates how users can extend the PlaceholderEngine
 * with their own custom plugins for domain-specific use cases.
 *
 * Key Learning Points:
 * 1. How to implement a custom PlaceholderPlugin
 * 2. How to register custom plugins with the engine
 * 3. How custom plugins work alongside built-in plugins
 * 4. Real-world train scheduling use case
 *
 * Structure:
 * - tests/custom/TrainPlugin.ts               - Custom plugin implementation
 * - tests/fixtures/custom/*.json              - Templates using custom plugin
 * - tests/fixtures/custom/*.expected.json     - Expected results
 * - tests/volatile/custom/*.json              - Generated results (gitignored)
 */
describe('Custom Plugin Example - TrainPlugin', () => {
  let engine: PlaceholderEngine;
  let baseTime: DateTime;

  const FIXTURES_DIR = path.join(__dirname, '../fixtures/custom');
  const VOLATILE_DIR = path.join(__dirname, '../volatile/custom');

  beforeAll(async () => {
    // Ensure volatile directory exists
    await fs.mkdir(VOLATILE_DIR, { recursive: true });
  });

  beforeEach(() => {
    // Setup engine with both built-in AND custom plugins
    engine = new PlaceholderEngine();

    // Register built-in plugins
    engine.registerPlugin(new TimePlugin());
    engine.registerPlugin(new GeneratorPlugin());

    // Register custom train plugin - this is what users would do!
    engine.registerPlugin(new TrainPlugin());

    // Register transforms
    engine.registerTransforms([
      new ToNumberTransform(),
      new ToStringTransform(),
      new ToBooleanTransform()
    ]);

    // Use fixed base time for predictable tests
    // 2025-03-15 12:00:00 UTC = 1742040000 seconds
    baseTime = DateTime.fromISO('2025-03-15T12:00:00.000Z', { zone: 'utc' });
  });

  describe('Train Schedule Example', () => {
    it('should process train-schedule.json with custom TrainPlugin', async () => {
      // 1. Load template
      const templatePath = path.join(FIXTURES_DIR, 'train-schedule.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      // 2. Process with engine (custom plugin is registered!)
      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      // 3. Write result
      const outputPath = path.join(VOLATILE_DIR, 'train-schedule.json');
      await fs.writeFile(outputPath, result, 'utf-8');

      // 4. Compare with expected
      const expectedPath = path.join(FIXTURES_DIR, 'train-schedule.expected.json');
      const expectedContent = await fs.readFile(expectedPath, 'utf-8');

      const generated = JSON.parse(result);
      const expected = JSON.parse(expectedContent);

      expect(generated).toEqual(expected);
    });

    it('should verify custom plugin values and types', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'train-schedule.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const data = JSON.parse(result);

      // Verify custom plugin generated correct values
      expect(data.train.designation).toBe('ICE 723'); // {{train:icenumber:723}}
      expect(data.train.type).toBe('ICE'); // {{train:type:ICE}}
      expect(data.route.departure.station).toBe('Berlin Hbf'); // {{train:station:Berlin Hbf}}
      expect(data.route.departure.platform).toBe(7); // {{train:platform:7}}
      expect(data.route.departure.delay).toBe(5); // {{train:delay:5}}

      // Verify types
      expect(typeof data.route.departure.platform).toBe('number');
      expect(typeof data.route.departure.delay).toBe('number');
      expect(typeof data.train.designation).toBe('string');
      expect(typeof data.metadata.createdAt).toBe('number');
      expect(typeof data.metadata.version).toBe('number');
    });
  });

  describe('Disruption Report Example', () => {
    it('should process disruption-report.json with custom TrainPlugin', async () => {
      // User workflow with custom plugin
      const templatePath = path.join(FIXTURES_DIR, 'disruption-report.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      // Save to volatile
      const outputPath = path.join(VOLATILE_DIR, 'disruption-report.json');
      await fs.writeFile(outputPath, result, 'utf-8');

      // Load expected
      const expectedPath = path.join(FIXTURES_DIR, 'disruption-report.expected.json');
      const expectedContent = await fs.readFile(expectedPath, 'utf-8');

      // Compare
      const generated = JSON.parse(result);
      const expected = JSON.parse(expectedContent);

      expect(generated).toEqual(expected);
    });

    it('should handle multiple train entries with custom plugin', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'disruption-report.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const data = JSON.parse(result);

      // Verify structure
      expect(data.trains).toHaveLength(3);
      expect(data.title).toBe('Verspätungsmeldung - ICE 517');

      // Check first train (ICE 517)
      expect(data.trains[0].trainNumber).toBe('ICE 517');
      expect(data.trains[0].type).toBe('ICE');
      expect(data.trains[0].delay).toBe(25);
      expect(data.trains[0].platform).toBe(12);

      // Check second train (ICE 891)
      expect(data.trains[1].trainNumber).toBe('ICE 891');
      expect(data.trains[1].type).toBe('IC');
      expect(data.trains[1].delay).toBe(12);

      // Check third train (ICE 234)
      expect(data.trains[2].trainNumber).toBe('ICE 234');
      expect(data.trains[2].delay).toBe(0);
      expect(data.trains[2].status).toBe('on-time');

      // Verify summary
      expect(data.summary.totalTrains).toBe(3);
      expect(data.summary.delayedTrains).toBe(2);
      expect(data.summary.averageDelay).toBe(12);
    });
  });

  describe('Plugin Integration', () => {
    it('should demonstrate mixed usage of built-in and custom plugins', async () => {
      // Create a template that uses BOTH built-in and custom plugins
      const mixedTemplate = {
        testId: '{{gen:uuid:mixed-test-001}}', // Built-in GeneratorPlugin
        timestamp: '{{time:calc:0:seconds}}', // Built-in TimePlugin
        train: {
          number: '{{train:icenumber:999}}', // Custom TrainPlugin
          platform: '{{train:platform:11}}', // Custom TrainPlugin
          delay: '{{train:delay:8}}' // Custom TrainPlugin
        },
        metadata: {
          generatedAt: '{{time:calc:0:yyyy-MM-dd HH\\:mm\\:ss}}', // Built-in TimePlugin
          enabled: '{{gen:boolean:true}}' // Built-in GeneratorPlugin
        }
      };

      const templateString = JSON.stringify(mixedTemplate, null, 2);

      const result = await engine.processGenerate(templateString, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const output = JSON.parse(result);

      // Verify built-in plugins worked
      expect(output.testId).toBe('mixed-test-001');
      expect(output.timestamp).toBe(1742040000);
      expect(output.metadata.enabled).toBe(true);

      // Verify custom plugin worked
      expect(output.train.number).toBe('ICE 999');
      expect(output.train.platform).toBe(11);
      expect(output.train.delay).toBe(8);

      // Verify types
      expect(typeof output.timestamp).toBe('number');
      expect(typeof output.train.platform).toBe('number');
      expect(typeof output.train.delay).toBe('number');
      expect(typeof output.metadata.enabled).toBe('boolean');
    });

    it('should handle custom plugin errors gracefully', async () => {
      // Test with invalid action
      const invalidTemplate = '{"test": "{{train:invalid}}"}';

      await expect(
        engine.processGenerate(invalidTemplate, {
          format: 'json',
          mode: 'generate',
          context: {}
        })
      ).rejects.toThrow(
        "Train plugin: unknown action 'invalid'. Available: icenumber, platform, delay, station, type"
      );
    });
  });

  describe('User Workflow Documentation', () => {
    it('should document the complete custom plugin workflow', async () => {
      /**
       * Step-by-Step Guide for Users:
       *
       * 1. CREATE YOUR CUSTOM PLUGIN
       *    - Implement the PlaceholderPlugin interface
       *    - Define your plugin name and actions
       *    - Implement the resolve() method
       *    - Return PlaceholderResult with value and type
       *
       * 2. REGISTER YOUR PLUGIN
       *    - Create a new PlaceholderEngine instance
       *    - Call engine.registerPlugin(new YourCustomPlugin())
       *    - Your plugin is now available alongside built-in plugins
       *
       * 3. USE YOUR PLUGIN IN TEMPLATES
       *    - Use syntax: {{yourplugin:action:args}}
       *    - Mix with built-in plugins as needed
       *    - Apply transforms if needed: {{yourplugin:action:args|transform}}
       *
       * 4. PROCESS TEMPLATES
       *    - Call engine.processGenerate() as usual
       *    - Your custom placeholders will be resolved
       *    - Types are preserved (number, string, boolean)
       */

      // Example: User creates their own plugin and uses it
      const customEngine = new PlaceholderEngine();

      // Register built-in plugins
      customEngine.registerPlugin(new TimePlugin());
      customEngine.registerPlugin(new GeneratorPlugin());

      // Register CUSTOM plugin - this is the key step!
      customEngine.registerPlugin(new TrainPlugin());

      // Now use it in a template
      const userTemplate = {
        myTrain: '{{train:icenumber:555}}',
        departure: '{{time:calc:0:HH\\:mm}}'
      };

      const result = await customEngine.processGenerate(
        JSON.stringify(userTemplate),
        {
          format: 'json',
          mode: 'generate',
          context: {
            startTimeTest: baseTime.toMillis()
          }
        }
      );

      const output = JSON.parse(result);

      expect(output.myTrain).toBe('ICE 555');
      expect(output.departure).toBe('12:00');
    });
  });
});
