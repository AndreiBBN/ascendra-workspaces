import { createBrowserRouter, Navigate } from 'react-router';
import { SignIn } from './pages/SignIn';
import { AdminDashboard } from './pages/AdminDashboard';
import { VMInventory } from './pages/VMInventory';
import { Templates } from './pages/Templates';
import { DeveloperDashboard } from './pages/DeveloperDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/signin" replace />,
  },
  {
    path: '/signin',
    element: <SignIn />,
  },
  {
    path: '/dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/developer',
    element: <DeveloperDashboard />,
  },
  {
    path: '/inventory',
    element: <VMInventory />,
  },
  {
    path: '/templates',
    element: <Templates />,
  },
  {
    path: '*',
    element: <Navigate to="/signin" replace />,
  },
]);
