import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  User as FirebaseUser,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  // Signal for current user state
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  // Observable for auth state changes
  authState$: Observable<FirebaseUser | null> = authState(this.auth);

  constructor() {
    this.initAuthStateListener();
  }

  private initAuthStateListener(): void {
    this.authState$.subscribe((firebaseUser) => {
      this.isLoading.set(true);

      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: new Date(firebaseUser.metadata.creationTime!)
        };
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } else {
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
      }

      this.isLoading.set(false);
    });
  }

  async register(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);

      if (displayName && credential.user) {
        await updateProfile(credential.user, { displayName });
      }

      return credential;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.router.navigate(['/dashboard']);
      return credential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      await updateProfile(user, { displayName, photoURL });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}
