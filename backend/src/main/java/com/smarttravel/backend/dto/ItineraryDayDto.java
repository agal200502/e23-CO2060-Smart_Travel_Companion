package com.smarttravel.backend.dto;

import com.smarttravel.backend.model.Accommodation;

import java.util.ArrayList;
import java.util.List;

public class ItineraryDayDto {
    private Long id;
    private Integer dayNumber;
    private String date;
    private Double totalDistance;
    private Integer totalDriveMinutes;
    private Accommodation recommendedStay;
    private List<ItineraryStopDto> stops = new ArrayList<>();

    public ItineraryDayDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public List<ItineraryStopDto> getStops() {
        return stops;
    }

    public void setStops(List<ItineraryStopDto> stops) {
        this.stops = stops;
    }
}
