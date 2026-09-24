package com.smarttravel.backend.algorithm;

import com.smarttravel.backend.model.Location;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class DijkstraAlgorithm {

    public static class Node {
        private final Location location;

        public Node(Location location) {
            this.location = location;
        }

        public Location getLocation() {
            return location;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Node node = (Node) o;
            return Objects.equals(location.getId(), node.location.getId());
        }

        @Override
        public int hashCode() {
            return Objects.hash(location.getId());
        }
    }

    public static class Edge {
        private final Node destination;
        private final double weight;

        public Edge(Node destination, double weight) {
            this.destination = destination;
            this.weight = weight;
        }

        public Node getDestination() {
            return destination;
        }

        public double getWeight() {
            return weight;
        }
    }

    /**
     * Computes single-source shortest path using Dijkstra's algorithm.
     */
    public Map<Node, Double> findShortestPaths(Map<Node, List<Edge>> graph, Node source) {
        Map<Node, Double> distances = new HashMap<>();
        PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparingDouble(distances::get));

        for (Node node : graph.keySet()) {
            distances.put(node, Double.MAX_VALUE);
        }
        distances.put(source, 0.0);
        pq.add(source);

        Set<Node> visited = new HashSet<>();

        while (!pq.isEmpty()) {
            Node current = pq.poll();
            if (visited.contains(current)) continue;
            visited.add(current);

            List<Edge> edges = graph.getOrDefault(current, Collections.emptyList());
            for (Edge edge : edges) {
                Node neighbor = edge.getDestination();
                if (visited.contains(neighbor)) continue;

                double newDist = distances.get(current) + edge.getWeight();
                if (newDist < distances.get(neighbor)) {
                    distances.put(neighbor, newDist);
                    pq.add(neighbor);
                }
            }
        }
        return distances;
    }
}
