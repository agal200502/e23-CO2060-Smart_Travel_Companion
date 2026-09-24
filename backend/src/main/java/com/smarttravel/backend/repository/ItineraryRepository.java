package com.smarttravel.backend.repository;

import com.smarttravel.backend.model.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {
    List<Itinerary> findByUserIdOrderByIdDesc(Long userId);
    List<Itinerary> findByUserIdOrderByCreatedAtDesc(Long userId);
}
