package com.smarttravel.backend.algorithm;

import com.smarttravel.backend.model.Location;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class LocationClustering {

    /**
     * Groups locations into K day-clusters using geographic proximity (K-means based spatial clustering),
     * ensuring nearby attractions are grouped on the same day and startLocation anchor is respected.
     */
    public List<List<Location>> clusterLocationsByDays(List<Location> candidates, Location startLocation, int numDays) {
        if (candidates == null || candidates.isEmpty()) {
            List<List<Location>> emptyResult = new ArrayList<>();
            for (int d = 0; d < numDays; d++) {
                emptyResult.add(new ArrayList<>());
            }
            return emptyResult;
        }

        if (numDays <= 1) {
            List<List<Location>> singleDayResult = new ArrayList<>();
            singleDayResult.add(new ArrayList<>(candidates));
            return singleDayResult;
        }

        // Initialize K centroids
        List<double[]> centroids = new ArrayList<>();
        // Day 1 centroid starts near startLocation
        centroids.add(new double[]{startLocation.getLatitude(), startLocation.getLongitude()});

        // Initialize remaining centroids using k-means++ style initialization
        List<Location> remainingForCentroids = new ArrayList<>(candidates);
        remainingForCentroids.remove(startLocation);

        while (centroids.size() < numDays && !remainingForCentroids.isEmpty()) {
            // Find candidate with maximum distance to closest existing centroid
            Location bestNext = null;
            double maxMinDist = -1;

            for (Location loc : remainingForCentroids) {
                if (loc.getLatitude() == null || loc.getLongitude() == null) continue;
                double minDist = Double.MAX_VALUE;
                for (double[] cent : centroids) {
                    double d = TspOptimizer.haversine(loc.getLatitude(), loc.getLongitude(), cent[0], cent[1]);
                    if (d < minDist) {
                        minDist = d;
                    }
                }
                if (minDist > maxMinDist) {
                    maxMinDist = minDist;
                    bestNext = loc;
                }
            }

            if (bestNext != null) {
                centroids.add(new double[]{bestNext.getLatitude(), bestNext.getLongitude()});
                remainingForCentroids.remove(bestNext);
            } else {
                // Fallback centroid
                centroids.add(new double[]{startLocation.getLatitude(), startLocation.getLongitude()});
            }
        }

        // K-Means assignment iterations
        List<List<Location>> clusters = new ArrayList<>();
        for (int d = 0; d < numDays; d++) {
            clusters.add(new ArrayList<>());
        }

        int maxKMeansIterations = 20;
        for (int iter = 0; iter < maxKMeansIterations; iter++) {
            for (List<Location> cluster : clusters) {
                cluster.clear();
            }

            // Assign each candidate location to nearest centroid
            for (Location loc : candidates) {
                if (loc.getLatitude() == null || loc.getLongitude() == null) continue;
                int bestClusterIdx = 0;
                double minDist = Double.MAX_VALUE;

                for (int i = 0; i < centroids.size(); i++) {
                    double[] cent = centroids.get(i);
                    double d = TspOptimizer.haversine(loc.getLatitude(), loc.getLongitude(), cent[0], cent[1]);
                    if (d < minDist) {
                        minDist = d;
                        bestClusterIdx = i;
                    }
                }
                clusters.get(bestClusterIdx).add(loc);
            }

            // Recalculate centroids
            for (int i = 0; i < centroids.size(); i++) {
                List<Location> cluster = clusters.get(i);
                if (!cluster.isEmpty()) {
                    double sumLat = 0, sumLon = 0;
                    int count = 0;
                    for (Location loc : cluster) {
                        if (loc.getLatitude() != null && loc.getLongitude() != null) {
                            sumLat += loc.getLatitude();
                            sumLon += loc.getLongitude();
                            count++;
                        }
                    }
                    if (count > 0) {
                        centroids.set(i, new double[]{sumLat / count, sumLon / count});
                    }
                }
            }
        }

        // Sort clusters so Day 1 is closest to startLocation, Day 2 is next, etc.
        clusters.sort((c1, c2) -> {
            double d1 = c1.isEmpty() ? Double.MAX_VALUE : TspOptimizer.haversine(
                    startLocation.getLatitude(), startLocation.getLongitude(),
                    c1.get(0).getLatitude(), c1.get(0).getLongitude());
            double d2 = c2.isEmpty() ? Double.MAX_VALUE : TspOptimizer.haversine(
                    startLocation.getLatitude(), startLocation.getLongitude(),
                    c2.get(0).getLatitude(), c2.get(0).getLongitude());
            return Double.compare(d1, d2);
        });

        return clusters;
    }
}
