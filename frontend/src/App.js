import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout'; // <-- add karo
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Shops from './pages/Shops';
import ShopForm from './pages/ShopForm';
import ShopDetail from './pages/ShopDetail';
import Products from './pages/Products';
import ActivityTypes from './pages/ActivityTypes';
import ActivityTypeForm from './pages/ActivityTypeForm';
import Forms from './pages/Forms';
import FormEditor from './pages/FormEditor';
import Submissions from './pages/Submissions';
import SubmissionDetail from './pages/SubmissionDetail';
import Reports from './pages/Reports';
import Territories from './pages/Territories';
import Settings from './pages/Settings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Layout wrap */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/new" element={<UserForm />} />
        <Route path="/users/edit/:id" element={<UserForm />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/shops/new" element={<ShopForm />} />
        <Route path="/shops/edit/:id" element={<ShopForm />} />
        <Route path="/shops/:id" element={<ShopDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/activity-types" element={<ActivityTypes />} />
        <Route path="/activity-types/new" element={<ActivityTypeForm />} />
        <Route path="/activity-types/edit/:id" element={<ActivityTypeForm />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/forms/new" element={<FormEditor />} />
        <Route path="/forms/edit/:id" element={<FormEditor />} />
        <Route path="/submissions" element={<Submissions />} />
        <Route path="/submissions/:id" element={<SubmissionDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/territories" element={<Territories />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Toaster position="top-right" />
          <AppRoutes />
        </QueryClientProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;