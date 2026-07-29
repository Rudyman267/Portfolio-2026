import { IntrudersData, IntruderData } from '../types';

export interface IntrudersState {
  intruders: IntrudersData;

  updateIntrudersData: (data: IntrudersData) => void;

  updateIntruder: (intruderId: string, data: IntruderData) => void;

  removeIntruder: (intruderId: string) => void;

  clearIntruders: () => void;

  getActiveIntruders: () => IntrudersData;
}
