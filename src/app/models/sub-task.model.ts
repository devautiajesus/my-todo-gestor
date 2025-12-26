import { Comment } from './comment.model';

export interface SubTask {
  id?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  macroTaskId: string;
  order: number;
}
