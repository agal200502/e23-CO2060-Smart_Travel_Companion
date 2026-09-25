package com.smarttravel.backend.model;

import jakarta.persistence.*;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "itineraries")
public class Itinerary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String title;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "start_location_id")
    private Location startLocation;

    @Column(name = "start_date")
    private String startDate;

    @Column(name = "number_of_days")
    private Integer numberOfDays;

    @Enumerated(EnumType.STRING)
    private Pace pace = Pace.MODERATE;

    @Enumerated(EnumType.STRING)
    @Column(name = "budget_tier")
    private BudgetTier budgetTier = BudgetTier.MEDIUM;

    @Column(name = "daily_start_time")
    private String dailyStartTime = "08:30";

    @Column(name = "total_distance")
    private Double totalDistance = 0.0;

    @Column(name = "total_drive_minutes")
    private Integer totalDriveMinutes = 0;

    @Column(name = "interests", length = 500)
    private String interests;

    @Column(name = "created_at")
    private Timestamp createdAt = new Timestamp(System.currentTimeMillis());

    @Column(name = "updated_at")
    private Timestamp updatedAt = new Timestamp(System.currentTimeMillis());

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = new Timestamp(System.currentTimeMillis());
        if (updatedAt == null) updatedAt = new Timestamp(System.currentTimeMillis());
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Timestamp(System.currentTimeMillis());
    }

    @OneToMany(mappedBy = "itinerary", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC")
    private List<ItineraryDay> days = new ArrayList<>();

    public Itinerary() {
    }

    public void addDay(ItineraryDay day) {
        days.add(day);
        day.setItinerary(this);
    }

    public void removeDay(ItineraryDay day) {
        days.remove(day);
        day.setItinerary(null);
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public String getInterests() {
        return interests;
    }

    public void setInterests(String interests) {
        this.interests = interests;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<ItineraryDay> getDays() {
        return days;
    }

    public void setDays(List<ItineraryDay> days) {
        this.days = days;
    }
}
