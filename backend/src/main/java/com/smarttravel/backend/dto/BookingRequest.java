package com.smarttravel.backend.dto;

import java.time.LocalDate;

public class BookingRequest {
    private Long accommodationId;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer roomsBooked;
    private Integer guests;

    public Long getAccommodationId() {
        return accommodationId;
    }

    public void setAccommodationId(Long accommodationId) {
        this.accommodationId = accommodationId;
    }

    public LocalDate getCheckIn() {
        return checkIn;
    }

    public void setCheckIn(LocalDate checkIn) {
        this.checkIn = checkIn;
    }

    public LocalDate getCheckOut() {
        return checkOut;
    }

    public void setCheckOut(LocalDate checkOut) {
        this.checkOut = checkOut;
    }

    public Integer getGuests() {
        return guests;
    }

    public void setGuests(Integer guests) {
        this.guests = guests;
    }
    public Integer getRoomsBooked() {
        return roomsBooked;
    }

    public void setRoomsBooked(Integer roomsBooked) {
        this.roomsBooked = roomsBooked;
    }
}
