import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserContext {
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserContext | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load user from localStorage on initialization
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // Get current user synchronously
  getCurrentUser(): UserContext | null {
    return this.currentUserSubject.value;
  }

  // Get company ID of logged-in user
  getCompanyId(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.companyId : null;
  }

  // Set user after login
  setCurrentUser(user: UserContext): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Clear user on logout
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}