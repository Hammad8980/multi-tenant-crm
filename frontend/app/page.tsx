'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Shield, 
  Zap, 
  Database, 
  CheckCircle, 
  ArrowRight,
  Lock,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Only redirect after hydration is complete
    if (_hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  // Show nothing while hydrating
  if (!_hasHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
            Multi-Tenant CRM System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-slide-up animation-delay-200">
            A production-grade Customer Relationship Management system with 
            enterprise-level security, concurrency handling, and real-time updates.
          </p>
          <div className="flex gap-4 justify-center animate-slide-up animation-delay-400">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-blue-600" />}
            title="Multi-Tenancy"
            description="Complete data isolation between organizations with enterprise-grade security"
            delay="0"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-purple-600" />}
            title="Concurrency Safe"
            description="Pessimistic locking prevents race conditions in customer assignments"
            delay="100"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8 text-green-600" />}
            title="Soft Delete"
            description="Restore deleted customers with full data preservation and audit trail"
            delay="200"
          />
          <FeatureCard
            icon={<Activity className="w-8 h-8 text-orange-600" />}
            title="Activity Logs"
            description="Comprehensive audit trail tracking all customer and note operations"
            delay="300"
          />
        </div>

        {/* Tech Stack */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12 animate-fade-in">
            Built with Modern Technologies
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <TechStackCard
              title="Backend"
              technologies={[
                'NestJS + TypeScript',
                'PostgreSQL + TypeORM',
                'JWT Authentication',
                'Swagger API Docs',
                'Activity Logging'
              ]}
            />
            <TechStackCard
              title="Frontend"
              technologies={[
                'Next.js 14 (App Router)',
                'React Query + Zustand',
                'Tailwind CSS + shadcn/ui',
                'TypeScript (Strict)',
                'Debounced Search'
              ]}
            />
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12 animate-fade-in">
            Production-Ready Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <KeyFeature
              icon={<Users className="w-6 h-6" />}
              title="Customer Management"
              description="Full CRUD operations with pagination, search, and filtering"
            />
            <KeyFeature
              icon={<Lock className="w-6 h-6" />}
              title="Role-Based Access"
              description="Admin and member roles with granular permissions"
            />
            <KeyFeature
              icon={<CheckCircle className="w-6 h-6" />}
              title="5-Customer Limit"
              description="Enforced with database-level locking for consistency"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 border-0 animate-fade-in">
            <CardContent className="pt-12 pb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-blue-100 mb-8 text-lg">
                Login with demo credentials and explore the full-featured CRM system
              </p>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Login Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <div className="mt-6 text-sm text-blue-100">
                <p>Demo: admin@acme.com / password123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-24 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Built with ❤️ using NestJS, Next.js, and PostgreSQL</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay: string;
}) {
  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="pt-6">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function TechStackCard({ 
  title, 
  technologies 
}: { 
  title: string; 
  technologies: string[];
}) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
        <ul className="space-y-3">
          {technologies.map((tech, index) => (
            <li key={index} className="flex items-center text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span>{tech}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function KeyFeature({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="text-center hover:shadow-lg transition-all duration-300 animate-fade-in">
      <CardContent className="pt-8 pb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
