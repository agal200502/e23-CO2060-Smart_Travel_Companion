package com.smarttravel.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttravel.backend.algorithm.TspOptimizer;
import com.smarttravel.backend.model.Location;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class OsrmService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class RouteLeg {
        private final double distanceKm;
        private final int durationMinutes;

        public RouteLeg(double distanceKm, int durationMinutes) {
            this.distanceKm = distanceKm;
            this.durationMinutes = durationMinutes;
        }

        public double getDistanceKm() {
            return distanceKm;
        }

        public int getDurationMinutes() {
            return durationMinutes;
        }
    }

    /**
     * Fetches real driving route from OSRM for two locations.
     * Falls back gracefully to Haversine calculation if OSRM is unreachable.
     */
    public RouteLeg getDrivingRoute(Location from, Location to) {
        if (from == null || to == null || from.getLatitude() == null || from.getLongitude() == null ||
                to.getLatitude() == null || to.getLongitude() == null) {
            return new RouteLeg(0.0, 0);
        }

        try {
            String url = String.format(
                    "https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=false",
                    from.getLongitude(), from.getLatitude(),
                    to.getLongitude(), to.getLatitude()
            );

            String response = restTemplate.getForObject(url, String.class);
            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                if ("Ok".equals(root.path("code").asText()) && root.path("routes").isArray() && root.path("routes").size() > 0) {
                    JsonNode route = root.path("routes").get(0);
                    double distanceMeters = route.path("distance").asDouble(0.0);
                    double durationSeconds = route.path("duration").asDouble(0.0);

                    double distanceKm = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
                    int durationMinutes = (int) Math.max(1, Math.round(durationSeconds / 60.0));
                    return new RouteLeg(distanceKm, durationMinutes);
                }
            }
        } catch (Exception e) {
            // Log fallback warning
            System.err.println("OSRM route calculation failed, falling back to Haversine estimate: " + e.getMessage());
        }

        // Haversine fallback estimate (assume average driving speed ~45 km/h in hill/coastal areas)
        double haversineDist = TspOptimizer.distance(from, to);
        double estDistanceKm = Math.round(haversineDist * 1.3 * 10.0) / 10.0; // 1.3 road curvature factor
        int estDurationMins = (int) Math.max(5, Math.round((estDistanceKm / 45.0) * 60.0));
        return new RouteLeg(estDistanceKm, estDurationMins);
    }
}
