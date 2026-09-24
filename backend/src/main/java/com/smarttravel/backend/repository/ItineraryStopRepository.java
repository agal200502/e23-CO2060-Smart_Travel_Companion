package com.smarttravel.backend.repository;

import com.smarttravel.backend.model.ItineraryStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryStopRepository extends JpaRepository<ItineraryStop, Long> {
    List<ItineraryStop> findByItineraryDayIdOrderByStopOrderAsc(Long itineraryDayId);
}
