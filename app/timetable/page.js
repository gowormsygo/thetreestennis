'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatTime, formatDate, getTodayStr, getMaxDateStr } from '../../lib/utils';

// Build the list of dates from today through today+7
function getWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function DayShortLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const today = getTodayStr();
  if (dateStr === today) return 'Today';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
  if (dateStr === tomorrowStr) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export default function TimetablePage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('tennisUser');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/timetable');
        const data = await res.json();
        if (res.ok) {
          setBookings(data.bookings);
        } else {
          setError(data.error || 'Could not load timetable.');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const dates = getWeekDates();

  // Group bookings by date
  const bookingsByDate = {};
  for (const b of bookings) {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
    bookingsByDate[b.date].push(b);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Weekly Timetable</h2>
          <p className="text-gray-500 text-sm">All bookings for the next 7 days</p>
        </div>
        <Link
          href={currentUser ? '/book' : '/'}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Book
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-lg">Loading timetable...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {dates.map((dateStr) => {
            const dayBookings = bookingsByDate[dateStr] || [];
            const isToday = dateStr === getTodayStr();

            return (
              <div
                key={dateStr}
                className={`card ${isToday ? 'border-2 border-green-500' : ''}`}
              >
                {/* Day header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className={`font-bold text-lg ${isToday ? 'text-green-700' : 'text-gray-800'}`}>
                      {DayShortLabel(dateStr)}
                      {isToday && (
                        <span className="ml-2 bg-green-700 text-white text-xs px-2 py-0.5 rounded-full align-middle">
                          Today
                        </span>
                      )}
                    </span>
                    <p className="text-gray-400 text-sm">{formatDate(dateStr)}</p>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    dayBookings.length === 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {dayBookings.length === 0 ? 'Fully open' : `${dayBookings.length} booking${dayBookings.length > 1 ? 's' : ''}`}
                  </span>
                </div>

                {dayBookings.length === 0 ? (
                  <div className="flex items-center gap-2 py-3 px-4 bg-green-50 rounded-xl">
                    <span className="text-green-600 text-xl">🎾</span>
                    <span className="text-green-700 font-medium">Court is fully available all day</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Booked slots */}
                    {dayBookings.map((b) => {
                      const isMe = currentUser && b.user.id === currentUser.id;
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                            isMe
                              ? 'bg-blue-50 border-2 border-blue-300'
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{isMe ? '👤' : '🔒'}</span>
                            <div>
                              <p className={`font-bold text-sm ${isMe ? 'text-blue-800' : 'text-red-800'}`}>
                                {formatTime(b.startTime)} – {formatTime(b.endTime)}
                              </p>
                              <p className={`text-xs mt-0.5 ${isMe ? 'text-blue-600' : 'text-red-500'}`}>
                                {isMe ? `You (${b.numPlayers} player${b.numPlayers > 1 ? 's' : ''})` : `${b.user.name} · ${b.numPlayers} player${b.numPlayers > 1 ? 's' : ''}`}
                              </p>
                            </div>
                          </div>
                          {isMe && (
                            <Link
                              href="/my-bookings"
                              className="text-blue-600 text-xs font-semibold underline"
                            >
                              Manage
                            </Link>
                          )}
                        </div>
                      );
                    })}

                    {/* Free time indicator */}
                    <FreeTimeSummary dayBookings={dayBookings} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="card bg-gray-50">
        <p className="font-semibold text-gray-600 text-sm mb-2">Legend</p>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
            <span className="text-gray-600">Court available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
            <span className="text-gray-600">Booked by a neighbour</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block"></span>
            <span className="text-gray-600">Your booking</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shows a compact summary of remaining free time in the day
function FreeTimeSummary({ dayBookings }) {
  // Build 30-min blocks from 06:00 to 22:00 (in minutes: 360 to 1320)
  const bookedMinutes = new Set();
  for (const b of dayBookings) {
    const [sh, sm] = b.startTime.split(':').map(Number);
    const [eh, em] = b.endTime.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    for (let t = start; t < end; t += 30) {
      bookedMinutes.add(t);
    }
  }

  // Find contiguous free blocks of at least 60 minutes
  const freeBlocks = [];
  let blockStart = null;
  for (let t = 360; t <= 1320; t += 30) {
    if (!bookedMinutes.has(t) && t < 1320) {
      if (blockStart === null) blockStart = t;
    } else {
      if (blockStart !== null) {
        const duration = t - blockStart;
        if (duration >= 60) {
          freeBlocks.push({ start: blockStart, end: t });
        }
        blockStart = null;
      }
    }
  }

  if (freeBlocks.length === 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-1">
        No free slots of 1 hour or more remaining
      </div>
    );
  }

  const pad = (n) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  const fmt = (t) => {
    const h = Math.floor(t / 60);
    const m = t % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="mt-1">
      <p className="text-xs text-gray-500 font-semibold mb-1.5">Free slots:</p>
      <div className="flex flex-wrap gap-1.5">
        {freeBlocks.map((b) => (
          <span
            key={b.start}
            className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-lg"
          >
            {fmt(b.start)} – {fmt(b.end)}
          </span>
        ))}
      </div>
    </div>
  );
}
