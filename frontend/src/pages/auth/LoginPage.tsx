import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { validation } from '@utils/validation';

/**
 * Login page component
 */
export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: { email?: string; password?: string } = {};
    
    if (!validation.required(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validation.email(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!validation.required(formData.password)) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit login
    login(formData.email, formData.password);
  };

  return (
    <div className="w-full">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-dark-400">Sign in to continue your code archaeology journey</p>
      </motion.div>

      {/* Login Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass rounded-2xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            leftIcon={<Mail className="w-5 h-5" />}
            autoComplete="email"
            required
          />

          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            leftIcon={<Lock className="w-5 h-5" />}
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-dark-300 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoggingIn}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-dark-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-center text-dark-500 text-sm mt-8"
      >
        By signing in, you agree to our Terms of Service and Privacy Policy
      </motion.p>
    </div>
  );
}

// Made with Bob
