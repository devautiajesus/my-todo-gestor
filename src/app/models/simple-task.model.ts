import { Comment } from './comment.model';

export interface SimpleTask {
  id?: string;
  title: string;
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  subTaskId: string;
  macroTaskId: string;
  order: number;
}
