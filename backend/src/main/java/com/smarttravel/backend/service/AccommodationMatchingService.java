package com.smarttravel.backend.service;

import com.smarttravel.backend.algorithm.TspOptimizer;
import com.smarttravel.backend.model.Accommodation;
import com.smarttravel.backend.model.BudgetTier;
import com.smarttravel.backend.model.Location;
import com.smarttravel.backend.repository.AccommodationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
public class AccommodationMatchingService {

    @Autowired
    private AccommodationRepository accommodationRepository;

    public Accommodation findBestAccommodation(Location finalLocation, BudgetTier budgetTier) {
        if (finalLocation == null) return null;

        // 1. Try finding accommodations linked directly to finalLocation
        List<Accommodation> directStays = accommodationRepository.findByLocationId(finalLocation.getId());
        if (!directStays.isEmpty()) {
            return selectByBudget(directStays, budgetTier);
        }

        // 2. If no direct stay, search all accommodations and pick nearest geographically
        List<Accommodation> allStays = accommodationRepository.findAll();
        if (allStays.isEmpty()) return null;

        allStays.sort(Comparator.comparingDouble(acc -> {
            if (acc.getLocation() != null && acc.getLocation().getLatitude() != null && finalLocation.getLatitude() != null) {
                return TspOptimizer.haversine(
                        finalLocation.getLatitude(), finalLocation.getLongitude(),
                        acc.getLocation().getLatitude(), acc.getLocation().getLongitude()
                );
            }
            return Double.MAX_VALUE;
        }));

        return selectByBudget(allStays, budgetTier);
    }

    private Accommodation selectByBudget(List<Accommodation> candidates, BudgetTier budgetTier) {
        if (candidates.isEmpty()) return null;

        BudgetTier tier = budgetTier != null ? budgetTier : BudgetTier.MEDIUM;

        return candidates.stream()
                .sorted((a, b) -> {
                    double pA = a.getPrice() != null ? a.getPrice().doubleValue() : 100.0;
                    double pB = b.getPrice() != null ? b.getPrice().doubleValue() : 100.0;
                    double rA = a.getRating() != null ? a.getRating().doubleValue() : 4.0;
                    double rB = b.getRating() != null ? b.getRating().doubleValue() : 4.0;

                    if (tier == BudgetTier.BUDGET) {
                        return Double.compare(pA, pB); // lowest price first
                    } else if (tier == BudgetTier.PREMIUM) {
                        return Double.compare(pB, pA); // highest price first
                    } else {
                        // MEDIUM: balance rating and price near $100-$150
                        double scoreA = rA * 10 - Math.abs(pA - 120) * 0.05;
                        double scoreB = rB * 10 - Math.abs(pB - 120) * 0.05;
                        return Double.compare(scoreB, scoreA);
                    }
                })
                .findFirst()
                .orElse(candidates.get(0));
    }
}
