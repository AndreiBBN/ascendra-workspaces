import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Ascendra Workspaces</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage cloud developer machines from one workspace.</p>
            </div>
          </div>
        </div>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-50">Sign In</CardTitle>
            <CardDescription className="dark:text-gray-400">Enter your credentials to access the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                    Demo access
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onClick={() => navigate('/developer')}
                  >
                    Developer
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Cloud developer machine management platform
        </p>
      </div>
    </div>
  );
}
