package com.smarttravel.backend.service;

import com.smarttravel.backend.dto.BookingRequest;
import com.smarttravel.backend.exception.ResourceNotFoundException;
import com.smarttravel.backend.model.Accommodation;
import com.smarttravel.backend.model.Booking;
import com.smarttravel.backend.model.BookingStatus;
import com.smarttravel.backend.model.User;
import com.smarttravel.backend.repository.AccommodationRepository;
import com.smarttravel.backend.repository.BookingRepository;
import com.smarttravel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AccommodationRepository accommodationRepository;

    @Autowired
    private UserRepository userRepository;

    public Booking createBooking(Long userId, BookingRequest request) {
        validateDates(request.getCheckIn(), request.getCheckOut());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Accommodation accommodation = accommodationRepository.findById(request.getAccommodationId())
                .orElseThrow(() -> new ResourceNotFoundException("Accommodation not found"));

        int nights = calculateNights(request.getCheckIn(), request.getCheckOut());
        BigDecimal totalPrice = accommodation.getPrice().multiply(BigDecimal.valueOf(nights)).multiply(BigDecimal.valueOf(request.getRoomsBooked()));

        
        Integer configuredRooms = accommodation.getTotalRooms();

        int totalRooms = (configuredRooms == null) ? 0 : configuredRooms;

        if (request.getRoomsBooked() > totalRooms) {
            throw new IllegalArgumentException(
                    "Only " + totalRooms + " room(s) are available.");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setAccommodation(accommodation);
        booking.setCheckIn(Timestamp.valueOf(request.getCheckIn().atStartOfDay()));
        booking.setCheckOut(Timestamp.valueOf(request.getCheckOut().atStartOfDay()));
        booking.setGuests(request.getGuests());
        booking.setRoomsBooked(request.getRoomsBooked());
        booking.setTotalPrice(totalPrice);
        booking.setStatus(BookingStatus.PENDING);

        Booking savedBooking = bookingRepository.save(booking);

        accommodation.setTotalRooms(
                accommodation.getTotalRooms() - request.getRoomsBooked());

        accommodationRepository.save(accommodation);

        return savedBooking;
    }

    public List<Booking> getBookingsForUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = getBookingById(bookingId);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return;
        }

        Accommodation accommodation = booking.getAccommodation();

        accommodation.setTotalRooms(
                accommodation.getTotalRooms() + booking.getRoomsBooked());

        accommodationRepository.save(accommodation);
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Transactional
    public Booking confirmBooking(Long bookingId) {
        Booking booking = getBookingById(bookingId);
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("Check-in and check-out dates are required.");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out date must be after check-in date.");
        }
        if (!checkIn.isAfter(LocalDate.now().minusDays(1))) {
            throw new IllegalArgumentException("Check-in date must be today or later.");
        }
    }

    private int calculateNights(LocalDate checkIn, LocalDate checkOut) {
        return (int) Duration.between(checkIn.atStartOfDay(), checkOut.atStartOfDay()).toDays();
    }

    private int findBookedRooms(Long accommodationId, LocalDate checkIn, LocalDate checkOut) {
        Timestamp checkInTimestamp = Timestamp.valueOf(checkIn.atStartOfDay());
        Timestamp checkOutTimestamp = Timestamp.valueOf(checkOut.atStartOfDay());
        List<Booking> overlappingBookings = bookingRepository.findByAccommodationIdAndStatusInAndCheckInLessThanEqualAndCheckOutGreaterThanEqual(
                accommodationId,
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED),
                checkOutTimestamp,
                checkInTimestamp);
        return overlappingBookings.size();
    }
}
