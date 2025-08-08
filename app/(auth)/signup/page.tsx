'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);

    // quick client-side checks
    if (!name.trim()) return setFormError('Please enter your name.');
    if (!email.trim()) return setFormError('Please enter your email.');
    if (!password) return setFormError('Please enter a password.');
    if (password !== confirm) return setFormError('Passwords do not match.');
    if (!agree) return setFormError('You must agree to the Privacy Policy.');

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANT: no reCAPTCHA header, just the fields the API expects
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      // Try to parse a JSON message if provided
      const data: { message?: string } | undefined = await res
        .json()
        .catch(() => undefined);

      if (!res.ok) {
        const msg = data?.message || 'Sign up failed. Please try again.';
        toast.error(msg);
        return setFormError(msg);
      }

      toast.success('Account created! Please sign in.');
      router.push('/signin'); // change to your desired route
    } catch (err) {
      const msg = 'Network error. Please try again.';
      toast.error(msg);
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-3xl font-semibold">
          Sign Up to Metronic
        </h1>

        {/* Social (optional – keep or remove) */}
        <button
          type="button"
          className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium"
          onClick={() => toast('Google sign-in not wired yet')}
        >
          <span className="align-middle">Sign up with Google</span>
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">or</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Confirm Password
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <a
                className="text-blue-600 underline"
                href="/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </a>
            </span>
          </label>

          {formError ? (
            <p className="text-sm text-red-600">{formError}</p>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account…' : 'Continue'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a className="text-blue-600 underline" href="/signin">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
