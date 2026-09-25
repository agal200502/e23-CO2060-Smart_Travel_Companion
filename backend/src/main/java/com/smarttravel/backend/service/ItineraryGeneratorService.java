package com.smarttravel.backend.service;

import com.smarttravel.backend.algorithm.LocationClustering;
import com.smarttravel.backend.algorithm.TspOptimizer;
import com.smarttravel.backend.dto.GenerateItineraryRequest;
import com.smarttravel.backend.dto.ItineraryDayDto;
import com.smarttravel.backend.dto.ItineraryResponse;
import com.smarttravel.backend.exception.ResourceNotFoundException;
import com.smarttravel.backend.model.Accommodation;
import com.smarttravel.backend.model.Location;
import com.smarttravel.backend.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ItineraryGeneratorService {

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private LocationClustering locationClustering;

    @Autowired
    private TspOptimizer tspOptimizer;

    @Autowired
    private TimeSlotSchedulerService timeSlotSchedulerService;

    @Autowired
    private AccommodationMatchingService accommodationMatchingService;

    public ItineraryResponse generateItinerary(GenerateItineraryRequest request) {
        // 1. Fetch start location
        Location startLocation = locationRepository.findById(request.getStartLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Start location not found with id: " + request.getStartLocationId()));

        // 2. Fetch all locations
        List<Location> allLocations = locationRepository.findAll();
        if (allLocations.isEmpty()) {
            throw new IllegalStateException("No locations available in database");
        }

        // 3. Filter candidates strictly by must-visit or selected interests
        Set<Long> mustVisitSet = new HashSet<>(request.getMustVisitLocationIds() != null ? request.getMustVisitLocationIds() : Collections.emptyList());
        List<String> userInterests = request.getInterests() != null ? request.getInterests() : Collections.emptyList();

        List<Location> candidateLocations = new ArrayList<>();

        if (!mustVisitSet.isEmpty()) {
            // User selected specific places in Step 4 -> candidate pool MUST ONLY contain selected places
            for (Location loc : allLocations) {
                if (mustVisitSet.contains(loc.getId())) {
                    candidateLocations.add(loc);
                }
            }
        } else if (!userInterests.isEmpty()) {
            // User selected interests in Step 3 -> candidate pool MUST ONLY contain interest-matching places
            for (Location loc : allLocations) {
                if (!loc.getId().equals(startLocation.getId()) && isLocationMatchingInterests(loc, userInterests)) {
                    candidateLocations.add(loc);
                }
            }
        } else {
            // Fallback if no specific places or interests specified
            for (Location loc : allLocations) {
                if (!loc.getId().equals(startLocation.getId())) {
                    candidateLocations.add(loc);
                }
            }
        }

        int numDays = Math.max(1, request.getDays());

        // 4. Cluster candidates into N daily groups
        List<List<Location>> dailyClusters = locationClustering.clusterLocationsByDays(candidateLocations, startLocation, numDays);

        // 5. Build daily schedules with route optimization & time slots
        ItineraryResponse response = new ItineraryResponse();
        response.setTitle(request.getTitle() != null ? request.getTitle() : numDays + "-Day Sri Lanka Tour starting from " + startLocation.getName());
        response.setStartLocation(startLocation);
        response.setStartDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now().toString());
        response.setNumberOfDays(numDays);
        response.setPace(request.getPace());
        response.setBudgetTier(request.getBudgetTier());
        response.setDailyStartTime(request.getDailyStartTime());
        response.setInterests(userInterests);

        double grandTotalDistance = 0.0;
        int grandTotalDriveMinutes = 0;

        Location currentDayStartLocation = startLocation;
        List<ItineraryDayDto> dayDtos = new ArrayList<>();

        for (int d = 0; d < numDays; d++) {
            List<Location> dayRawLocations = dailyClusters.get(d);

            // If day 1 and raw locations don't include startLocation, insert start location as initial stop
            List<Location> dayRouteCandidates = new ArrayList<>(dayRawLocations);
            if (d == 0 && !dayRouteCandidates.contains(startLocation)) {
                dayRouteCandidates.add(0, startLocation);
            }

            // TSP Route Optimization: Nearest Neighbour + 2-opt
            List<Location> initialRoute = tspOptimizer.nearestNeighbourRoute(dayRouteCandidates, currentDayStartLocation);
            List<Location> optimizedRoute = tspOptimizer.twoOptOptimization(initialRoute);

            // Schedule time slots
            TimeSlotSchedulerService.ScheduledDayResult scheduledDay = timeSlotSchedulerService.scheduleDay(
                    optimizedRoute,
                    currentDayStartLocation,
                    request.getDailyStartTime(),
                    request.getPace()
            );

            ItineraryDayDto dayDto = new ItineraryDayDto();
            dayDto.setDayNumber(d + 1);
            dayDto.setDate(LocalDate.now().plusDays(d).toString());
            dayDto.setStops(scheduledDay.getStops());
            dayDto.setTotalDistance(scheduledDay.getTotalDistanceKm());
            dayDto.setTotalDriveMinutes(scheduledDay.getTotalDriveMinutes());

            grandTotalDistance += scheduledDay.getTotalDistanceKm();
            grandTotalDriveMinutes += scheduledDay.getTotalDriveMinutes();

            // Find recommended accommodation for the day's final location
            Location dayEndLoc = scheduledDay.getLastLocation();
            Accommodation recommendedStay = accommodationMatchingService.findBestAccommodation(dayEndLoc, request.getBudgetTier());
            dayDto.setRecommendedStay(recommendedStay);

            dayDtos.add(dayDto);

            // Next day starts from previous day's end location
            if (dayEndLoc != null) {
                currentDayStartLocation = dayEndLoc;
            }
        }

        response.setDays(dayDtos);
        response.setTotalDistance(Math.round(grandTotalDistance * 10.0) / 10.0);
        response.setTotalDriveMinutes(grandTotalDriveMinutes);

        return response;
    }

    private boolean isLocationMatchingInterests(Location loc, List<String> interests) {
        if (interests == null || interests.isEmpty()) return false;
        if (loc.getCategory() == null || loc.getCategory().trim().isEmpty()) return false;

        String locCatRaw = loc.getCategory().toUpperCase();
        String[] locCatTags = locCatRaw.split("[,;/|\\s]+");

        for (String interest : interests) {
            if (interest == null || interest.trim().isEmpty()) continue;
            String normalizedInterest = interest.trim().toUpperCase();

            for (String tag : locCatTags) {
                String trimmedTag = tag.trim();
                if (trimmedTag.isEmpty()) continue;
                if (trimmedTag.contains(normalizedInterest) || normalizedInterest.contains(trimmedTag)) {
                    return true;
                }
                if (normalizedInterest.contains("FOOD") && trimmedTag.contains("FOOD")) {
                    return true;
                }
            }
        }
        return false;
    }
}
