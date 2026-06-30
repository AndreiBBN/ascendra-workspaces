import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { SignIn } from './pages/SignIn';
import { AdminDashboard } from './pages/AdminDashboard';
import { VMInventory } from './pages/VMInventory';
import { Templates } from './pages/Templates';
import { DeveloperDashboard } from './pages/DeveloperDashboard';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/developer" element={<DeveloperDashboard />} />
          <Route path="/inventory" element={<VMInventory />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors closeButton />
    </ThemeProvider>
  );
}
