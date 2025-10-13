import { describe, it, expect } from 'vitest';
import { ToNumberTransform } from '../../src/transforms/ToNumberTransform';
import { ToStringTransform } from '../../src/transforms/ToStringTransform';
import { ToBooleanTransform } from '../../src/transforms/ToBooleanTransform';
import type { PlaceholderResult } from '../../src/core/types';

describe('ToNumberTransform', () => {
  const transform = new ToNumberTransform();

  it('should have correct name', () => {
    expect(transform.name).toBe('toNumber');
  });

  it('should convert string to number', () => {
    const input: PlaceholderResult = { value: '123', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(123);
    expect(result.type).toBe('number');
  });

  it('should convert decimal string to number', () => {
    const input: PlaceholderResult = { value: '45.67', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(45.67);
    expect(result.type).toBe('number');
  });

  it('should convert negative string to number', () => {
    const input: PlaceholderResult = { value: '-10', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(-10);
    expect(result.type).toBe('number');
  });

  it('should return number as-is if already number', () => {
    const input: PlaceholderResult = { value: 42, type: 'number' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(42);
    expect(result.type).toBe('number');
  });

  it('should convert boolean to number', () => {
    const input1: PlaceholderResult = { value: true, type: 'boolean' };
    const result1 = transform.apply(input1, []);
    expect(result1.value).toBe(1);

    const input2: PlaceholderResult = { value: false, type: 'boolean' };
    const result2 = transform.apply(input2, []);
    expect(result2.value).toBe(0);
  });

  it('should throw error for invalid number string', () => {
    const input: PlaceholderResult = { value: 'not a number', type: 'string' };

    expect(() => transform.apply(input, [])).toThrow('Cannot convert "not a number" to number');
  });

  it('should throw error for null', () => {
    const input: PlaceholderResult = { value: null, type: 'string' };

    expect(() => transform.apply(input, [])).toThrow('Cannot convert null or undefined to number');
  });

  it('should throw error for undefined', () => {
    const input: PlaceholderResult = { value: undefined, type: 'string' };

    expect(() => transform.apply(input, [])).toThrow('Cannot convert null or undefined to number');
  });
});

describe('ToStringTransform', () => {
  const transform = new ToStringTransform();

  it('should have correct name', () => {
    expect(transform.name).toBe('toString');
  });

  it('should return string as-is if already string', () => {
    const input: PlaceholderResult = { value: 'hello', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe('hello');
    expect(result.type).toBe('string');
  });

  it('should convert number to string', () => {
    const input: PlaceholderResult = { value: 123, type: 'number' };
    const result = transform.apply(input, []);

    expect(result.value).toBe('123');
    expect(result.type).toBe('string');
  });

  it('should convert boolean to string', () => {
    const input1: PlaceholderResult = { value: true, type: 'boolean' };
    const result1 = transform.apply(input1, []);
    expect(result1.value).toBe('true');

    const input2: PlaceholderResult = { value: false, type: 'boolean' };
    const result2 = transform.apply(input2, []);
    expect(result2.value).toBe('false');
  });

  it('should convert null to string', () => {
    const input: PlaceholderResult = { value: null, type: 'object' };
    const result = transform.apply(input, []);

    expect(result.value).toBe('null');
    expect(result.type).toBe('string');
  });

  it('should convert undefined to string', () => {
    const input: PlaceholderResult = { value: undefined, type: 'object' };
    const result = transform.apply(input, []);

    expect(result.value).toBe('undefined');
    expect(result.type).toBe('string');
  });

  it('should convert object to JSON string', () => {
    const input: PlaceholderResult = { value: { a: 1, b: 2 }, type: 'object' };
    const result = transform.apply(input, []);

    expect(result.value).toBe('{"a":1,"b":2}');
    expect(result.type).toBe('string');
  });

  it('should convert array to JSON string', () => {
    const input: PlaceholderResult = { value: [1, 2, 3], type: 'array' };
    const result = transform.apply(input, []);

    expect(result.value).toBe('[1,2,3]');
    expect(result.type).toBe('string');
  });
});

describe('ToBooleanTransform', () => {
  const transform = new ToBooleanTransform();

  it('should have correct name', () => {
    expect(transform.name).toBe('toBoolean');
  });

  it('should return boolean as-is if already boolean', () => {
    const input1: PlaceholderResult = { value: true, type: 'boolean' };
    const result1 = transform.apply(input1, []);
    expect(result1.value).toBe(true);

    const input2: PlaceholderResult = { value: false, type: 'boolean' };
    const result2 = transform.apply(input2, []);
    expect(result2.value).toBe(false);
  });

  it('should convert string "true" to boolean true', () => {
    const input: PlaceholderResult = { value: 'true', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(true);
    expect(result.type).toBe('boolean');
  });

  it('should convert string "false" to boolean false', () => {
    const input: PlaceholderResult = { value: 'false', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(false);
    expect(result.type).toBe('boolean');
  });

  it('should convert "yes" variations to true', () => {
    const variations = ['yes', 'YES', 'Yes', 'y', 'Y'];

    for (const value of variations) {
      const input: PlaceholderResult = { value, type: 'string' };
      const result = transform.apply(input, []);
      expect(result.value).toBe(true);
    }
  });

  it('should convert "no" variations to false', () => {
    const variations = ['no', 'NO', 'No', 'n', 'N'];

    for (const value of variations) {
      const input: PlaceholderResult = { value, type: 'string' };
      const result = transform.apply(input, []);
      expect(result.value).toBe(false);
    }
  });

  it('should convert string "1" to true', () => {
    const input: PlaceholderResult = { value: '1', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(true);
  });

  it('should convert string "0" to false', () => {
    const input: PlaceholderResult = { value: '0', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(false);
  });

  it('should convert "on" to true', () => {
    const input: PlaceholderResult = { value: 'on', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(true);
  });

  it('should convert "off" to false', () => {
    const input: PlaceholderResult = { value: 'off', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(false);
  });

  it('should convert empty string to false', () => {
    const input: PlaceholderResult = { value: '', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(false);
  });

  it('should convert non-empty unknown string to true', () => {
    const input: PlaceholderResult = { value: 'anything else', type: 'string' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(true);
  });

  it('should convert number 0 to false', () => {
    const input: PlaceholderResult = { value: 0, type: 'number' };
    const result = transform.apply(input, []);

    expect(result.value).toBe(false);
  });

  it('should convert non-zero numbers to true', () => {
    const numbers = [1, -1, 42, 0.1, -5];

    for (const value of numbers) {
      const input: PlaceholderResult = { value, type: 'number' };
      const result = transform.apply(input, []);
      expect(result.value).toBe(true);
    }
  });

  it('should handle case insensitivity', () => {
    const input1: PlaceholderResult = { value: 'TRUE', type: 'string' };
    const result1 = transform.apply(input1, []);
    expect(result1.value).toBe(true);

    const input2: PlaceholderResult = { value: 'FALSE', type: 'string' };
    const result2 = transform.apply(input2, []);
    expect(result2.value).toBe(false);
  });

  it('should handle whitespace', () => {
    const input1: PlaceholderResult = { value: '  true  ', type: 'string' };
    const result1 = transform.apply(input1, []);
    expect(result1.value).toBe(true);

    const input2: PlaceholderResult = { value: '  false  ', type: 'string' };
    const result2 = transform.apply(input2, []);
    expect(result2.value).toBe(false);
  });
});
