import {
  DroneTopicType,
  DockingStationTopicType,
} from '../../socket/enums/topic-types.enum';
import usePayloadConfigStore from '../stores/payload-config.store';

type TopicTransformer = (data: any, deviceId: string) => any;
const transformPayloadsList = (data: any): any => {
  const payloadsList = data?.payloads_list || [];
  const { getPayloadType } = usePayloadConfigStore.getState();
  return payloadsList.map((payload: any) => ({
    ...payload,
    type: getPayloadType(payload.payload_index) || payload.type,
  }));
};

/**
 * Drone topic transformers map
 * Add topic-specific transformation logic here
 */
export const DRONE_TOPIC_TRANSFORMERS: Partial<
  Record<DroneTopicType, TopicTransformer>
> = {
  [DroneTopicType.PayloadsList]: (data) => {
    return transformPayloadsList(data);
  },
};

/**
 * Docking station topic transformers map
 * Add topic-specific transformation logic here
 */
export const DOCK_TOPIC_TRANSFORMERS: Partial<
  Record<DockingStationTopicType, TopicTransformer>
> = {
  [DockingStationTopicType.PayloadsList]: (data) => {
    return transformPayloadsList(data);
  },
};

/**
 * Apply transformer for drone topic if exists, otherwise return raw data
 */
export const transformDroneTopicData = (
  topicType: DroneTopicType,
  data: any,
  droneId: string
): any => {
  const transformer = DRONE_TOPIC_TRANSFORMERS[topicType];
  return transformer ? transformer(data, droneId) : data;
};

/**
 * Apply transformer for dock topic if exists, otherwise return raw data
 */
export const transformDockTopicData = (
  topicType: DockingStationTopicType,
  data: any,
  dockId: string
): any => {
  const transformer = DOCK_TOPIC_TRANSFORMERS[topicType];
  return transformer ? transformer(data, dockId) : data;
};
