import { IEventType, IPosition } from '@map/public/contracts';

/**
 * Base event data interface with common properties
 */
export interface IBaseEventData {
  /**
   * Optional event type discriminator (some feature services include this for convenience).
   */
  eventType?: string;
  /**
   * Current position (for points) or reference position (for polylines/polygons)
   */
  position?: IPosition;

  /**
   * Previous position (for tracking changes)
   */
  previousPosition?: IPosition;

  /**
   * Array of positions (for polylines/polygons)
   */
  positions?: IPosition[];

  /**
   * Previous array of positions (for polylines/polygons)
   */
  previousPositions?: IPosition[];

  /**
   * Flag indicating if a position was added (for polylines)
   */
  added?: boolean;

  /**
   * Flag indicating if an entity is editable
   */
  editable?: boolean;

  /**
   * Style properties for an entity
   */
  style?: Record<string, unknown>;

  /**
   * Radius value for circle entities
   */
  radius?: number;

  /**
   * Flag indicating if the event is from dragging a virtual vertex
   */
  virtualDrag?: boolean;

  /**
   * Start index for operations involving vertex ranges (like virtual vertex dragging)
   */
  startIndex?: number;

  /**
   * End index for operations involving vertex ranges (like virtual vertex dragging)
   */
  endIndex?: number;

  /**
   * Identifier for the vertex involved in an event
   */
  vertexId?: string;

  /**
   * Flag indicating if a vertex is a real vertex (vs. a virtual vertex)
   */
  isRealVertex?: boolean;

  /**
   * Index of the vertex in the vertices array
   */
  vertexIndex?: number;

  /**
   * Flag indicating if a virtual vertex was converted to a real vertex
   */
  convertedToReal?: boolean;

  /**
   * Index of the position in the positions array
   */
  positionIndex?: number;

  /**
   * Flag indicating if the position change originated from a vertex drag operation
   */
  originatedFromVertexDrag?: boolean;
}

/**
 * Interface for map events emitted by entities
 */
export interface IEvent {
  /**
   * Type of event
   */
  type: IEventType | string;

  /**
   * ID of the entity that emitted the event
   */
  id: string;

  /**
   * Event data
   */
  data: IBaseEventData;
}
