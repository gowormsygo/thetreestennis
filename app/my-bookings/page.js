'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatTime, formatDate, getTodayStr, getMaxDateStr } from '../../lib/utils';

const DURATIONS = [
  { value: 60, label: '1 Hour' },
  { value: 90, label: '1½ Hours' },
  { value: 120, label: '2 Hours' },
];

export default function MyBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBooking, setEditingBooking] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [editNumPlayers, setEditNumPlayers] = useState(2);
  const [editSlots, setEditSlots] = useState([]);
  const [editSelectedSlot, setEditSelectedSlot] = useState(null);
  const [editSlotsLoading, setEditSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('tennisUser');
    if (!stored) {
      router.replace('/');
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?userId=${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setBookings(data.bookings);
      }
    } catch {
      setError('Could not load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const loadEditSlots = useCallback(async () => {
    if (!editDate || !editDuration) return;
    setEditSlotsLoading(true);
    setEditSelectedSlot(null);
    try {
      const res = await fetch(`/api/slots?date=${editDate}&duration=${editDuration}`);
      const data = await res.json();
      if (res.ok) {
        setEditSlots(data.slots);
      }
    } catch {
      // ignore
    } finally {
      setEditSlotsLoading(false);
    }
  }, [editDate, editDuration]);

  useEffect(() => {
    if (editingBooking) {
      loadEditSlots();
    }
  }, [editingBooking, loadEditSlots]);

  function startEdit(booking) {
    setEditingBooking(booking);
    setEditDate(booking.date);
    const durationMins =
      (parseInt(booking.endTime.split(':')[0]) * 60 + parseInt(booking.endTime.split(':')[1])) -
      (parseInt(booking.startTime.split(':')[0]) * 60 + parseInt(booking.startTime.split(':')[1]));
    setEditDuration(durationMins);
    setEditNumPlayers(booking.numPlayers);
    setEditSelectedSlot({ startTime: booking.startTime, endTime: booking.endTime });
    setError('');
  }

  async function handleSaveEdit() {
    if (!editSelectedSlot || !editingBooking) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          date: editDate,
          startTime: editSelectedSlot.startTime,
          endTime: editSelectedSlot.endTime,
          numPlayers: editNumPlayers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not update booking.');
        return;
      }
      setEditingBooking(null);
      loadBookings();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(bookingId) {
    setCancellingId(bookingId);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}?userId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not cancel booking.');
        return;
      }
      setConfirmCancelId(null);
      loadBookings();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }

  if (!user) return null;

  const today = getTodayStr();
  const upcomingBookings = bookings.filter((b) => b.date >= today);
  const pastBookings = bookings.filter((b) => b.date < today);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-800">My Bookings</h2>
          <p className="text-gray-500 text-sm">{user.name}</p>
        </div>
        <Link href="/book" className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
          + New Booking
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Edit modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setEditingBooking(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-800">Change Booking</h3>
                <button onClick={() => setEditingBooking(null)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">×</button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Date */}
                <div>
                  <label className="block text-gray-600 font-semibold mb-2">Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={editDate}
                    min={today}
                    max={getMaxDateStr()}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-gray-600 font-semibold mb-2">Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setEditDuration(d.value)}
                        className={`py-3 rounded-xl font-bold text-sm border-2 transition-colors ${
                          editDuration === d.value
                            ? 'bg-green-700 border-green-700 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Players */}
                <div>
                  <label className="block text-gray-600 font-semibold mb-2">Players</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditNumPlayers(Math.max(1, editNumPlayers - 1))} className="w-12 h-12 rounded-full bg-green-100 hover:bg-green-200 text-green-800 text-2xl font-bold flex items-center justify-center">−</button>
                    <span className="text-3xl font-bold text-green-800 w-12 text-center">{editNumPlayers}</span>
                    <button onClick={() => setEditNumPlayers(Math.min(8, editNumPlayers + 1))} className="w-12 h-12 rounded-full bg-green-100 hover:bg-green-200 text-green-800 text-2xl font-bold flex items-center justify-center">+</button>
                  </div>
                </div>

                {/* Time slots */}
                <div>
                  <label className="block text-gray-600 font-semibold mb-2">Time Slot</label>
                  {editSlotsLoading ? (
                    <p className="text-gray-400 text-sm py-4 text-center">Loading times...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {editSlots.map((slot) => {
                        const isOriginal =
                          slot.startTime === editingBooking.startTime &&
                          editDate === editingBooking.date;
                        const isAvailable = slot.available || isOriginal;
                        const isSelected = editSelectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            disabled={!isAvailable}
                            onClick={() => setEditSelectedSlot(slot)}
                            className={
                              !isAvailable
                                ? 'slot-taken text-sm'
                                : isSelected
                                ? 'slot-selected text-sm'
                                : 'slot-available text-sm'
                            }
                          >
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                            {!isAvailable && <div className="text-xs">Taken</div>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button className="btn-primary" onClick={handleSaveEdit} disabled={saving || !editSelectedSlot}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming bookings */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-lg">Loading your bookings...</div>
      ) : (
        <>
          <section>
            <h3 className="font-bold text-gray-600 text-base mb-3 uppercase tracking-wide">Upcoming</h3>
            {upcomingBookings.length === 0 ? (
              <div className="card text-center text-gray-500 py-8">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-lg">No upcoming bookings</p>
                <Link href="/book" className="text-green-700 font-semibold underline mt-2 inline-block">
                  Book a slot now →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingBookings.map((b) => (
                  <div key={b.id} className="card border-l-4 border-l-green-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-green-800 text-lg">{formatDate(b.date)}</p>
                        <p className="text-gray-700 text-base mt-1">
                          ⏰ {formatTime(b.startTime)} – {formatTime(b.endTime)}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">👥 {b.numPlayers} player{b.numPlayers !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {confirmCancelId === b.id ? (
                      <div className="mt-4 bg-red-50 rounded-xl p-4">
                        <p className="text-red-700 font-semibold mb-3">Are you sure you want to cancel this booking?</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleCancel(b.id)}
                            disabled={cancellingId === b.id}
                            className="btn-danger flex-1"
                          >
                            {cancellingId === b.id ? 'Cancelling...' : 'Yes, Cancel'}
                          </button>
                          <button
                            onClick={() => setConfirmCancelId(null)}
                            className="btn-secondary flex-1"
                            style={{ padding: '12px 20px' }}
                          >
                            Keep It
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => startEdit(b)}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-xl text-sm border-2 border-blue-200 transition-colors"
                        >
                          ✏️ Change Time
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(b.id)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-4 rounded-xl text-sm border-2 border-red-200 transition-colors"
                        >
                          🗑️ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {pastBookings.length > 0 && (
            <section>
              <h3 className="font-bold text-gray-400 text-base mb-3 uppercase tracking-wide">Past Bookings</h3>
              <div className="flex flex-col gap-3">
                {pastBookings.map((b) => (
                  <div key={b.id} className="card opacity-60 border-l-4 border-l-gray-300">
                    <p className="font-semibold text-gray-600">{formatDate(b.date)}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {formatTime(b.startTime)} – {formatTime(b.endTime)} · {b.numPlayers} player{b.numPlayers !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
