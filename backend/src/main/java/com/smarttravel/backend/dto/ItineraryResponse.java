package com.smarttravel.backend.dto;

import com.smarttravel.backend.model.BudgetTier;
import com.smarttravel.backend.model.Location;
import com.smarttravel.backend.model.Pace;

import java.util.ArrayList;
import java.util.List;

public class ItineraryResponse {
    private Long id;
    private String title;
    private Location startLocation;
    private String startDate;
    private Integer numberOfDays;
    private Pace pace;
    private BudgetTier budgetTier;
    private String dailyStartTime;
    private Double totalDistance;
    private Integer totalDriveMinutes;
    private List<ItineraryDayDto> days = new ArrayList<>();

    public ItineraryResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Location getStartLocation() {
        return startLocation;
    }

    public void setStartLocation(Location startLocation) {
        this.startLocation = startLocation;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public Integer getNumberOfDays() {
        return numberOfDays;
    }

    public void setNumberOfDays(Integer numberOfDays) {
        this.numberOfDays = numberOfDays;
    }

    public Pace getPace() {
        return pace;
    }

    public void setPace(Pace pace) {
        this.pace = pace;
    }

    public BudgetTier getBudgetTier() {
        return budgetTier;
    }

    public void setBudgetTier(BudgetTier budgetTier) {
        this.budgetTier = budgetTier;
    }

    public String getDailyStartTime() {
        return dailyStartTime;
    }

    public void setDailyStartTime(String dailyStartTime) {
        this.dailyStartTime = dailyStartTime;
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

    public List<ItineraryDayDto> getDays() {
        return days;
    }

    public void setDays(List<ItineraryDayDto> days) {
        this.days = days;
    }
}
