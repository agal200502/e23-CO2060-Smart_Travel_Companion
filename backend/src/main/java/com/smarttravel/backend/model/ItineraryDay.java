package com.smarttravel.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "itinerary_days")
public class ItineraryDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itinerary_id", nullable = false)
    @JsonIgnore
    private Itinerary itinerary;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    private String date;

    @Column(name = "total_distance")
    private Double totalDistance = 0.0;

    @Column(name = "total_drive_minutes")
    private Integer totalDriveMinutes = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recommended_stay_id")
    private Accommodation recommendedStay;

    @OneToMany(mappedBy = "itineraryDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stopOrder ASC")
    private List<ItineraryStop> stops = new ArrayList<>();

    public ItineraryDay() {
    }

    public void addStop(ItineraryStop stop) {
        stops.add(stop);
        stop.setItineraryDay(this);
    }

    public void removeStop(ItineraryStop stop) {
        stops.remove(stop);
        stop.setItineraryDay(null);
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Itinerary getItinerary() {
        return itinerary;
    }

    public void setItinerary(Itinerary itinerary) {
        this.itinerary = itinerary;
    }

    public Integer getDayNumber() {
        return dayNumber;
    }

    public void setDayNumber(Integer dayNumber) {
        this.dayNumber = dayNumber;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public Double getTotalDistance() {
        return totalDistance;
    }

    public void setTotalDistance(Double totalDistance) {
        this.totalDistance = totalDistance;
    }

    public Integer getTotalDriveMinutes() {
        return totalDriveMinutes;
    }

    public void setTotalDriveMinutes(Integer totalDriveMinutes) {
        this.totalDriveMinutes = totalDriveMinutes;
    }

    public Accommodation getRecommendedStay() {
        return recommendedStay;
    }

    public void setRecommendedStay(Accommodation recommendedStay) {
        this.recommendedStay = recommendedStay;
    }

    public List<ItineraryStop> getStops() {
        return stops;
    }

    public void setStops(List<ItineraryStop> stops) {
        this.stops = stops;
    }
}
