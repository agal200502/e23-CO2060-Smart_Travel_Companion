package com.smarttravel.backend.controller;

import com.smarttravel.backend.dto.GenerateItineraryRequest;
import com.smarttravel.backend.dto.ItineraryResponse;
import com.smarttravel.backend.repository.UserRepository;
import com.smarttravel.backend.service.ItineraryGeneratorService;
import com.smarttravel.backend.service.ItineraryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/itineraries")
public class ItineraryController {

    @Autowired
    private ItineraryGeneratorService itineraryGeneratorService;

    @Autowired
    private ItineraryService itineraryService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/generate")
    public ResponseEntity<?> generateItinerary(@Valid @RequestBody GenerateItineraryRequest request) {
        try {
            ItineraryResponse itinerary = itineraryGeneratorService.generateItinerary(request);
            return ResponseEntity.ok(itinerary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate itinerary: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> saveItinerary(Authentication authentication, @RequestBody ItineraryResponse request) {
        Long userId = getUserIdFromAuth(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        try {
            ItineraryResponse saved = itineraryService.saveItinerary(userId, request);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save itinerary: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserItineraries(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        List<ItineraryResponse> itineraries = itineraryService.getUserItineraries(userId);
        return ResponseEntity.ok(itineraries);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getItineraryById(@PathVariable Long id, Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        try {
            ItineraryResponse itinerary = itineraryService.getItineraryById(id, userId);
            return ResponseEntity.ok(itinerary);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Itinerary not found");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateItinerary(@PathVariable Long id, Authentication authentication, @RequestBody ItineraryResponse request) {
        Long userId = getUserIdFromAuth(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        try {
            ItineraryResponse updated = itineraryService.updateItinerary(id, userId, request);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update itinerary: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItinerary(@PathVariable Long id, Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        try {
            itineraryService.deleteItinerary(id, userId);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete itinerary: " + e.getMessage());
        }
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        String email = authentication.getName().trim();
        return userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmail(email.toLowerCase()))
                .map(user -> user.getId())
                .orElse(null);
    }
}
