package com.smarttravel.backend.algorithm;

import com.smarttravel.backend.model.Location;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TspOptimizer {

    /**
     * Calculates Haversine distance in kilometers between two points.
     */
    public static double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371; // Earth's radius in kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public static double distance(Location l1, Location l2) {
        if (l1 == null || l2 == null || l1.getLatitude() == null || l1.getLongitude() == null ||
                l2.getLatitude() == null || l2.getLongitude() == null) {
            return 0.0;
        }
        return haversine(l1.getLatitude(), l1.getLongitude(), l2.getLatitude(), l2.getLongitude());
    }

    /**
     * Nearest Neighbour algorithm for initial TSP route construction starting from a given start location.
     */
    public List<Location> nearestNeighbourRoute(List<Location> locations, Location start) {
        if (locations == null || locations.isEmpty()) {
            return new ArrayList<>();
        }
        List<Location> unvisited = new ArrayList<>(locations);
        List<Location> route = new ArrayList<>();

        Location current = start;
        if (unvisited.contains(start)) {
            route.add(start);
            unvisited.remove(start);
        } else {
            // Find closest to start
            Location closestToStart = findClosest(start, unvisited);
            if (closestToStart != null) {
                current = closestToStart;
                route.add(current);
                unvisited.remove(current);
            }
        }

        while (!unvisited.isEmpty()) {
            Location next = findClosest(current, unvisited);
            if (next != null) {
                route.add(next);
                unvisited.remove(next);
                current = next;
            } else {
                break;
            }
        }
        return route;
    }

    /**
     * 2-Opt algorithm to improve a TSP route and eliminate edge crossings / backtracking.
     */
    public List<Location> twoOptOptimization(List<Location> initialRoute) {
        if (initialRoute == null || initialRoute.size() <= 3) {
            return initialRoute;
        }

        List<Location> route = new ArrayList<>(initialRoute);
        boolean improved = true;
        int maxIterations = 50;
        int iteration = 0;

        while (improved && iteration < maxIterations) {
            improved = false;
            iteration++;
            double bestDistance = calculateTotalDistance(route);

            for (int i = 1; i < route.size() - 1; i++) {
                for (int k = i + 1; k < route.size(); k++) {
                    List<Location> newRoute = twoOptSwap(route, i, k);
                    double newDistance = calculateTotalDistance(newRoute);
                    if (newDistance < bestDistance - 0.01) { // precision buffer
                        route = newRoute;
                        bestDistance = newDistance;
                        improved = true;
                    }
                }
            }
        }
        return route;
    }

    private List<Location> twoOptSwap(List<Location> route, int i, int k) {
        List<Location> newRoute = new ArrayList<>();
        // 1. Take route[0] to route[i-1]
        for (int c = 0; c < i; c++) {
            newRoute.add(route.get(c));
        }
        // 2. Take route[i] to route[k] in reverse order
        for (int c = k; c >= i; c--) {
            newRoute.add(route.get(c));
        }
        // 3. Take route[k+1] to end
        for (int c = k + 1; c < route.size(); c++) {
            newRoute.add(route.get(c));
        }
        return newRoute;
    }

    public double calculateTotalDistance(List<Location> route) {
        if (route == null || route.size() < 2) return 0.0;
        double total = 0.0;
        for (int i = 0; i < route.size() - 1; i++) {
            total += distance(route.get(i), route.get(i + 1));
        }
        return total;
    }

    private Location findClosest(Location from, List<Location> candidates) {
        Location closest = null;
        double minDistance = Double.MAX_VALUE;
        for (Location candidate : candidates) {
            double d = distance(from, candidate);
            if (d < minDistance) {
                minDistance = d;
                closest = candidate;
            }
        }
        return closest;
    }
}
