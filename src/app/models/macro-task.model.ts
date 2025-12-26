import { Comment } from './comment.model';

export interface MacroTask {
  id?: string;
  title: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  order: number;
}
