package com.smarttravel.backend.service;

import com.smarttravel.backend.dto.ItineraryDayDto;
import com.smarttravel.backend.dto.ItineraryResponse;
import com.smarttravel.backend.dto.ItineraryStopDto;
import com.smarttravel.backend.exception.ResourceNotFoundException;
import com.smarttravel.backend.model.*;
import com.smarttravel.backend.repository.ItineraryRepository;
import com.smarttravel.backend.repository.UserRepository;
import com.smarttravel.backend.repository.LocationRepository;
import com.smarttravel.backend.repository.AccommodationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ItineraryService {

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private AccommodationRepository accommodationRepository;

    @Transactional
    public ItineraryResponse saveItinerary(Long userId, ItineraryResponse dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Itinerary itinerary = new Itinerary();
        itinerary.setUser(user);
        itinerary.setTitle(dto.getTitle());
        
        if (dto.getStartLocation() != null && dto.getStartLocation().getId() != null) {
            locationRepository.findById(dto.getStartLocation().getId()).ifPresent(itinerary::setStartLocation);
        }

        itinerary.setStartDate(dto.getStartDate());
        itinerary.setNumberOfDays(dto.getNumberOfDays());
        itinerary.setPace(dto.getPace() != null ? dto.getPace() : Pace.MODERATE);
        itinerary.setBudgetTier(dto.getBudgetTier() != null ? dto.getBudgetTier() : BudgetTier.MEDIUM);
        itinerary.setDailyStartTime(dto.getDailyStartTime());
        itinerary.setTotalDistance(dto.getTotalDistance());
        itinerary.setTotalDriveMinutes(dto.getTotalDriveMinutes());
        itinerary.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        itinerary.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

        if (dto.getDays() != null) {
            for (ItineraryDayDto dayDto : dto.getDays()) {
                ItineraryDay day = new ItineraryDay();
                day.setDayNumber(dayDto.getDayNumber());
                day.setDate(dayDto.getDate());
                day.setTotalDistance(dayDto.getTotalDistance());
                day.setTotalDriveMinutes(dayDto.getTotalDriveMinutes());
                
                if (dayDto.getRecommendedStay() != null && dayDto.getRecommendedStay().getId() != null) {
                    accommodationRepository.findById(dayDto.getRecommendedStay().getId()).ifPresent(day::setRecommendedStay);
                }

                if (dayDto.getStops() != null) {
                    for (ItineraryStopDto stopDto : dayDto.getStops()) {
                        ItineraryStop stop = new ItineraryStop();
                        
                        if (stopDto.getLocation() != null && stopDto.getLocation().getId() != null) {
                            locationRepository.findById(stopDto.getLocation().getId()).ifPresent(stop::setLocation);
                        }

                        stop.setStopOrder(stopDto.getStopOrder());
                        stop.setArrivalTime(stopDto.getArrivalTime());
                        stop.setDepartureTime(stopDto.getDepartureTime());
                        stop.setVisitDuration(stopDto.getVisitDuration());
                        stop.setTravelDistance(stopDto.getTravelDistance());
                        stop.setTravelDuration(stopDto.getTravelDuration());
                        day.addStop(stop);
                    }
                }
                itinerary.addDay(day);
            }
        }

        Itinerary saved = itineraryRepository.save(itinerary);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ItineraryResponse> getUserItineraries(Long userId) {
        List<Itinerary> itineraries = itineraryRepository.findByUserIdOrderByIdDesc(userId);
        return itineraries.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ItineraryResponse getItineraryById(Long id, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary not found with id: " + id));

        if (!itinerary.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to itinerary");
        }
        return mapToResponse(itinerary);
    }

    @Transactional
    public ItineraryResponse updateItinerary(Long id, Long userId, ItineraryResponse dto) {
        Itinerary itinerary = itineraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary not found with id: " + id));

        if (!itinerary.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to itinerary");
        }

        itinerary.setTitle(dto.getTitle());
        if (dto.getStartLocation() != null && dto.getStartLocation().getId() != null) {
            locationRepository.findById(dto.getStartLocation().getId()).ifPresent(itinerary::setStartLocation);
        }

        itinerary.setStartDate(dto.getStartDate());
        itinerary.setNumberOfDays(dto.getNumberOfDays());
        itinerary.setPace(dto.getPace());
        itinerary.setBudgetTier(dto.getBudgetTier());
        itinerary.setDailyStartTime(dto.getDailyStartTime());
        itinerary.setTotalDistance(dto.getTotalDistance());
        itinerary.setTotalDriveMinutes(dto.getTotalDriveMinutes());
        itinerary.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

        itinerary.getDays().clear();

        if (dto.getDays() != null) {
            for (ItineraryDayDto dayDto : dto.getDays()) {
                ItineraryDay day = new ItineraryDay();
                day.setDayNumber(dayDto.getDayNumber());
                day.setDate(dayDto.getDate());
                day.setTotalDistance(dayDto.getTotalDistance());
                day.setTotalDriveMinutes(dayDto.getTotalDriveMinutes());

                if (dayDto.getRecommendedStay() != null && dayDto.getRecommendedStay().getId() != null) {
                    accommodationRepository.findById(dayDto.getRecommendedStay().getId()).ifPresent(day::setRecommendedStay);
                }

                if (dayDto.getStops() != null) {
                    for (ItineraryStopDto stopDto : dayDto.getStops()) {
                        ItineraryStop stop = new ItineraryStop();

                        if (stopDto.getLocation() != null && stopDto.getLocation().getId() != null) {
                            locationRepository.findById(stopDto.getLocation().getId()).ifPresent(stop::setLocation);
                        }

                        stop.setStopOrder(stopDto.getStopOrder());
                        stop.setArrivalTime(stopDto.getArrivalTime());
                        stop.setDepartureTime(stopDto.getDepartureTime());
                        stop.setVisitDuration(stopDto.getVisitDuration());
                        stop.setTravelDistance(stopDto.getTravelDistance());
                        stop.setTravelDuration(stopDto.getTravelDuration());
                        day.addStop(stop);
                    }
                }
                itinerary.addDay(day);
            }
        }

        Itinerary updated = itineraryRepository.save(itinerary);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteItinerary(Long id, Long userId) {
        Itinerary itinerary = itineraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary not found with id: " + id));

        if (!itinerary.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to itinerary");
        }
        itineraryRepository.delete(itinerary);
    }

    public ItineraryResponse mapToResponse(Itinerary itinerary) {
        ItineraryResponse response = new ItineraryResponse();
        response.setId(itinerary.getId());
        response.setTitle(itinerary.getTitle());
        response.setStartLocation(itinerary.getStartLocation());
        response.setStartDate(itinerary.getStartDate());
        response.setNumberOfDays(itinerary.getNumberOfDays());
        response.setPace(itinerary.getPace());
        response.setBudgetTier(itinerary.getBudgetTier());
        response.setDailyStartTime(itinerary.getDailyStartTime());
        response.setTotalDistance(itinerary.getTotalDistance());
        response.setTotalDriveMinutes(itinerary.getTotalDriveMinutes());

        List<ItineraryDayDto> dayDtos = new ArrayList<>();
        if (itinerary.getDays() != null) {
            for (ItineraryDay day : itinerary.getDays()) {
                ItineraryDayDto dayDto = new ItineraryDayDto();
                dayDto.setId(day.getId());
                dayDto.setDayNumber(day.getDayNumber());
                dayDto.setDate(day.getDate());
                dayDto.setTotalDistance(day.getTotalDistance());
                dayDto.setTotalDriveMinutes(day.getTotalDriveMinutes());
                dayDto.setRecommendedStay(day.getRecommendedStay());

                List<ItineraryStopDto> stopDtos = new ArrayList<>();
                if (day.getStops() != null) {
                    for (ItineraryStop stop : day.getStops()) {
                        ItineraryStopDto stopDto = new ItineraryStopDto();
                        stopDto.setId(stop.getId());
                        stopDto.setLocation(stop.getLocation());
                        stopDto.setStopOrder(stop.getStopOrder());
                        stopDto.setArrivalTime(stop.getArrivalTime());
                        stopDto.setDepartureTime(stop.getDepartureTime());
                        stopDto.setVisitDuration(stop.getVisitDuration());
                        stopDto.setTravelDistance(stop.getTravelDistance());
                        stopDto.setTravelDuration(stop.getTravelDuration());
                        stopDtos.add(stopDto);
                    }
                }
                dayDto.setStops(stopDtos);
                dayDtos.add(dayDto);
            }
        }
        response.setDays(dayDtos);
        return response;
    }
}
