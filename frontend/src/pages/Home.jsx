import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Sun, LogIn, UserPlus } from 'lucide-react';
import api from '../services/api';
import LocationCard from '../components/LocationCard';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const [featuredLocations, setFeaturedLocations] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get('/locations');

        console.log('Locations API response:', response.data);

        const locations = Array.isArray(response.data)
          ? response.data
          : response.data.locations || response.data.content || [];

        setFeaturedLocations(locations.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch locations', error);
        setFeaturedLocations([]);
      }
    };

    fetchLocations();
  }, []);

  return (
    <div className="home-page animate-fade-in">
      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content text-center">
          <h1>Discover the Pearl of the Indian Ocean</h1>
          <p className="hero-subtitle">
            Plan your perfect trip to Sri Lanka with smart routes, curated stays, and hidden gems.
          </p>

          {/* ✅ Only show buttons if NOT logged in */}
          {!user && (
            <div className="hero-actions mt-2">
              <Link to="/login" className="btn btn-primary">
                <LogIn /> Login to Explore
              </Link>
              <Link
                to="/register"
                className="btn btn-outline"
                style={{ borderColor: 'white', color: 'white' }}
              >
                <UserPlus /> Create Account
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="container mt-4 mb-4">
        <div className="section-header text-center mb-2">
          <h2>
            <Sun className="icon-inline" /> Top Destinations
          </h2>
          <p>Explore hand-picked beautiful spots across the island.</p>
        </div>

        <div className="grid">
          {Array.isArray(featuredLocations) &&
            featuredLocations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
        </div>

        <div className="text-center mt-2">
          <Link to="/explore" className="btn btn-outline">
            View All Destinations
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;