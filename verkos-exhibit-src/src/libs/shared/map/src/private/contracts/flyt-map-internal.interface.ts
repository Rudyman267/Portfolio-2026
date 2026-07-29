import { IFlytMap } from '@map/public/contracts';
import { IBaseEntityManager } from '@map/private/contracts/base-entities';
import { ICompositeManager } from '@map/private/contracts/composite-entities';

/**
 * Internal extension of IFlytMap with implementation-specific methods
 * This interface is for private/runtime layer use only
 *
 * Client applications should NEVER import or use this interface
 * @internal
 */
export interface IFlytMapInternal extends IFlytMap {
  /**
   * Get base entity managers (internal use only)
   * Provides low-level access to base entity creation
   *
   * @internal
   * @returns Base entity managers instance or null/undefined if not available
   */
  getBaseManager(): IBaseEntityManager | null | undefined;

  /**
   * Get composite manager (internal use only)
   * Provides access to composite entity management
   *
   * @internal
   * @returns Composite manager instance or null/undefined if not available
   */
  getCompositeManager(): ICompositeManager | null | undefined;
}
