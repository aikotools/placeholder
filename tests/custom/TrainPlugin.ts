import type { PlaceholderPlugin, PluginResolveRequest, PlaceholderResult } from '../../src';

/**
 * Custom Train Plugin - Example Implementation
 *
 * This demonstrates how users can create their own custom plugins
 * for domain-specific placeholder generation.
 *
 * Supported actions:
 * - {{train:icenumber}} - Generate ICE train number (e.g., ICE 123)
 * - {{train:icenumber:789}} - Fixed ICE train number
 * - {{train:platform}} - Random platform 1-12
 * - {{train:platform:5}} - Fixed platform number
 * - {{train:delay}} - Random delay 0-30 minutes
 * - {{train:delay:15}} - Fixed delay in minutes
 * - {{train:station:start}} - Start station from predefined list
 * - {{train:station:end}} - End station from predefined list
 * - {{train:type}} - Train type (ICE, IC, RE, RB, S)
 * - {{train:type:ICE}} - Fixed train type
 */
export class TrainPlugin implements PlaceholderPlugin {
  readonly name = 'train';

  private readonly startStations = [
    'Berlin Hbf',
    'München Hbf',
    'Hamburg Hbf',
    'Frankfurt Hbf',
    'Köln Hbf'
  ];

  private readonly endStations = [
    'Stuttgart Hbf',
    'Dresden Hbf',
    'Hannover Hbf',
    'Leipzig Hbf',
    'Bremen Hbf'
  ];

  private readonly trainTypes = ['ICE', 'IC', 'RE', 'RB', 'S'];

  resolve(request: PluginResolveRequest): PlaceholderResult {
    const { action, args } = request.placeholder;

    switch (action) {
      case 'icenumber':
        return this.handleIceNumber(args);

      case 'platform':
        return this.handlePlatform(args);

      case 'delay':
        return this.handleDelay(args);

      case 'station':
        return this.handleStation(args);

      case 'type':
        return this.handleType(args);

      default:
        throw new Error(
          `Train plugin: unknown action '${action}'. Available: icenumber, platform, delay, station, type`
        );
    }
  }

  /**
   * Generate ICE train number
   * {{train:icenumber}} - Random 3-digit number
   * {{train:icenumber:789}} - Fixed number
   */
  private handleIceNumber(args: string[]): PlaceholderResult {
    let number: number;

    if (args.length > 0 && args[0]) {
      number = parseInt(args[0], 10);
      if (isNaN(number)) {
        throw new Error(`Train plugin icenumber: invalid number '${args[0]}'`);
      }
    } else {
      // Random 3-digit number
      number = Math.floor(Math.random() * 900) + 100;
    }

    return {
      value: `ICE ${number}`,
      type: 'string'
    };
  }

  /**
   * Generate platform number
   * {{train:platform}} - Random 1-12
   * {{train:platform:5}} - Fixed platform
   */
  private handlePlatform(args: string[]): PlaceholderResult {
    let platform: number;

    if (args.length > 0 && args[0]) {
      platform = parseInt(args[0], 10);
      if (isNaN(platform)) {
        throw new Error(`Train plugin platform: invalid number '${args[0]}'`);
      }
    } else {
      // Random platform 1-12
      platform = Math.floor(Math.random() * 12) + 1;
    }

    return {
      value: platform,
      type: 'number'
    };
  }

  /**
   * Generate delay in minutes
   * {{train:delay}} - Random 0-30 minutes
   * {{train:delay:15}} - Fixed delay
   */
  private handleDelay(args: string[]): PlaceholderResult {
    let delay: number;

    if (args.length > 0 && args[0]) {
      delay = parseInt(args[0], 10);
      if (isNaN(delay)) {
        throw new Error(`Train plugin delay: invalid number '${args[0]}'`);
      }
    } else {
      // Random delay 0-30 minutes
      delay = Math.floor(Math.random() * 31);
    }

    return {
      value: delay,
      type: 'number'
    };
  }

  /**
   * Generate station name
   * {{train:station:start}} - From start stations list
   * {{train:station:end}} - From end stations list
   * {{train:station:custom}} - Use custom name
   */
  private handleStation(args: string[]): PlaceholderResult {
    if (args.length === 0) {
      throw new Error(
        'Train plugin station: requires argument (start, end, or custom name)'
      );
    }

    const type = args[0];
    let station: string;

    if (type === 'start') {
      const index = Math.floor(Math.random() * this.startStations.length);
      station = this.startStations[index];
    } else if (type === 'end') {
      const index = Math.floor(Math.random() * this.endStations.length);
      station = this.endStations[index];
    } else {
      // Use custom name
      station = type;
    }

    return {
      value: station,
      type: 'string'
    };
  }

  /**
   * Generate train type
   * {{train:type}} - Random type
   * {{train:type:ICE}} - Fixed type
   */
  private handleType(args: string[]): PlaceholderResult {
    let trainType: string;

    if (args.length > 0 && args[0]) {
      trainType = args[0];
    } else {
      // Random type
      const index = Math.floor(Math.random() * this.trainTypes.length);
      trainType = this.trainTypes[index];
    }

    return {
      value: trainType,
      type: 'string'
    };
  }
}
