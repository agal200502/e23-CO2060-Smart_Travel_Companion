package com.smarttravel.backend.dto;

import com.smarttravel.backend.model.BudgetTier;
import com.smarttravel.backend.model.Pace;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class GenerateItineraryRequest {

    @NotNull(message = "Number of days is required")
    @Min(value = 1, message = "Trip must be at least 1 day")
    @Max(value = 14, message = "Trip length cannot exceed 14 days")
    private Integer days;

    @NotNull(message = "Start location is required")
    private Long startLocationId;

    private String dailyStartTime = "08:30";

    private Pace pace = Pace.MODERATE;

    private BudgetTier budgetTier = BudgetTier.MEDIUM;

    private List<String> interests = new ArrayList<>();

    private List<Long> mustVisitLocationIds = new ArrayList<>();

    private String startDate;

    private String title;

    public GenerateItineraryRequest() {
    }

    // Getters and Setters

    public Integer getDays() {
        return days;
    }

    public void setDays(Integer days) {
        this.days = days;
    }

    public Long getStartLocationId() {
        return startLocationId;
    }

    public void setStartLocationId(Long startLocationId) {
        this.startLocationId = startLocationId;
    }

    public String getDailyStartTime() {
        return dailyStartTime;
    }

    public void setDailyStartTime(String dailyStartTime) {
        this.dailyStartTime = dailyStartTime;
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

    public List<String> getInterests() {
        return interests;
    }

    public void setInterests(List<String> interests) {
        this.interests = interests;
    }

    public List<Long> getMustVisitLocationIds() {
        return mustVisitLocationIds;
    }

    public void setMustVisitLocationIds(List<Long> mustVisitLocationIds) {
        this.mustVisitLocationIds = mustVisitLocationIds;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
