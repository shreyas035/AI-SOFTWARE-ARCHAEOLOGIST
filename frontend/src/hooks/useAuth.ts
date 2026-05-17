import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@store/authStore';
import { authApi } from '@services/api';
import { User } from '@types';

/**
 * Custom hook for authentication operations
 */
export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token, isAuthenticated, login: setLogin, logout: setLogout, setLoading } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setLogin(user, accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Login successful!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      authApi.register(name, email, password),
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setLogin(user, accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Registration successful!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      setLogout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    },
    onError: () => {
      // Still logout locally even if API call fails
      setLogout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      queryClient.clear();
      navigate('/login');
    },
  });

  // Get current user query
  const { data: currentUser, isLoading: isLoadingUser, error: queryError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      // Usually authApi returns { success: true, data: user }
      return (response.data?.data || response.data) as User;
    },
    enabled: !!token && !user,
    retry: false,
  });

  // Handle successful user fetch
  useEffect(() => {
    if (currentUser) {
      useAuthStore.getState().setUser(currentUser);
      setLoading(false);
    }
  }, [currentUser, setLoading]);

  // Handle fetch error
  useEffect(() => {
    if (queryError) {
      setLogout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');
      setLoading(false);
    }
  }, [queryError, setLogout, setLoading]);

  const login = useCallback(
    (email: string, password: string) => {
      loginMutation.mutate({ email, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    (name: string, email: string, password: string) => {
      registerMutation.mutate({ name, email, password });
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoadingUser || useAuthStore.getState().isLoading,
    login,
    register,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}

// Made with Bob
