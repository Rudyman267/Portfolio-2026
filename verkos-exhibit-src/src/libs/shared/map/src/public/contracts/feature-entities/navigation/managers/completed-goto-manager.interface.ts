import { ICompletedGoto, ICompletedGotoOptions } from '../entities';

export interface ICompletedGotoManager {
  createCompletedGoto(options: ICompletedGotoOptions): ICompletedGoto;
  getCompletedGoto(id: string): ICompletedGoto | undefined;
  clearAll(): void;
  removeCompletedGoto(id: string): void;
}
