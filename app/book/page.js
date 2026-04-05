'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatTime, formatDate, getTodayStr, getMaxDateStr } from '../../lib/utils';
import Link from 'next/link';

const DURATIONS = [
  { value: 60, label: '1 Hour' },
  { value: 90, label: '1½ Hours' },
  { value: 120, label: '2 Hours' },
];

export default function BookPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(getTodayStr());
  const [duration, setDuration] = useState(60);
  const [numPlayers, setNumPlayers] = useState(2);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userBookingOnDate, setUserBookingOnDate] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('tennisUser');
    if (!stored) {
      router.replace('/');
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const loadSlots = useCallback(async () => {
    if (!date || !user) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    setError('');
    try {
      const res = await fetch(`/api/slots?date=${date}&duration=${duration}`);
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots);
        // Check if user already has a booking on this date
        const existing = data.bookings.find((b) => b.userId === user.id);
        setUserBookingOnDate(existing || null);
      }
    } catch {
      setError('Could not load available slots. Please try again.');
    } finally {
      setSlotsLoading(false);
    }
  }, [date, duration, user]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  async function handleBook() {
    if (!selectedSlot) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          numPlayers,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Booking failed. Please try again.');
        return;
      }

      setSuccess(`✅ Booked! ${formatDate(date)}, ${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}`);
      setSelectedSlot(null);
      loadSlots();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('tennisUser');
    router.push('/');
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* User greeting + nav */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">Logged in as</p>
          <p className="font-bold text-green-800 text-lg">{user.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/my-bookings" className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            My Bookings
          </Link>
          <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            Log out
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-4 text-green-800 font-medium text-base">
          {success}
          <div className="mt-3">
            <Link href="/my-bookings" className="btn-primary inline-block text-center" style={{ padding: '12px 24px', width: 'auto' }}>
              View My Bookings
            </Link>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Already booked on this date warning */}
      {userBookingOnDate && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-800">
          <p className="font-bold">You already have a booking on this day</p>
          <p className="text-sm mt-1">
            {formatTime(userBookingOnDate.startTime)} – {formatTime(userBookingOnDate.endTime)}
          </p>
          <Link href="/my-bookings" className="text-green-700 font-semibold underline text-sm mt-2 inline-block">
            Manage your bookings →
          </Link>
        </div>
      )}

      {/* Step 1: Pick Date */}
      <div className="card">
        <h3 className="font-bold text-xl text-gray-700 mb-4">
          <span className="bg-green-700 text-white rounded-full w-8 h-8 inline-flex items-center justify-center text-base mr-2">1</span>
          Pick a Date
        </h3>
        <input
          type="date"
          className="input-field"
          value={date}
          min={getTodayStr()}
          max={getMaxDateStr()}
          onChange={(e) => setDate(e.target.value)}
        />
        {date && (
          <p className="text-green-700 font-medium mt-2 text-base">{formatDate(date)}</p>
        )}
      </div>

      {/* Step 2: Duration */}
      <div className="card">
        <h3 className="font-bold text-xl text-gray-700 mb-4">
          <span className="bg-green-700 text-white rounded-full w-8 h-8 inline-flex items-center justify-center text-base mr-2">2</span>
          How Long?
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`py-4 rounded-xl font-bold text-base border-2 transition-colors ${
                duration === d.value
                  ? 'bg-green-700 border-green-700 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Number of Players */}
      <div className="card">
        <h3 className="font-bold text-xl text-gray-700 mb-4">
          <span className="bg-green-700 text-white rounded-full w-8 h-8 inline-flex items-center justify-center text-base mr-2">3</span>
          Number of Players
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setNumPlayers(Math.max(1, numPlayers - 1))}
            className="w-14 h-14 rounded-full bg-green-100 hover:bg-green-200 text-green-800 text-3xl font-bold flex items-center justify-center transition-colors"
          >
            −
          </button>
          <span className="text-4xl font-bold text-green-800 w-16 text-center">{numPlayers}</span>
          <button
            onClick={() => setNumPlayers(Math.min(8, numPlayers + 1))}
            className="w-14 h-14 rounded-full bg-green-100 hover:bg-green-200 text-green-800 text-3xl font-bold flex items-center justify-center transition-colors"
          >
            +
          </button>
          <span className="text-gray-500 text-base ml-2">player{numPlayers !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Step 4: Pick Time */}
      <div className="card">
        <h3 className="font-bold text-xl text-gray-700 mb-4">
          <span className="bg-green-700 text-white rounded-full w-8 h-8 inline-flex items-center justify-center text-base mr-2">4</span>
          Pick a Time
        </h3>

        {slotsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading available times...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {slots.map((slot) => {
                const isSelected =
                  selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;
                return (
                  <button
                    key={slot.startTime}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={
                      !slot.available
                        ? 'slot-taken'
                        : isSelected
                        ? 'slot-selected'
                        : 'slot-available'
                    }
                  >
                    <div className="text-base">{formatTime(slot.startTime)}</div>
                    <div className="text-xs opacity-75">to {formatTime(slot.endTime)}</div>
                    {!slot.available && <div className="text-xs mt-1">Taken</div>}
                  </button>
                );
              })}
            </div>

            {slots.length === 0 && (
              <p className="text-gray-500 text-center py-6">No slots available for this date and duration.</p>
            )}
          </>
        )}
      </div>

      {/* Confirm button */}
      {selectedSlot && !userBookingOnDate && (
        <div className="card bg-green-50 border-2 border-green-300">
          <p className="font-bold text-green-800 text-lg mb-1">Your selection:</p>
          <p className="text-green-700 text-base mb-4">
            📅 {formatDate(date)}<br />
            ⏰ {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}<br />
            👥 {numPlayers} player{numPlayers !== 1 ? 's' : ''}
          </p>
          <button className="btn-primary" onClick={handleBook} disabled={loading}>
            {loading ? 'Booking...' : '✅ Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  );
}
