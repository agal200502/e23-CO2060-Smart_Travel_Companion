package com.smarttravel.backend.service;

import com.smarttravel.backend.dto.ItineraryStopDto;
import com.smarttravel.backend.model.Location;
import com.smarttravel.backend.model.Pace;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class TimeSlotSchedulerService {

    @Autowired
    private OsrmService osrmService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    public static class ScheduledDayResult {
        private final List<ItineraryStopDto> stops;
        private final double totalDistanceKm;
        private final int totalDriveMinutes;
        private final Location lastLocation;

        public ScheduledDayResult(List<ItineraryStopDto> stops, double totalDistanceKm, int totalDriveMinutes, Location lastLocation) {
            this.stops = stops;
            this.totalDistanceKm = Math.round(totalDistanceKm * 10.0) / 10.0;
            this.totalDriveMinutes = totalDriveMinutes;
            this.lastLocation = lastLocation;
        }

        public List<ItineraryStopDto> getStops() {
            return stops;
        }

        public double getTotalDistanceKm() {
            return totalDistanceKm;
        }

        public int getTotalDriveMinutes() {
            return totalDriveMinutes;
        }

        public Location getLastLocation() {
            return lastLocation;
        }
    }

    public ScheduledDayResult scheduleDay(List<Location> dayLocations, Location startingPoint, String startTimeStr, Pace pace) {
        List<ItineraryStopDto> stops = new ArrayList<>();
        if (dayLocations == null || dayLocations.isEmpty()) {
            return new ScheduledDayResult(stops, 0.0, 0, startingPoint);
        }

        LocalTime currentTime;
        try {
            currentTime = LocalTime.parse(startTimeStr, TIME_FORMATTER);
        } catch (Exception e) {
            currentTime = LocalTime.of(8, 30);
        }

        int defaultVisitDuration = getVisitDurationForPace(pace);
        int maxActiveMinutes = getMaxActiveMinutesForPace(pace);

        LocalTime dayStartTime = currentTime;
        double totalDistance = 0.0;
        int totalDriveMins = 0;
        Location currentLoc = startingPoint;
        boolean lunchTaken = false;

        int stopOrder = 1;
        for (Location targetLoc : dayLocations) {
            // Check daily limit
            int currentElapsedMins = (currentTime.getHour() * 60 + currentTime.getMinute()) -
                    (dayStartTime.getHour() * 60 + dayStartTime.getMinute());

            if (currentElapsedMins >= maxActiveMinutes && !stops.isEmpty()) {
                // Exceeded daily time limit for realistic schedule
                break;
            }

            // Calculate drive from current location to target location
            OsrmService.RouteLeg routeLeg = osrmService.getDrivingRoute(currentLoc, targetLoc);
            totalDistance += routeLeg.getDistanceKm();
            totalDriveMins += routeLeg.getDurationMinutes();

            // Add travel time to current time
            currentTime = currentTime.plusMinutes(routeLeg.getDurationMinutes());

            // Check if lunch break is needed (between 12:00 and 13:30)
            if (!lunchTaken && currentTime.isAfter(LocalTime.of(12, 0)) && currentTime.isBefore(LocalTime.of(14, 0))) {
                currentTime = currentTime.plusMinutes(45); // 45 min lunch break
                lunchTaken = true;
            }

            ItineraryStopDto stop = new ItineraryStopDto();
            stop.setLocation(targetLoc);
            stop.setStopOrder(stopOrder++);
            stop.setTravelDistance(routeLeg.getDistanceKm());
            stop.setTravelDuration(routeLeg.getDurationMinutes());
            stop.setArrivalTime(currentTime.format(TIME_FORMATTER));

            int visitDuration = getCustomOrCategoryVisitDuration(targetLoc, defaultVisitDuration);
            stop.setVisitDuration(visitDuration);

            currentTime = currentTime.plusMinutes(visitDuration);
            stop.setDepartureTime(currentTime.format(TIME_FORMATTER));

            stops.add(stop);
            currentLoc = targetLoc;
        }

        return new ScheduledDayResult(stops, totalDistance, totalDriveMins, currentLoc);
    }

    private int getVisitDurationForPace(Pace pace) {
        if (pace == Pace.RELAXED) return 90;
        if (pace == Pace.PACKED) return 45;
        return 60; // MODERATE
    }

    private int getMaxActiveMinutesForPace(Pace pace) {
        if (pace == Pace.RELAXED) return 480; // 8 hours
        if (pace == Pace.PACKED) return 720;  // 12 hours
        return 600; // 10 hours for MODERATE
    }

    private int getCustomOrCategoryVisitDuration(Location loc, int defaultDuration) {
        if (loc == null || loc.getCategory() == null) return defaultDuration;
        String cat = loc.getCategory().toUpperCase();
        if (cat.contains("NATURE") || cat.contains("WILDLIFE")) return Math.max(defaultDuration, 90);
        if (cat.contains("HISTORY") || cat.contains("CULTURE")) return Math.max(defaultDuration, 75);
        if (cat.contains("BEACH")) return Math.max(defaultDuration, 60);
        return defaultDuration;
    }
}
