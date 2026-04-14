'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TYPES = [
  { value: 'license', label: 'License Renewal', icon: '📋', desc: 'e.g. liquor licence, fire certificate, operating permit' },
  { value: 'rates', label: 'Rate Upload (CRS)', icon: '📊', desc: 'e.g. upload seasonal rates to central reservations system' },
  { value: 'payment', label: 'Client Payment', icon: '💰', desc: 'e.g. collect deposit or balance from a client' },
  { value: 'anniversary', label: 'Wedding Anniversary', icon: '💍', desc: 'e.g. greet or send message to anniversary guests' },
];

export default function NewReminderPage() {
  const router = useRouter();
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default reminder date for min value = today
  const todayStr = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!type) { setError('Please select a reminder type.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!eventDate) { setError('Please select the event date.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), type, eventDate, clientName: clientName.trim(), notes: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      router.push('/reminders');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/reminders" className="text-green-700 hover:text-green-900 font-bold text-lg">
          ← Back
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Add Reminder</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Type selector */}
        <div>
          <label className="block text-gray-700 font-bold mb-3">What type of reminder?</label>
          <div className="grid grid-cols-1 gap-3">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  type === t.value
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mt-0.5">{t.icon}</span>
                <div>
                  <p className="font-bold text-gray-800">{t.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
                </div>
                {type === t.value && (
                  <span className="ml-auto text-green-600 font-bold text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Liquor licence renewal — expires June 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Event date */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            Event / Due Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="input-field"
            value={eventDate}
            min={todayStr}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
          <p className="text-gray-400 text-sm mt-1">
            You will see this reminder highlighted 2 weeks before this date.
          </p>
        </div>

        {/* Client name (optional) */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            Client Name <span className="text-gray-400 font-normal text-sm">(optional)</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Mr &amp; Mrs Johnson"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            Notes <span className="text-gray-400 font-normal text-sm">(optional)</span>
          </label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Any extra details or instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Reminder'}
        </button>

        <Link href="/reminders" className="btn-secondary text-center">
          Cancel
        </Link>
      </form>
    </div>
  );
}
