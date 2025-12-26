# 📋 Todo Gestor - Setup & Configuration Guide

**Status**: ✅ Implementation Complete - Ready for Firebase Configuration

## 🎯 What's Implemented

### ✅ Complete Features
1. **Authentication Module** - Full login/register with email validation
2. **3-Level Task Hierarchy** - Macro Tasks → Sub Tasks → Simple Tasks
3. **Real-time Sync** - Firestore integration for live data updates
4. **Comments System** - Add/edit/delete comments on any task level
5. **Design System** - 60+ CSS custom properties, dark mode support
6. **Responsive UI** - Mobile-first design, 100% responsive
7. **Security** - Auth guards, protected routes, user isolation

### 📦 Tech Stack
- **Angular 21** (Standalone components, Signals)
- **Firebase** (Authentication + Firestore)
- **Tailwind CSS v4** (with custom properties)
- **Reactive Forms** (validation, error handling)
- **TypeScript 5.9** (strict mode)

---

## 🔧 Configuration Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Enter project name (e.g., "todo-gestor")
4. Accept terms and create

### Step 2: Enable Authentication

1. In Firebase Console → Authentication → Get Started
2. Click "Email/Password"
3. Enable "Email/Password" toggle
4. Save

### Step 3: Create Firestore Database

1. Firebase Console → Firestore Database → Create Database
2. Select "Production mode"
3. Choose location (e.g., us-central1)
4. Wait for database to initialize

### Step 4: Get Firebase Config

1. Firebase Console → Project Settings (⚙️ icon)
2. Scroll to "Your apps" → Select or create Web app
3. Copy the firebaseConfig object

### Step 5: Update Environment Files

Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
```

Update `src/environments/environment.prod.ts` (same config as above for production build).

### Step 6: Set Firestore Security Rules

1. Firebase Console → Firestore Database → Rules
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Macro Tasks - User can only access their own
    match /macroTasks/{macroTaskId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn() && isOwner(request.resource.data.userId);
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
      
      // Comments on Macro Tasks
      match /comments/{commentId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
        allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
      }
      
      // Sub Tasks
      match /subTasks/{subTaskId} {
        allow read: if isSignedIn() && isOwner(resource.data.userId);
        allow create: if isSignedIn() && isOwner(request.resource.data.userId);
        allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
        
        // Comments on Sub Tasks
        match /comments/{commentId} {
          allow read: if isSignedIn();
          allow create: if isSignedIn();
          allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
        }
        
        // Simple Tasks
        match /simpleTasks/{simpleTaskId} {
          allow read: if isSignedIn() && isOwner(resource.data.userId);
          allow create: if isSignedIn() && isOwner(request.resource.data.userId);
          allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
          
          // Comments on Simple Tasks
          match /comments/{commentId} {
            allow read: if isSignedIn();
            allow create: if isSignedIn();
            allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
          }
        }
      }
    }
  }
}
```

3. Click "Publish"

---

## 🚀 Running the Application

### Development

```bash
# Install dependencies (already done)
npm install

# Start dev server
npm start

# Navigate to http://localhost:4200/
```

### Production Build

```bash
npm run build

# Output in dist/my-todo-gestor/
```

---

## 📁 Project Structure

```
src/app/
├── components/
│   ├── auth/
│   │   ├── login.component.ts
│   │   └── register.component.ts
│   ├── dashboard/
│   │   └── dashboard.component.ts
│   ├── tasks/
│   │   ├── task-form.component.ts
│   │   ├── macro-task-item.component.ts
│   │   ├── sub-task-item.component.ts
│   │   └── simple-task-item.component.ts
│   └── comments/
│       └── comment-section.component.ts
├── guards/
│   ├── auth.guard.ts          (Protects dashboard route)
│   └── public.guard.ts        (Prevents auth users from login/register)
├── models/
│   ├── user.model.ts
│   ├── comment.model.ts
│   ├── macro-task.model.ts
│   ├── sub-task.model.ts
│   └── simple-task.model.ts
├── services/
│   ├── auth.service.ts        (Firebase authentication)
│   ├── task.service.ts        (CRUD for all task levels)
│   └── comment.service.ts     (Comment management)
├── app.config.ts              (Firebase providers)
├── app.routes.ts              (Routing configuration)
└── app.ts                      (Root component)
```

---

## 🎨 Design System

All styling uses CSS custom properties defined in `src/styles.css`:

### Color Palettes
- **Primary**: Blue (50-950 shades)
- **Secondary**: Purple (50-950 shades)
- **Neutral**: Gray (50-950 shades)
- **Success**: Green (for completed tasks)
- **Danger**: Red (for delete actions)
- **Warning**: Yellow (for caution states)

### Spacing Scale
```css
--spacing-1: 0.25rem   (4px)
--spacing-2: 0.5rem    (8px)
--spacing-4: 1rem      (16px)
--spacing-6: 1.5rem    (24px)
--spacing-8: 2rem      (32px)
/* ... up to --spacing-24 */
```

### Dark Mode
Automatically respects `prefers-color-scheme: dark`

---

## 🔐 Security Features

✅ **User Isolation**
- Each user can only see their own tasks
- Firestore rules enforce at database level

✅ **Comment Ownership**
- Users can only edit/delete their own comments
- Edit/delete buttons hidden for other users' comments

✅ **Protected Routes**
- Login/Register protected by `publicGuard`
- Dashboard protected by `authGuard`
- Automatic redirect based on auth state

✅ **Form Validation**
- Email format validation
- Password strength requirements (6+ chars)
- Password confirmation matching
- Required fields

---

## 📚 API Overview

### AuthService
```typescript
// Login
authService.login(email: string, password: string)

// Register
authService.register(email: string, password: string, displayName?: string)

// Logout
authService.logout()

// State
authService.currentUser           // Signal<User | null>
authService.isAuthenticated       // Signal<boolean>
authService.authState$            // Observable<FirebaseUser | null>
```

### TaskService
```typescript
// Macro Tasks
taskService.createMacroTask(title: string, dueDate?: Date)
taskService.updateMacroTask(id: string, updates: Partial<MacroTask>)
taskService.deleteMacroTask(id: string)
taskService.macroTasks           // Signal<MacroTask[]>

// Sub Tasks
taskService.createSubTask(macroTaskId: string, title: string)
taskService.subscribeToSubTasks(macroTaskId: string, callback)
taskService.updateSubTask(macroTaskId: string, id: string, updates)
taskService.deleteSubTask(macroTaskId: string, id: string)

// Simple Tasks
taskService.createSimpleTask(macroTaskId, subTaskId, title, dueDate?)
taskService.subscribeToSimpleTasks(macroTaskId, subTaskId, callback)
taskService.toggleSimpleTaskComplete(macroTaskId, subTaskId, id, completed)
taskService.updateSimpleTask(macroTaskId, subTaskId, id, updates)
taskService.deleteSimpleTask(macroTaskId, subTaskId, id)
```

### CommentService
```typescript
// Macro Task Comments
commentService.addMacroTaskComment(macroTaskId: string, text: string)
commentService.updateMacroTaskComment(macroTaskId: string, commentId: string, text: string)
commentService.deleteMacroTaskComment(macroTaskId: string, commentId: string)
commentService.subscribeToMacroTaskComments(macroTaskId: string, callback)

// Sub Task Comments
commentService.addSubTaskComment(macroTaskId: string, subTaskId: string, text: string)
commentService.updateSubTaskComment(macroTaskId, subTaskId, commentId, text)
commentService.deleteSubTaskComment(macroTaskId, subTaskId, commentId)
commentService.subscribeToSubTaskComments(macroTaskId, subTaskId, callback)

// Simple Task Comments
commentService.addSimpleTaskComment(macroTaskId, subTaskId, simpleTaskId, text)
commentService.updateSimpleTaskComment(macroTaskId, subTaskId, simpleTaskId, commentId, text)
commentService.deleteSimpleTaskComment(macroTaskId, subTaskId, simpleTaskId, commentId)
commentService.subscribeToSimpleTaskComments(macroTaskId, subTaskId, simpleTaskId, callback)
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run build
npm run build
```

---

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## ⚠️ Known Considerations

1. **AngularFire Compatibility**
   - Using `--legacy-peer-deps` for Angular 21 (AngularFire 20.x)
   - Will be resolved when AngularFire releases v21 support

2. **Bundle Size**
   - Initial chunk: 653 kB (larger due to Firebase)
   - Consider tree-shaking unused Firebase modules for production

3. **Firestore Costs**
   - Free tier includes: 50K reads, 20K writes, 20K deletes/day
   - Document reads on every component render
   - Monitor usage in Firebase Console

---

## 🐛 Troubleshooting

### "Cannot find module '@angular/fire'"
```bash
npm install --legacy-peer-deps
```

### Firebase config not loading
- Verify environment files have correct config
- Check `src/app/app.config.ts` imports environment

### Firestore rules rejection
- Check auth status: `authService.isAuthenticated()`
- Verify user exists in Firebase Console → Authentication
- Check Firestore rules syntax (test rules in console)

### Comments not appearing
- Ensure Firestore rules allow comment reads
- Check browser console for errors
- Verify user ID matches task owner

---

## 📞 Next Steps

1. ✅ Configure Firebase (Steps 1-6 above)
2. ✅ Update environment files
3. ✅ Set Firestore security rules
4. ✅ Run `npm start`
5. ✅ Create account and test

---

## 📄 License

MIT - Feel free to use this as a template

