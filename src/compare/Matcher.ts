import type { MatchResult, MatchContext } from '../core/types';

/**
 * Interface for smart matchers in compare mode
 *
 * Matchers perform intelligent comparisons beyond simple equality,
 * such as regex matching, tolerance-based matching, etc.
 */
export interface Matcher {
  /**
   * Perform the match operation
   *
   * @param actual - Actual value from response/data
   * @param expected - Expected value (may be a placeholder or pattern)
   * @param context - Match context with path and full objects
   * @returns Match result with success status and optional error message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match(actual: any, expected: any, context: MatchContext): MatchResult;
}
