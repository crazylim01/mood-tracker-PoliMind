# PoliMind — Angular Migration

Complete Angular 17 conversion of the React/Zustand PoliMind frontend.

---

## File-by-File Migration Map

| React (original)              | Angular (this project)                                      |
|-------------------------------|-------------------------------------------------------------|
| `src/services/api.ts`         | `src/app/services/api.service.ts`                          |
| `src/store.ts`                | `src/app/services/mood-store.service.ts`                   |
| `src/main.tsx`                | `src/main.ts` + `src/app/app.component.ts`                 |
| `src/pages/Login.tsx`         | `src/app/pages/login/login.component.ts/.html`             |
| `src/pages/Dashboard.tsx`     | `src/app/pages/dashboard/dashboard.component.ts/.html`     |
| `src/components/ChatWidget.tsx`| `src/app/components/chat-widget/chat-widget.component.ts/.html/.css` |
| Zustand store state           | `MoodStoreService` BehaviorSubjects                        |
| React Router guards           | `src/app/guards/auth.guard.ts`                             |
| `VITE_API_URL` env var        | `src/environments/environment.ts`                          |

---

## Key Architectural Changes

### State Management: Zustand → BehaviorSubjects
The Zustand store is replaced by `MoodStoreService` with RxJS `BehaviorSubject` streams.

```ts
// React (Zustand)
const { entries, settings } = useMoodStore();

// Angular
constructor(private store: MoodStoreService) {}
// In template: store.entries$ | async
// In class:    this.store.entries
```

### HTTP: fetch API → Angular HttpClient
```ts
// React
const res = await fetch('/api/...', { headers: ... });

// Angular
this.http.get<T>('/api/...', { headers: this.headers() })
```

### Session Restore: main.tsx → AppComponent.ngOnInit()
```ts
// React (main.tsx)
restoreSession().finally(() => ReactDOM.createRoot(...).render(...));

// Angular (app.component.ts)
async ngOnInit() {
  await this.store.restoreSession();
}
```

### Routing: React Router → Angular Router
- Auth guards converted to Angular `CanActivateFn`
- Lazy loading used for all page components

### Chart: Recharts → Native CSS bar chart
The Recharts `AreaChart` is replaced with a simple CSS flexbox bar chart to eliminate the npm dependency. If you need a full chart library, install `ng2-charts` (Chart.js wrapper).

### i18n: react-i18next → inline strings
Translations are inlined. To add full i18n support, install `@ngx-translate/core`.

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── chat-widget/
│   │       ├── chat-widget.component.ts
│   │       ├── chat-widget.component.html
│   │       └── chat-widget.component.css
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── models/
│   │   └── index.ts
│   ├── pages/
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts
│   │   │   └── dashboard.component.html
│   │   └── login/
│   │       ├── login.component.ts
│   │       └── login.component.html
│   ├── services/
│   │   ├── api.service.ts
│   │   └── mood-store.service.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/
│   ├── environment.ts          ← development (edit apiUrl here)
│   └── environment.prod.ts     ← production
├── index.html
├── main.ts
└── styles.css
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set backend URL
#    Edit src/environments/environment.ts
#    Change apiUrl to match your C# backend

# 3. Start dev server
ng serve

# 4. Build for production
ng build
```

---

## Environment Configuration

Edit `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',   // ← your C# backend URL
};
```

This replaces the `VITE_API_URL` variable from `.env`.

---

## Notes

- **Standalone components** used throughout (Angular 17 style — no NgModules needed)
- **`@if` / `@for` / `@switch`** control flow syntax used (Angular 17+)
- All **Tailwind classes** preserved exactly from the React originals
- **JWT token** stored in `localStorage` via `getToken/setToken/clearToken` helpers in `api.service.ts`
- The `Draggable` wrapper from `ChatWidget.tsx` was removed; the chat button uses fixed positioning instead
