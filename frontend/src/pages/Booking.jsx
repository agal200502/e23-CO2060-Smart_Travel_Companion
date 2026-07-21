import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft } from 'lucide-react';

const Booking = () => {
  const { accommodationId } = useParams();
  const navigate = useNavigate();
  const [accommodation, setAccommodation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomsBooked: 1,
  });

  const today = new Date().toISOString().slice(0, 10);
  const minCheckOut = formData.checkIn
    ? new Date(new Date(formData.checkIn).getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  useEffect(() => {
    const fetchAccommodation = async () => {
      try {
        const response = await api.get('/accommodations');
        const found = response.data.find((item) => String(item.id) === accommodationId);
        if (!found) {
          setError('Accommodation not found.');
          return;
        }
        setAccommodation(found);
      } catch (fetchError) {
        console.error(fetchError);
        setError('Unable to load accommodation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodation();
  }, [accommodationId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]:
          name === 'guests' || name === 'roomsBooked'
            ? Number(value)
            : value,
      };
      if (name === 'checkIn' && next.checkOut && new Date(next.checkOut) <= new Date(value)) {
        next.checkOut = '';
      }
      return next;
    });
  };

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const diff = checkOutDate - checkInDate;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  };

  const nights = calculateNights();
  const totalPrice = accommodation?.price ? accommodation.price * nights * formData.roomsBooked : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.checkIn || !formData.checkOut) {
      setError('Please select check-in and check-out dates.');
      return;
    }

    if (new Date(formData.checkIn) < new Date(today)) {
      setError('Check-in date must be today or later.');
      return;
    }

    if (nights <= 0) {
      setError('Check-out date must be after check-in date.');
      return;
    }
    if (formData.roomsBooked > accommodation.totalRooms) {
      setError(
        `Only ${accommodation.totalRooms} room(s) are available.`
      );
      return;
    }

    try {
      await api.post('/bookings', {
        accommodationId: accommodation.id,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: formData.guests,
        roomsBooked: formData.roomsBooked,
      });
      navigate(`/accommodation/${accommodation.locationId}`, {
        state: { bookingSuccess: true, bookingStatus: 'PENDING', bookedAccommodationId: accommodation.id },
      });
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.response?.data || 'Could not submit booking.');
    }
  };

  if (loading) {
    return <div className="container text-center mt-6">Loading booking details...</div>;
  }

  if (error) {
    return (
      <div className="container mt-6">
        <div className="glass p-4">
          <p className="text-error">{error}</p>
          <Link to="/explore" className="btn btn-outline mt-4">
            <ArrowLeft size={16} /> Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in mb-6">
      <Link to={`/accommodation/${accommodation.locationId}`} className="btn btn-outline btn-sm mb-4">
        <ArrowLeft size={16} /> Back to stays
      </Link>

      <div className="glass p-6" style={{ maxWidth: 680, margin: '0 auto' }}>
        <h2 className="mb-3">Book {accommodation.name}</h2>

        <div className="booking-summary glass p-4 mb-4" style={{ display: 'grid', gap: '1rem' }}>
          <img
            src={accommodation.imageUrl || 'https://via.placeholder.com/720x320?text=Hotel'}
            alt={accommodation.name}
            style={{ width: '100%', borderRadius: 'var(--radius)' }}
          />

          <div>
            <p style={{ marginBottom: '0.5rem' }}><strong>Price per night:</strong> ${accommodation.price}</p>
            <p><strong>Rooms available:</strong> {accommodation.totalRooms ?? 'Multiple'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass p-4" style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <label>
              Check-in
              <input
                type="date"
                name="checkIn"
                min={today}
                value={formData.checkIn}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Check-out
              <input
                type="date"
                name="checkOut"
                min={minCheckOut}
                value={formData.checkOut}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            Number of guests
            <input
              type="number"
              name="guests"
              min="1"
              value={formData.guests}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Rooms Required
            <input
              type="number"
              name="roomsBooked"
              min="1"
              max={accommodation.totalRooms}
              value={formData.roomsBooked}
              onChange={handleChange}
              required
            />
          </label>

          <div className="booking-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="text-muted">Nights: {nights}</p>
              <p className="text-lg"><strong>Total price:</strong> ${totalPrice}</p>
            </div>
            <button type="submit" className="btn btn-primary">
              Confirm Booking
            </button>
          </div>

          {success && <p className="text-success">{success}</p>}
          {error && <p className="text-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Booking;
