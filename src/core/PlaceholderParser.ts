import type { ParsedPlaceholder, ParsedTransform } from './types';

/**
 * Parser for placeholder strings
 *
 * Supports format: {{module:action:arg1:arg2:argN|transform1:param|transform2}}
 *
 * Examples:
 * - {{gen:uuid:inst1}}
 * - {{time:calc:350:iso}}
 * - {{gen:zugnummer:4837|toNumber}}
 * - {{compare:startsWith:{{time:calc:0:dd.MM.yyyy}}}}
 */
export class PlaceholderParser {
  /**
   * Check if a string is a placeholder
   */
  isPlaceholder(value: string): boolean {
    return /^{{.+}}$/.test(value.trim());
  }

  /**
   * Find all placeholders in a string (including nested ones)
   */
  findPlaceholders(content: string): string[] {
    const placeholders = new Set<string>();
    this.findPlaceholdersRecursive(content, placeholders);
    return Array.from(placeholders);
  }

  /**
   * Recursively find all placeholders
   */
  private findPlaceholdersRecursive(content: string, placeholders: Set<string>): void {
    let depth = 0;
    let start = -1;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const next = content[i + 1];

      if (char === '{' && next === '{') {
        if (depth === 0) {
          start = i;
        }
        depth++;
        i++; // Skip next {
      } else if (char === '}' && next === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          const placeholder = content.slice(start, i + 2);
          placeholders.add(placeholder);

          // Recursively find nested placeholders
          const inner = placeholder.slice(2, -2);
          this.findPlaceholdersRecursive(inner, placeholders);
        }
        i++; // Skip next }
      }
    }
  }

  /**
   * Parse a placeholder string into its components
   *
   * @param placeholder - The placeholder string (e.g., "{{gen:uuid:inst1}}")
   * @returns Parsed placeholder structure
   * @throws Error if placeholder format is invalid
   */
  parse(placeholder: string): ParsedPlaceholder {
    const trimmed = placeholder.trim();

    if (!this.isPlaceholder(trimmed)) {
      throw new Error(`Invalid placeholder format: ${placeholder}`);
    }

    // Remove {{ and }}
    const inner = trimmed.slice(2, -2);

    // Split by | to separate main part and transforms
    const [mainPart, ...transformParts] = this.splitByPipe(inner);

    // Parse main part (module:action:args)
    const { module, action, args } = this.parseMainPart(mainPart);

    // Parse transforms
    const transforms = transformParts.map(t => this.parseTransform(t));

    return {
      original: trimmed,
      module,
      action,
      args,
      transforms,
    };
  }

  /**
   * Split by pipe (|) but respect nested placeholders
   */
  private splitByPipe(content: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const next = content[i + 1];

      if (char === '{' && next === '{') {
        depth++;
        current += char;
      } else if (char === '}' && next === '}') {
        depth--;
        current += char;
      } else if (char === '|' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current.trim());
    }

    return parts;
  }

  /**
   * Parse main part: module:action:args
   */
  private parseMainPart(mainPart: string): {
    module: string;
    action: string;
    args: string[];
  } {
    // Split by : but respect nested placeholders
    const parts = this.splitByColon(mainPart);

    if (parts.length < 2) {
      throw new Error(
        `Invalid placeholder format. Expected at least module:action, got: ${mainPart}`
      );
    }

    const [module, action, ...args] = parts;

    return {
      module: module.trim(),
      action: action.trim(),
      args: args.map(arg => arg.trim()),
    };
  }

  /**
   * Split by colon (:) but respect nested placeholders and escaped colons (\:)
   */
  private splitByColon(content: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const next = content[i + 1];

      if (char === '{' && next === '{') {
        depth++;
        current += char;
      } else if (char === '}' && next === '}') {
        depth--;
        current += char;
      } else if (char === '\\' && next === ':') {
        // Escaped colon: \: → :
        current += ':';
        i++; // Skip the next character (:)
      } else if (char === ':' && depth === 0) {
        // Unescaped colon at depth 0: split here
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current.trim());
    }

    return parts;
  }

  /**
   * Parse a transform: name or name:param1:param2
   */
  private parseTransform(transformStr: string): ParsedTransform {
    const parts = transformStr.split(':').map(p => p.trim());
    const [name, ...params] = parts;

    return {
      name,
      params,
    };
  }

  /**
   * Replace all placeholders in content with resolved values
   *
   * Performs multiple passes until no more placeholders are found.
   * This handles cases where replacing an inner placeholder changes the outer one.
   *
   * @param content - Content with placeholders
   * @param resolveFn - Function to resolve each placeholder
   * @returns Content with replaced placeholders
   */
  replaceAll(content: string, resolveFn: (placeholder: string) => string): string {
    let result = content;
    let previousResult = '';
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    // Keep replacing until no more changes occur
    while (result !== previousResult && iterations < maxIterations) {
      previousResult = result;
      const placeholders = this.findPlaceholders(result);

      if (placeholders.length === 0) {
        break;
      }

      // Sort by position (order of occurrence in content)
      // For nested placeholders, sort by depth (innermost first)
      const sorted = this.sortPlaceholdersByPosition(result, placeholders);

      for (const placeholder of sorted) {
        const resolved = resolveFn(placeholder);
        result = result.replaceAll(placeholder, resolved);
      }

      iterations++;
    }

    return result;
  }

  /**
   * Sort placeholders by their position in content
   * Innermost placeholders come first (for nested structures)
   */
  private sortPlaceholdersByPosition(content: string, placeholders: string[]): string[] {
    return placeholders.sort((a, b) => {
      const posA = content.indexOf(a);
      const posB = content.indexOf(b);

      // If one contains the other, inner one should come first
      if (a.includes(b)) return 1; // b is inside a, so b comes first
      if (b.includes(a)) return -1; // a is inside b, so a comes first

      // Otherwise, sort by position
      return posA - posB;
    });
  }
}
