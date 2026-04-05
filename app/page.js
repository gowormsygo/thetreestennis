'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If already logged in, go to book page
    const user = localStorage.getItem('tennisUser');
    if (user) {
      router.replace('/book');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">🎾</div>
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      localStorage.setItem('tennisUser', JSON.stringify(data.user));
      router.push('/book');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center py-4">
        <div className="text-6xl mb-3">🎾</div>
        <h2 className="text-3xl font-bold text-green-800">Welcome!</h2>
        <p className="text-gray-600 mt-2 text-lg">
          Book your slot at the communal tennis court.
        </p>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-gray-700 mb-5">Enter your details to get started</h3>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-5 text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-gray-600 font-semibold mb-2 text-base">
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Sarah Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-2 text-base">
              Mobile Number
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="e.g. 07700 900123"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
              autoComplete="tel"
            />
            <p className="text-gray-400 text-sm mt-1">Used to identify you — no password needed</p>
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Please wait...' : 'Continue →'}
          </button>
        </form>
      </div>

      <div className="card bg-green-700 text-white">
        <h4 className="font-bold text-lg mb-3">Booking Rules</h4>
        <ul className="space-y-2 text-green-100">
          <li>✅ Book up to <strong>7 days</strong> in advance</li>
          <li>✅ <strong>1 booking</strong> per person per day</li>
          <li>✅ Slots between <strong>6:00 AM – 10:00 PM</strong></li>
          <li>✅ Maximum <strong>2 hours</strong> per slot</li>
        </ul>
      </div>
    </div>
  );
}
