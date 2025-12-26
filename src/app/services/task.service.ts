import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  DocumentData,
  CollectionReference
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { MacroTask, SubTask, SimpleTask } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Signals for reactive state
  macroTasks = signal<MacroTask[]>([]);
  isLoading = signal(false);

  private unsubscribeMacroTasks?: () => void;

  constructor() {
    // Listen to auth state changes
    this.authService.authState$.subscribe((user) => {
      if (user) {
        this.subscribeToMacroTasks();
      } else {
        this.unsubscribeMacroTasks?.();
        this.macroTasks.set([]);
      }
    });
  }

  // ==================== MACRO TASKS ====================

  private subscribeToMacroTasks(): void {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return;

    this.isLoading.set(true);

    const macroTasksRef = collection(this.firestore, 'macroTasks');
    const q = query(
      macroTasksRef,
      where('userId', '==', userId),
      orderBy('order', 'asc'),
      orderBy('createdAt', 'desc')
    );

    this.unsubscribeMacroTasks = onSnapshot(q, (snapshot) => {
      const tasks: MacroTask[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data()['dueDate'] ? (doc.data()['dueDate'] as Timestamp).toDate() : undefined,
        createdAt: (doc.data()['createdAt'] as Timestamp).toDate(),
        updatedAt: (doc.data()['updatedAt'] as Timestamp).toDate()
      } as MacroTask));

      this.macroTasks.set(tasks);
      this.isLoading.set(false);
    });
  }

  async createMacroTask(title: string, dueDate?: Date): Promise<string> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');

    const macroTasksRef = collection(this.firestore, 'macroTasks');
    const now = Timestamp.now();

    const macroTask = {
      title,
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
      userId,
      createdAt: now,
      updatedAt: now,
      order: Date.now()
    };

    const docRef = await addDoc(macroTasksRef, macroTask);
    return docRef.id;
  }

  async updateMacroTask(id: string, updates: Partial<MacroTask>): Promise<void> {
    const macroTaskRef = doc(this.firestore, 'macroTasks', id);

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }

    await updateDoc(macroTaskRef, updateData);
  }

  async deleteMacroTask(id: string): Promise<void> {
    // First delete all subTasks and their simpleTasks
    const subTasks = await this.getSubTasks(id);

    for (const subTask of subTasks) {
      await this.deleteSubTask(id, subTask.id!);
    }

    // Then delete the macro task
    const macroTaskRef = doc(this.firestore, 'macroTasks', id);
    await deleteDoc(macroTaskRef);
  }

  // ==================== SUB TASKS ====================

  async getSubTasks(macroTaskId: string): Promise<SubTask[]> {
    const subTasksRef = collection(this.firestore, `macroTasks/${macroTaskId}/subTasks`);
    const q = query(subTasksRef, orderBy('order', 'asc'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data()['createdAt'] as Timestamp).toDate(),
      updatedAt: (doc.data()['updatedAt'] as Timestamp).toDate()
    } as SubTask));
  }

  subscribeToSubTasks(macroTaskId: string, callback: (subTasks: SubTask[]) => void): () => void {
    const subTasksRef = collection(this.firestore, `macroTasks/${macroTaskId}/subTasks`);
    const q = query(subTasksRef, orderBy('order', 'asc'), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const subTasks: SubTask[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data()['createdAt'] as Timestamp).toDate(),
        updatedAt: (doc.data()['updatedAt'] as Timestamp).toDate()
      } as SubTask));

      callback(subTasks);
    });
  }

  async createSubTask(macroTaskId: string, title: string): Promise<string> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');

    const subTasksRef = collection(this.firestore, `macroTasks/${macroTaskId}/subTasks`);
    const now = Timestamp.now();

    const subTask = {
      title,
      macroTaskId,
      userId,
      createdAt: now,
      updatedAt: now,
      order: Date.now()
    };

    const docRef = await addDoc(subTasksRef, subTask);
    return docRef.id;
  }

  async updateSubTask(macroTaskId: string, subTaskId: string, updates: Partial<SubTask>): Promise<void> {
    const subTaskRef = doc(this.firestore, `macroTasks/${macroTaskId}/subTasks`, subTaskId);

    await updateDoc(subTaskRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async deleteSubTask(macroTaskId: string, subTaskId: string): Promise<void> {
    // First delete all simpleTasks
    const simpleTasks = await this.getSimpleTasks(macroTaskId, subTaskId);

    for (const simpleTask of simpleTasks) {
      await this.deleteSimpleTask(macroTaskId, subTaskId, simpleTask.id!);
    }

    // Then delete the sub task
    const subTaskRef = doc(this.firestore, `macroTasks/${macroTaskId}/subTasks`, subTaskId);
    await deleteDoc(subTaskRef);
  }

  // ==================== SIMPLE TASKS ====================

  async getSimpleTasks(macroTaskId: string, subTaskId: string): Promise<SimpleTask[]> {
    const simpleTasksRef = collection(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks`
    );
    const q = query(simpleTasksRef, orderBy('order', 'asc'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data()['dueDate'] ? (doc.data()['dueDate'] as Timestamp).toDate() : undefined,
      createdAt: (doc.data()['createdAt'] as Timestamp).toDate(),
      updatedAt: (doc.data()['updatedAt'] as Timestamp).toDate()
    } as SimpleTask));
  }

  subscribeToSimpleTasks(
    macroTaskId: string,
    subTaskId: string,
    callback: (simpleTasks: SimpleTask[]) => void
  ): () => void {
    const simpleTasksRef = collection(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks`
    );
    const q = query(simpleTasksRef, orderBy('order', 'asc'), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const simpleTasks: SimpleTask[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data()['dueDate'] ? (doc.data()['dueDate'] as Timestamp).toDate() : undefined,
        createdAt: (doc.data()['createdAt'] as Timestamp).toDate(),
        updatedAt: (doc.data()['updatedAt'] as Timestamp).toDate()
      } as SimpleTask));

      callback(simpleTasks);
    });
  }

  async createSimpleTask(
    macroTaskId: string,
    subTaskId: string,
    title: string,
    dueDate?: Date
  ): Promise<string> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');

    const simpleTasksRef = collection(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks`
    );
    const now = Timestamp.now();

    const simpleTask = {
      title,
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
      completed: false,
      macroTaskId,
      subTaskId,
      userId,
      createdAt: now,
      updatedAt: now,
      order: Date.now()
    };

    const docRef = await addDoc(simpleTasksRef, simpleTask);
    return docRef.id;
  }

  async updateSimpleTask(
    macroTaskId: string,
    subTaskId: string,
    simpleTaskId: string,
    updates: Partial<SimpleTask>
  ): Promise<void> {
    const simpleTaskRef = doc(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks`,
      simpleTaskId
    );

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }

    await updateDoc(simpleTaskRef, updateData);
  }

  async toggleSimpleTaskComplete(
    macroTaskId: string,
    subTaskId: string,
    simpleTaskId: string,
    completed: boolean
  ): Promise<void> {
    await this.updateSimpleTask(macroTaskId, subTaskId, simpleTaskId, { completed });
  }

  async deleteSimpleTask(macroTaskId: string, subTaskId: string, simpleTaskId: string): Promise<void> {
    const simpleTaskRef = doc(
      this.firestore,
      `macroTasks/${macroTaskId}/subTasks/${subTaskId}/simpleTasks`,
      simpleTaskId
    );
    await deleteDoc(simpleTaskRef);
  }
}
