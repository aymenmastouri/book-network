import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'books' },
  {
    path: 'books',
    loadComponent: () => import('./pages/browse.component').then((m) => m.BrowseComponent),
  },
  {
    path: 'books/new',
    loadComponent: () => import('./pages/book-form.component').then((m) => m.BookFormComponent),
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./pages/book-detail.component').then((m) => m.BookDetailComponent),
  },
  {
    path: 'books/:id/edit',
    loadComponent: () => import('./pages/book-form.component').then((m) => m.BookFormComponent),
  },
  {
    path: 'shelf',
    loadComponent: () => import('./pages/shelf.component').then((m) => m.ShelfComponent),
  },
  {
    path: 'borrowed',
    loadComponent: () => import('./pages/borrowed.component').then((m) => m.BorrowedComponent),
  },
  {
    path: 'returns',
    loadComponent: () => import('./pages/returns.component').then((m) => m.ReturnsComponent),
  },
  { path: '**', redirectTo: 'books' },
];
