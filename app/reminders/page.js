'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const TYPE_CONFIG = {
  license: {
    label: 'License Renewal',
    icon: '📋',
    color: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  rates: {
    label: 'Rate Upload (CRS)',
    icon: '📊',
    color: 'bg-purple-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
  },
  payment: {
    label: 'Client Payment',
    icon: '💰',
    color: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
  },
  anniversary: {
    label: 'Wedding Anniversary',
    icon: '💍',
    color: 'bg-pink-50 border-pink-200',
    badge: 'bg-pink-100 text-pink-800',
    dot: 'bg-pink-500',
  },
};

function getDaysUntil(eventDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(eventDate + 'T00:00:00');
  const diff = Math.round((event - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function UrgencyBadge({ days }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        Overdue by {Math.abs(days)}d
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        Due today!
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
        {days}d left — urgent
      </span>
    );
  }
  if (days <= 14) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
        {days}d left — due soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      In {days} days
    </span>
  );
}

function ReminderCard({ reminder, onComplete, onDelete }) {
  const days = getDaysUntil(reminder.eventDate);
  const cfg = TYPE_CONFIG[reminder.type] ?? TYPE_CONFIG.license;
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={`rounded-2xl border-2 p-4 ${cfg.color} flex flex-col gap-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl">{cfg.icon}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
          <UrgencyBadge days={days} />
        </div>
      </div>

      <p className="font-bold text-gray-800 text-base leading-snug">{reminder.title}</p>

      {reminder.clientName && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Client:</span> {reminder.clientName}
        </p>
      )}

      <p className="text-sm text-gray-500 font-medium">
        {days < 0
          ? `Was due: ${formatDate(reminder.eventDate)}`
          : `Due: ${formatDate(reminder.eventDate)}`}
      </p>

      {reminder.notes && (
        <p className="text-sm text-gray-600 bg-white/60 rounded-xl px-3 py-2 italic">
          {reminder.notes}
        </p>
      )}

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onComplete(reminder.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-3 rounded-xl transition-colors"
        >
          ✓ Mark Done
        </button>
        {confirming ? (
          <button
            onClick={() => onDelete(reminder.id)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded-xl transition-colors"
          >
            Confirm delete
          </button>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="bg-white hover:bg-gray-50 text-gray-500 text-sm font-bold py-2 px-3 rounded-xl border-2 border-gray-200 transition-colors"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, reminders, onComplete, onDelete, accent }) {
  if (reminders.length === 0) return null;
  return (
    <div>
      <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${accent}`}>{title}</h3>
      <div className="flex flex-col gap-3">
        {reminders.map((r) => (
          <ReminderCard key={r.id} reminder={r} onComplete={onComplete} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completedList, setCompletedList] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reminders');
      const data = await res.json();
      setReminders(data.reminders ?? []);

      if (showCompleted) {
        const res2 = await fetch('/api/reminders?showCompleted=true');
        const data2 = await res2.json();
        setCompletedList((data2.reminders ?? []).filter((r) => r.completed));
      }
    } finally {
      setLoading(false);
    }
  }, [showCompleted]);

  useEffect(() => { load(); }, [load]);

  async function handleComplete(id) {
    await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    load();
  }

  async function handleDelete(id) {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
    load();
  }

  const overdue = reminders.filter((r) => getDaysUntil(r.eventDate) < 0);
  const urgent = reminders.filter((r) => { const d = getDaysUntil(r.eventDate); return d >= 0 && d <= 7; });
  const dueSoon = reminders.filter((r) => { const d = getDaysUntil(r.eventDate); return d > 7 && d <= 14; });
  const upcoming = reminders.filter((r) => getDaysUntil(r.eventDate) > 14);

  const alertCount = overdue.length + urgent.length + dueSoon.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Reminders</h2>
          <p className="text-gray-500 text-sm mt-0.5">Stay on top of upcoming tasks &amp; events</p>
        </div>
        <Link
          href="/reminders/new"
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          + Add
        </Link>
      </div>

      {/* Summary stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <div className={`card p-4 text-center ${alertCount > 0 ? 'border-2 border-red-200 bg-red-50' : ''}`}>
            <div className={`text-3xl font-black ${alertCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {alertCount}
            </div>
            <div className="text-xs text-gray-500 font-semibold mt-0.5">Need attention</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-black text-gray-500">{upcoming.length}</div>
            <div className="text-xs text-gray-500 font-semibold mt-0.5">Upcoming</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">⏳</div>
          <p>Loading reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-xl font-bold text-gray-700">All clear!</p>
          <p className="text-gray-500 mt-1 text-sm">No pending reminders. Add one below.</p>
          <Link
            href="/reminders/new"
            className="inline-block mt-5 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            + Add Reminder
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Section
            title="Overdue"
            reminders={overdue}
            onComplete={handleComplete}
            onDelete={handleDelete}
            accent="text-red-600"
          />
          <Section
            title="Urgent — within 1 week"
            reminders={urgent}
            onComplete={handleComplete}
            onDelete={handleDelete}
            accent="text-amber-600"
          />
          <Section
            title="Due soon — within 2 weeks"
            reminders={dueSoon}
            onComplete={handleComplete}
            onDelete={handleDelete}
            accent="text-yellow-700"
          />
          <Section
            title="Upcoming"
            reminders={upcoming}
            onComplete={handleComplete}
            onDelete={handleDelete}
            accent="text-gray-500"
          />
        </div>
      )}

      {/* Completed toggle */}
      <div>
        <button
          onClick={() => setShowCompleted((v) => !v)}
          className="text-sm text-gray-400 hover:text-gray-600 font-medium underline"
        >
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </button>

        {showCompleted && completedList.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {completedList.map((r) => {
              const cfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.license;
              return (
                <div key={r.id} className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4 opacity-60 flex items-center gap-3">
                  <span className="text-2xl">{cfg.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-500 line-through text-sm">{r.title}</p>
                    {r.clientName && <p className="text-xs text-gray-400">{r.clientName}</p>}
                    <p className="text-xs text-gray-400">{formatDate(r.eventDate)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-gray-400 hover:text-red-500 text-sm"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showCompleted && completedList.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">No completed reminders yet.</p>
        )}
      </div>
    </div>
  );
}
