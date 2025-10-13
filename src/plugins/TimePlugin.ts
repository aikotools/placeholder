import { DateTime, Duration } from 'luxon';
import type { PlaceholderPlugin } from './PlaceholderPlugin';
import type { PluginResolveRequest, PluginMatcherRequest, PlaceholderResult } from '../core/types';
import type { Matcher } from '../compare/Matcher';

/**
 * Time Plugin for date/time calculations and formatting
 *
 * Supports two main actions:
 * 1. calc - Calculate time relative to a base time
 * 2. format - Format a timestamp
 *
 * Base time is taken from context (startTimeTest or startTimeScript)
 *
 * Examples:
 * - {{time:calc:300:seconds}} → Timestamp 300 seconds after base time (as number)
 * - {{time:calc:0:dd.MM.yyyy}} → Current time formatted as "15.03.2025"
 * - {{time:calc:-1:hours}} → 1 hour before base time
 * - {{time:format:1234567890:dd.MM.yyyy HH:mm}} → Format Unix timestamp
 *
 * Supported units: milliseconds, seconds, minutes, hours, days, weeks, months, years
 */
export class TimePlugin implements PlaceholderPlugin {
  readonly name = 'time';

  resolve(request: PluginResolveRequest): PlaceholderResult {
    const { action, args } = request.placeholder;

    switch (action) {
      case 'calc':
        return this.handleCalc(args, request.context);

      case 'format':
        return this.handleFormat(args);

      default:
        throw new Error(`Time plugin: unknown action '${action}'. Available: calc, format`);
    }
  }

  /**
   * Handle time calculation
   *
   * Args:
   * - offset: Number (e.g., 300, -60)
   * - unit/format: Either time unit (seconds, hours) or date format (dd.MM.yyyy)
   *
   * @param args - Placeholder arguments
   * @param context - Processing context with base time
   * @returns Result with Unix timestamp in seconds (for units) or formatted date string
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleCalc(args: string[], context: Record<string, any>): PlaceholderResult {
    if (args.length < 2) {
      throw new Error('Time plugin calc: requires 2 arguments (offset, unit/format)');
    }

    const offset = parseFloat(args[0]);
    if (isNaN(offset)) {
      throw new Error(`Time plugin calc: invalid offset '${args[0]}'`);
    }

    const unitOrFormat = args[1];

    // Get base time from context
    const baseTime = this.getBaseTime(context);

    // Check if second argument is a time unit or a date format
    if (this.isTimeUnit(unitOrFormat)) {
      // Return Unix timestamp in SECONDS (consistent for all time units)
      return this.calculateTimestamp(baseTime, offset, unitOrFormat);
    } else {
      // Return formatted date string
      return this.calculateAndFormat(baseTime, offset, unitOrFormat);
    }
  }

  /**
   * Handle time formatting
   *
   * Args:
   * - timestamp: Unix timestamp (milliseconds or seconds)
   * - format: Date format string (dd.MM.yyyy HH)
   *
   * @param args - Placeholder arguments
   * @returns Formatted date string
   */
  private handleFormat(args: string[]): PlaceholderResult {
    if (args.length < 2) {
      throw new Error('Time plugin format: requires 2 arguments (timestamp, format)');
    }

    const timestamp = parseFloat(args[0]);
    if (isNaN(timestamp)) {
      throw new Error(`Time plugin format: invalid timestamp '${args[0]}'`);
    }

    const format = args[1];

    // Detect if timestamp is in seconds (< 10 billion) or milliseconds
    const isSeconds = timestamp < 10000000000;
    const dt = isSeconds
      ? DateTime.fromSeconds(timestamp, { zone: 'utc' })
      : DateTime.fromMillis(timestamp, { zone: 'utc' });

    const formatted = dt.toFormat(format);

    return {
      value: formatted,
      type: 'string',
    };
  }

  /**
   * Get base time from context
   *
   * Priority: startTimeTest > startTimeScript > current time
   * Always returns time in UTC
   *
   * @param context - Processing context
   * @returns Base DateTime in UTC
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getBaseTime(context: Record<string, any>): DateTime {
    // Try startTimeTest first
    if (context.startTimeTest) {
      return this.parseContextTime(context.startTimeTest);
    }

    // Try startTimeScript
    if (context.startTimeScript) {
      return this.parseContextTime(context.startTimeScript);
    }

    // Default to current time in UTC
    return DateTime.utc();
  }

  /**
   * Parse time from context (can be ISO string or Unix timestamp)
   *
   * @param value - Time value from context
   * @returns Parsed DateTime
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseContextTime(value: any): DateTime {
    if (typeof value === 'string') {
      // Try parsing as ISO string
      const dt = DateTime.fromISO(value);
      if (dt.isValid) return dt;

      // Try parsing as number string
      const num = parseFloat(value);
      if (!isNaN(num)) {
        const isSeconds = num < 10000000000;
        return isSeconds
          ? DateTime.fromSeconds(num, { zone: 'utc' })
          : DateTime.fromMillis(num, { zone: 'utc' });
      }
    } else if (typeof value === 'number') {
      const isSeconds = value < 10000000000;
      return isSeconds
        ? DateTime.fromSeconds(value, { zone: 'utc' })
        : DateTime.fromMillis(value, { zone: 'utc' });
    }

    throw new Error(`Time plugin: cannot parse time value '${value}'`);
  }

  /**
   * Check if string is a valid time unit
   *
   * @param unit - Unit string
   * @returns True if valid time unit
   */
  private isTimeUnit(unit: string): boolean {
    const validUnits = [
      'milliseconds',
      'seconds',
      'minutes',
      'hours',
      'days',
      'weeks',
      'months',
      'years',
    ];
    return validUnits.includes(unit.toLowerCase());
  }

  /**
   * Calculate timestamp with offset
   *
   * Always returns Unix timestamp in SECONDS for consistency.
   *
   * @param baseTime - Base DateTime
   * @param offset - Offset value
   * @param unit - Time unit
   * @returns Unix timestamp in seconds
   */
  private calculateTimestamp(baseTime: DateTime, offset: number, unit: string): PlaceholderResult {
    const unitLower = unit.toLowerCase();

    // Create duration based on unit
    const duration = Duration.fromObject({ [unitLower]: offset });

    // Add duration to base time
    const resultTime = baseTime.plus(duration);

    // Always return Unix timestamp in SECONDS (consistent for all units)
    const value = Math.floor(resultTime.toSeconds());

    return {
      value,
      type: 'number',
    };
  }

  /**
   * Calculate time and format as string
   *
   * The offset is interpreted as seconds when formatting
   *
   * @param baseTime - Base DateTime
   * @param offset - Offset in seconds
   * @param format - Date format string
   * @returns Formatted date string
   */
  private calculateAndFormat(
    baseTime: DateTime,
    offset: number,
    format: string
  ): PlaceholderResult {
    // Interpret offset as seconds for date formatting
    const duration = Duration.fromObject({ seconds: offset });
    const resultTime = baseTime.plus(duration);

    const formatted = resultTime.toFormat(format);

    return {
      value: formatted,
      type: 'string',
    };
  }

  /**
   * Create matcher for compare mode
   *
   * Will be fully implemented in Phase 8 (Time-Compare matchers)
   */
  createMatcher?(request: PluginMatcherRequest): Matcher {
    const { action, args } = request.placeholder;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      match: (_actual: any, _expected: any, _context: any) => {
        return {
          success: true,
          error: `Time matcher for action '${action}' with args [${args.join(', ')}] - not yet implemented`,
        };
      },
    };
  }
}
