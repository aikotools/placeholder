import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { DateTime } from 'luxon';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PlaceholderEngine, TimePlugin, GeneratorPlugin, ToNumberTransform, ToStringTransform, ToBooleanTransform } from '../../src';

/**
 * Example Test - Real-World Usage
 *
 * This test demonstrates how a user would use the PlaceholderEngine:
 * 1. Load template files from fixtures
 * 2. Process them with the engine
 * 3. Write results to volatile directory
 * 4. Compare with expected results
 *
 * Structure:
 * - tests/fixtures/example/*.json           - Templates with placeholders
 * - tests/fixtures/example/*.expected.json  - Expected results
 * - tests/volatile/example/*.json           - Generated results (gitignored)
 */
describe('Example - Real-World Usage', () => {
  let engine: PlaceholderEngine;
  let baseTime: DateTime;

  const FIXTURES_DIR = path.join(__dirname, '../fixtures/example');
  const VOLATILE_DIR = path.join(__dirname, '../volatile/example');

  beforeAll(async () => {
    // Ensure volatile directory exists
    await fs.mkdir(VOLATILE_DIR, { recursive: true });
  });

  beforeEach(() => {
    // Setup engine like a user would
    engine = new PlaceholderEngine();
    engine.registerPlugin(new TimePlugin());
    engine.registerPlugin(new GeneratorPlugin());

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

  describe('Train Departure Example', () => {
    it('should process train-departure.json template', async () => {
      // 1. Load template from fixtures (like a user would)
      const templatePath = path.join(FIXTURES_DIR, 'train-departure.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      // 2. Process with engine (user workflow)
      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      // 3. Write result to volatile directory (like a user would save output)
      const outputPath = path.join(VOLATILE_DIR, 'train-departure.json');
      await fs.writeFile(outputPath, result, 'utf-8');

      // 4. Load expected result
      const expectedPath = path.join(FIXTURES_DIR, 'train-departure.expected.json');
      const expectedContent = await fs.readFile(expectedPath, 'utf-8');

      // 5. Compare
      const generated = JSON.parse(result);
      const expected = JSON.parse(expectedContent);

      expect(generated).toEqual(expected);

      // Additional type checks
      expect(typeof generated.train.number).toBe('number');
      expect(typeof generated.departure.platform).toBe('number');
      expect(typeof generated.departure.scheduledTime).toBe('number');
      expect(typeof generated.passengers.vip).toBe('boolean');
      expect(typeof generated.metadata.version).toBe('number');
    });

    it('should have correct structure and values', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'train-departure.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const data = JSON.parse(result);

      // Check structure
      expect(data).toHaveProperty('testId');
      expect(data).toHaveProperty('train');
      expect(data).toHaveProperty('departure');
      expect(data).toHaveProperty('arrival');
      expect(data).toHaveProperty('passengers');
      expect(data).toHaveProperty('metadata');
      expect(data).toHaveProperty('checkpoints');

      // Check specific values
      expect(data.testId).toBe('test-train-departure-001');
      expect(data.train.number).toBe(4837);
      expect(data.departure.date).toBe('15.03.2025');
      expect(data.departure.time).toBe('12:00:00');
      expect(data.arrival.estimatedTimeFormatted).toBe('13:30:00');

      // Check timestamps
      expect(data.departure.scheduledTime).toBe(1742040000);
      expect(data.departure.actualTime).toBe(1742040120);
      expect(data.arrival.estimatedTime).toBe(1742045400);

      // Check arrays
      expect(data.passengers.manifest).toHaveLength(3);
      expect(data.checkpoints).toHaveLength(3);

      // Check filename generation with string interpolation
      expect(data.filename).toBe('train_4837_2025-03-15_run-12345.json');
    });
  });

  describe('Test Report Example', () => {
    it('should process test-report.json template', async () => {
      // User workflow
      const templatePath = path.join(FIXTURES_DIR, 'test-report.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      // Save to volatile
      const outputPath = path.join(VOLATILE_DIR, 'test-report.json');
      await fs.writeFile(outputPath, result, 'utf-8');

      // Load expected
      const expectedPath = path.join(FIXTURES_DIR, 'test-report.expected.json');
      const expectedContent = await fs.readFile(expectedPath, 'utf-8');

      // Compare
      const generated = JSON.parse(result);
      const expected = JSON.parse(expectedContent);

      expect(generated).toEqual(expected);

      // Type checks
      expect(typeof generated.statistics.totalTests).toBe('number');
      expect(typeof generated.statistics.successRate).toBe('number');
      expect(typeof generated.statistics.enabled).toBe('boolean');
      expect(typeof generated.environment.build).toBe('number');
    });

    it('should handle transform pipeline', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'test-report.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const data = JSON.parse(result);

      // Check that toNumber transform worked
      expect(data.statistics.successRate).toBe(96.7);
      expect(typeof data.statistics.successRate).toBe('number');
    });

    it('should handle complex time formatting', async () => {
      const templatePath = path.join(FIXTURES_DIR, 'test-report.json');
      const template = await fs.readFile(templatePath, 'utf-8');

      const result = await engine.processGenerate(template, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      const data = JSON.parse(result);

      // Check escaped colons in time format
      expect(data.report.generated).toBe('2025-03-15:12:00:00');
      expect(data.testRun.startTimeFormatted).toBe('12:00:00');
      expect(data.testRun.endTimeFormatted).toBe('13:00:00');

      // Check artifact filenames with complex patterns
      expect(data.artifacts.logFile).toBe('test-run_2025-03-15_testrun-001.log');
      expect(data.artifacts.reportFile).toBe('report_2025-03-15:12-00-00.html');
    });
  });

  describe('Multi-File Processing', () => {
    it('should process all templates in fixtures directory', async () => {
      // Get all .json files (not .expected.json)
      const files = await fs.readdir(FIXTURES_DIR);
      const templateFiles = files.filter(f =>
        f.endsWith('.json') && !f.endsWith('.expected.json')
      );

      expect(templateFiles.length).toBeGreaterThan(0);

      // Process all templates
      for (const file of templateFiles) {
        const templatePath = path.join(FIXTURES_DIR, file);
        const template = await fs.readFile(templatePath, 'utf-8');

        const result = await engine.processGenerate(template, {
          format: 'json',
          mode: 'generate',
          context: {
            startTimeTest: baseTime.toMillis()
          }
        });

        // Write to volatile
        const outputPath = path.join(VOLATILE_DIR, file);
        await fs.writeFile(outputPath, result, 'utf-8');

        // Verify it's valid JSON
        const parsed = JSON.parse(result);
        expect(parsed).toBeDefined();
      }
    });
  });

  describe('User Workflow Simulation', () => {
    it('should simulate typical user workflow', async () => {
      // Step 1: User creates a template with placeholders
      const userTemplate = {
        testId: '{{gen:uuid:my-test}}',
        timestamp: '{{time:calc:0:seconds}}',
        data: {
          value: '{{gen:number:42}}',
          enabled: '{{gen:boolean:true}}'
        }
      };

      // Step 2: User converts to string
      const templateString = JSON.stringify(userTemplate, null, 2);

      // Step 3: User processes with engine
      const result = await engine.processGenerate(templateString, {
        format: 'json',
        mode: 'generate',
        context: {
          startTimeTest: baseTime.toMillis()
        }
      });

      // Step 4: User gets result
      const output = JSON.parse(result);

      // Verify
      expect(output.testId).toBe('my-test');
      expect(output.timestamp).toBe(1742040000);
      expect(output.data.value).toBe(42);
      expect(output.data.enabled).toBe(true);

      // Types are preserved
      expect(typeof output.timestamp).toBe('number');
      expect(typeof output.data.value).toBe('number');
      expect(typeof output.data.enabled).toBe('boolean');
    });
  });
});
