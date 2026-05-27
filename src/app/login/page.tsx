'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Waves } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Invalid password');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Subtle background texture */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.5 0 0) 0.5px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative w-full max-w-[360px]">
        {/* Logo & Title */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <Waves className="h-6 w-6" />
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-foreground">
            VibeVoice
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Text-to-audio studio
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card p-7 shadow-md shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter team password"
                autoFocus
                disabled={isLoading}
                className="h-11 bg-background text-[15px] placeholder:text-muted-foreground/50"
              />
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="h-11 w-full text-sm font-semibold shadow-none transition-all"
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Powered by MiniMax T2A
        </p>
      </div>
    </div>
  );
}
