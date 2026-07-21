package com.smarttravel.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "bookings"})
    private User user;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accommodation_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "bookings"})
    private Accommodation accommodation;

    @Column(name = "accommodation_id", insertable = false, updatable = false)
    private Long accommodationId;

    @Column(name = "check_in", nullable = false)
    private Timestamp checkIn;

    @Column(name = "check_out", nullable = false)
    private Timestamp checkOut;

    @Column(name = "rooms_booked", nullable = false)
    private Integer roomsBooked;

    @Column(nullable = false)
    private Integer guests;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Timestamp createdAt;

    public Booking() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Accommodation getAccommodation() { return accommodation; }
    public void setAccommodation(Accommodation accommodation) { this.accommodation = accommodation; }

    public Long getAccommodationId() { return accommodationId; }
    public void setAccommodationId(Long accommodationId) { this.accommodationId = accommodationId; }

    public Timestamp getCheckIn() { return checkIn; }
    public void setCheckIn(Timestamp checkIn) { this.checkIn = checkIn; }

    public Timestamp getCheckOut() { return checkOut; }
    public void setCheckOut(Timestamp checkOut) { this.checkOut = checkOut; }

    public Integer getRoomsBooked() {
        return roomsBooked;
    }

    public void setRoomsBooked(Integer roomsBooked) {
        this.roomsBooked = roomsBooked;
    }

    public Integer getGuests() { return guests; }
    public void setGuests(Integer guests) { this.guests = guests; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
