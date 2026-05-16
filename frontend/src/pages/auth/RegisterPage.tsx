import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { validation } from '@utils/validation';

/**
 * Register page component
 */
export default function RegisterPage() {
  const { register, isRegistering } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

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
    const newErrors: typeof errors = {};

    if (!validation.required(formData.name)) {
      newErrors.name = 'Name is required';
    } else if (!validation.minLength(formData.name, 2)) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!validation.required(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validation.email(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!validation.required(formData.password)) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validation.password(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    if (!validation.required(formData.confirmPassword)) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit registration
    register(formData.name, formData.email, formData.password);
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
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-dark-400">Start exploring legacy codebases with AI</p>
      </motion.div>

      {/* Register Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass rounded-2xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            name="name"
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            leftIcon={<User className="w-5 h-5" />}
            autoComplete="name"
            required
          />

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
            autoComplete="new-password"
            helperText="Must be at least 8 characters with uppercase, lowercase, and number"
            required
          />

          <Input
            type="password"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            leftIcon={<Lock className="w-5 h-5" />}
            autoComplete="new-password"
            required
          />

          <div className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              id="terms"
              className="w-4 h-4 mt-0.5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
              required
            />
            <label htmlFor="terms" className="text-dark-300">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-400 hover:text-primary-300">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isRegistering}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-dark-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Sign in
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
        Join thousands of developers using AI to understand legacy code
      </motion.p>
    </div>
  );
}

// Made with Bob
