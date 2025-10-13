/**
 * Built-in transforms for placeholder values
 */

export type { Transform } from './Transform'
export { ToNumberTransform } from './ToNumberTransform'
export { ToStringTransform } from './ToStringTransform'
export { ToBooleanTransform } from './ToBooleanTransform'

import { ToNumberTransform } from './ToNumberTransform'
import { ToStringTransform } from './ToStringTransform'
import { ToBooleanTransform } from './ToBooleanTransform'

/**
 * Create a set of standard transforms
 *
 * @returns Array of standard transform instances
 */
export function createStandardTransforms() {
  return [new ToNumberTransform(), new ToStringTransform(), new ToBooleanTransform()]
}
