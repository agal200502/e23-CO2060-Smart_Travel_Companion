package com.smarttravel.backend.controller;

import com.smarttravel.backend.model.Accommodation;
import com.smarttravel.backend.model.Location;
import com.smarttravel.backend.model.User;
import com.smarttravel.backend.repository.AccommodationRepository;
import com.smarttravel.backend.repository.LocationRepository;
import com.smarttravel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private AccommodationRepository accommodationRepository;


    // --- Users ---
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        return ResponseEntity.ok(userRepository.save(user));
    }

    // --- Locations ---
    @PostMapping("/locations")
    public Location createLocation(@RequestBody Location location) {
        if (location.getVisitDuration() == null) {
            location.setVisitDuration(60);
        }
        return locationRepository.save(location);
    }

    @PutMapping("/locations/{id}")
    public ResponseEntity<Location> updateLocation(@PathVariable Long id, @RequestBody Location locationDetails) {
        Location location = locationRepository.findById(id).orElse(null);
        if (location == null) {
            return ResponseEntity.notFound().build();
        }
        location.setName(locationDetails.getName());
        location.setDescription(locationDetails.getDescription());
        location.setDistrict(locationDetails.getDistrict());
        location.setCategory(locationDetails.getCategory());
        location.setImageUrl(locationDetails.getImageUrl());
        location.setLatitude(locationDetails.getLatitude());
        location.setLongitude(locationDetails.getLongitude());
        location.setVisitDuration(locationDetails.getVisitDuration() != null ? locationDetails.getVisitDuration() : 60);
        return ResponseEntity.ok(locationRepository.save(location));
    }

    @Transactional
    @DeleteMapping("/locations/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {
        if (!locationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        accommodationRepository.deleteByLocationId(id);
        locationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- Accommodations ---

    // ✅ FIXED: fetch Location from DB before saving to avoid null reference error
    @PostMapping("/accommodations")
    public ResponseEntity<?> createAccommodation(@RequestBody Accommodation accommodation) {
    
        if (accommodation.getLocation() == null || accommodation.getLocation().getId() == null) {
            return ResponseEntity.badRequest().body("Location is required");
        }
            
        if (accommodation.getLocation() == null || accommodation.getLocation().getId() == null) {
            return ResponseEntity.badRequest().body("Location is required");
        }
        Location location = locationRepository.findById(accommodation.getLocation().getId()).orElse(null);
        if (location == null) {
            return ResponseEntity.badRequest().body("Location not found");
        }
        accommodation.setLocation(location);
        return ResponseEntity.ok(accommodationRepository.save(accommodation));
    }

    @PutMapping("/accommodations/{id}")
    public ResponseEntity<Accommodation> updateAccommodation(@PathVariable Long id, @RequestBody Accommodation details) {
        System.out.println("==================================");
        System.out.println("Received name: " + details.getName());
        System.out.println("Received totalRooms: " + details.getTotalRooms());
        System.out.println("==================================");

        Accommodation acc = accommodationRepository.findById(id).orElse(null);
        if (acc == null) {
            return ResponseEntity.notFound().build();
        }
        acc.setName(details.getName());
        acc.setPrice(details.getPrice());
        acc.setRating(details.getRating());
        acc.setTotalRooms(details.getTotalRooms());
        acc.setImageUrl(details.getImageUrl());
        if (details.getLocation() != null && details.getLocation().getId() != null) {
            Location location = locationRepository.findById(details.getLocation().getId()).orElse(null);
            if (location != null) {
                acc.setLocation(location);
            }
        }
        return ResponseEntity.ok(accommodationRepository.save(acc));
    }

    @DeleteMapping("/accommodations/{id}")
    public ResponseEntity<Void> deleteAccommodation(@PathVariable Long id) {
        if (!accommodationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        accommodationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    
}