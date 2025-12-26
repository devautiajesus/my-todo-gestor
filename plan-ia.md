Plan: Todo Gestor - Hierarchical Task Management Application
Build a Firebase-powered Angular task manager with 3-level hierarchy (Macro Task → Sub Task → Simple Task), authentication, and responsive Tailwind UI. The app will use Angular v21 signals for state management, Firestore for data persistence, and a mobile-first design approach.

Steps
Install and configure Firebase - Add firebase and @angular/fire packages, create Firebase project, configure Authentication and Firestore providers in app.config.ts, and set up environment files for Firebase credentials.

Define Firestore schema and TypeScript models - Create interfaces for MacroTask, SubTask, SimpleTask, Comment, and User with proper typing. Design Firestore collections structure: /macroTasks/{id}, /macroTasks/{id}/subTasks/{id}, /macroTasks/{id}/subTasks/{id}/simpleTasks/{id}, and /comments subcollections at each level.

Configure Tailwind design system - Create CSS custom properties in styles.css for color palette (primary, secondary, neutral, success, danger variants), spacing scale, and typography. Document mobile-first breakpoints and implement dark mode support using CSS variables.

Build authentication module - Create AuthService using Firebase Authentication, login/register components with reactive forms, route guards for protected routes, and update app.routes.ts with public (login, register) and protected (dashboard) routes.

Create Firestore service layer - Implement TaskService with CRUD operations for all 3 task levels, CommentService for comment management with user association, and reactive data streams using Firestore snapshots and Angular signals for real-time updates.

Build task component hierarchy - Create standalone components: MacroTaskListComponent, MacroTaskItemComponent, SubTaskItemComponent, SimpleTaskItemComponent, TaskFormComponent (reusable for all levels), CommentSectionComponent, and a dashboard/layout component. Each component should use ChangeDetectionStrategy.OnPush, input()/output() functions, and signals for state.

Further Considerations
Firestore security rules - Should we implement strict rules where users can only access their own tasks, or allow shared/collaborative tasks? Option A: Private tasks only / Option B: Add sharing functionality / Option C: Team workspaces.

Task drag-and-drop reordering - Do you want to reorder tasks within each level? This would require @angular/cdk/drag-drop and an order field in Firestore documents.

Offline support - Should the app work offline using Firestore's offline persistence, or require active internet connection?

Date handling - For optional dates on Macro Tasks and Simple Tasks, should we support due dates only, or also date ranges and reminders?

Claude Sonnet 4.5 • 0.9x
