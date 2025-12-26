import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Comment } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // ==================== MACRO TASK COMMENTS ====================

  subscribeToMacroTaskComments(macroTaskId: string, callback: (comments: Comment[]) => void): () => void {
    const commentsRef = collection(this.firestore, `macroTasks/${macroTaskId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const comments: Comment[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data()['createdAt'] as Timestamp).toDate()
      } as Comment));

      callback(comments);
    });
  }

  async addMacroTaskComment(macroTaskId: string, text: string): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const commentsRef = collection(this.firestore, `macroTasks/${macroTaskId}/comments`);

    const comment = {
      text,
      userId: user.uid,
      userEmail: user.email,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(commentsRef, comment);
    return docRef.id;
  }

  async updateMacroTaskComment(macroTaskId: string, commentId: string, text: string): Promise<void> {
    const commentRef = doc(this.firestore, `macroTasks/${macroTaskId}/comments`, commentId);
    await updateDoc(commentRef, { text });
  }

  async deleteMacroTaskComment(macroTaskId: string, commentId: string): Promise<void> {
    const commentRef = doc(this.firestore, `macroTasks/${macroTaskId}/comments`, commentId);
    await deleteDoc(commentRef);
  }

  // ==================== SUB TASK COMMENTS ====================

  subscribeToSubTaskComments(
    macroTaskId: string,
    subTaskId: string,
    callback: (comments: Comment[]) => void
  ): () => void {
    const commentsRef = collection(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/comments`
    );
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const comments: Comment[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data()['createdAt'] as Timestamp).toDate()
      } as Comment));

      callback(comments);
    });
  }

  async addSubTaskComment(macroTaskId: string, subTaskId: string, text: string): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const commentsRef = collection(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/comments`
    );

    const comment = {
      text,
      userId: user.uid,
      userEmail: user.email,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(commentsRef, comment);
    return docRef.id;
  }

  async updateSubTaskComment(
    macroTaskId: string,
    subTaskId: string,
    commentId: string,
    text: string
  ): Promise<void> {
    const commentRef = doc(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/comments`,
      commentId
    );
    await updateDoc(commentRef, { text });
  }

  async deleteSubTaskComment(macroTaskId: string, subTaskId: string, commentId: string): Promise<void> {
    const commentRef = doc(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/comments`,
      commentId
    );
    await deleteDoc(commentRef);
  }

  // ==================== SIMPLE TASK COMMENTS ====================

  subscribeToSimpleTaskComments(
    macroTaskId: string,
    subTaskId: string,
    simpleTaskId: string,
    callback: (comments: Comment[]) => void
  ): () => void {
    const commentsRef = collection(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks/${simpleTaskId}/comments`
    );
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const comments: Comment[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data()['createdAt'] as Timestamp).toDate()
      } as Comment));

      callback(comments);
    });
  }

  async addSimpleTaskComment(
    macroTaskId: string,
    subTaskId: string,
    simpleTaskId: string,
    text: string
  ): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const commentsRef = collection(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks/${simpleTaskId}/comments`
    );

    const comment = {
      text,
      userId: user.uid,
      userEmail: user.email,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(commentsRef, comment);
    return docRef.id;
  }

  async updateSimpleTaskComment(
    macroTaskId: string,
    subTaskId: string,
    simpleTaskId: string,
    commentId: string,
    text: string
  ): Promise<void> {
    const commentRef = doc(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks/${simpleTaskId}/comments`,
      commentId
    );
    await updateDoc(commentRef, { text });
  }

  async deleteSimpleTaskComment(
    macroTaskId: string,
    subTaskId: string,
    simpleTaskId: string,
    commentId: string
  ): Promise<void> {
    const commentRef = doc(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks/${simpleTaskId}/comments`,
      commentId
    );
    await deleteDoc(commentRef);
  }
}
