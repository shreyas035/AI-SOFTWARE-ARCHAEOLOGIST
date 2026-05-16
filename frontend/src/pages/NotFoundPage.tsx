import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '@components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-dark-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/">
            <Button variant="primary" leftIcon={<Home className="w-5 h-5" />}>
              Go Home
            </Button>
          </Link>
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
