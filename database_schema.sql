CREATE DATABASE IF NOT EXISTS smart_travel_db;
USE smart_travel_db;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    district VARCHAR(100),
    image_url VARCHAR(500),
    latitude DOUBLE,
    longitude DOUBLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accommodations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location_id BIGINT NOT NULL,
    price DECIMAL(10, 2),
    rating DECIMAL(3, 1),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Insert some dummy data for locations
INSERT INTO locations (name, description, district, image_url, latitude, longitude) VALUES
('Sigiriya', 'Ancient rock fortress and palace ruin.', 'Matale', 'https://www.biofin.org/sites/default/files/content/news_media/Screenshot%202564-08-02%20at%2010.14.55.png', 7.9570, 80.7603),
('Temple of the Tooth', 'Buddhist temple in the city of Kandy, houses the relic of the tooth of the Buddha.', 'Kandy', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Temple_of_the_Tooth_-_Kandy.jpg/800px-Temple_of_the_Tooth_-_Kandy.jpg', 7.2936, 80.6413),
('Yala National Park', 'Famous for its variety of wild animals, especially leopards.', 'Hambantota', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Leopard_in_Yala_National_Park%2C_Sri_Lanka.jpg/800px-Leopard_in_Yala_National_Park%2C_Sri_Lanka.jpg', 6.3686, 81.5173),
('Galle Fort', 'Historical, archaeological and architectural heritage monument.', 'Galle', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Galle_Fort_Lighthouse_2.jpg/800px-Galle_Fort_Lighthouse_2.jpg', 6.0258, 80.2170),
('Nine Arches Bridge', 'One of the best examples of colonial-era railway construction in the country.', 'Badulla', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Nine_Arches_Bridge_in_Ella.jpg/800px-Nine_Arches_Bridge_in_Ella.jpg', 6.8767, 81.0607),
('Mirissa Beach', 'Famous for whale watching and beautiful sandy beaches.', 'Matara', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Mirissa_Beach%2C_Sri_Lanka.jpg/800px-Mirissa_Beach%2C_Sri_Lanka.jpg', 5.9483, 80.4716),
('Ella Rock', 'A popular hiking destination offering panoramic views of the hill country.', 'Badulla', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/View_from_Ella_Rock.jpg/800px-View_from_Ella_Rock.jpg', 6.8530, 81.0543),
('Nuwara Eliya', 'Often called Little England, known for its cool climate and tea plantations.', 'Nuwara Eliya', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Tea_plantation_in_Nuwara_Eliya.jpg/800px-Tea_plantation_in_Nuwara_Eliya.jpg', 6.9497, 80.7828),
('Polonnaruwa', 'Ancient city featuring well-preserved ruins of palaces and temples.', 'Polonnaruwa', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Gal_Viharaya%2C_Polonnaruwa.jpg/800px-Gal_Viharaya%2C_Polonnaruwa.jpg', 7.9403, 81.0188),
('Adam''s Peak', 'A tall conical mountain famous for the Sri Pada footprint.', 'Ratnapura', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Adam%27s_Peak_from_Maskeliya.jpg/800px-Adam%27s_Peak_from_Maskeliya.jpg', 6.8096, 80.4994);

-- Insert some dummy data for accommodations
INSERT INTO accommodations (name, location_id, price, rating, image_url) VALUES
('Sigiriya Village Hotel', 1, 150.00, 4.5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Hotel Sigiriya', 1, 120.00, 4.2, 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAFq4cJPqN9qdfzqFJ--WImMq7Qzefd70lQFjC2K72CCxzh5TX-NQX3KxZBzVsW0Yz62t3RYRfBMneQJi9yZrpzQKF0G_YovxNIxE-MPIzUQDVf6elaM_AkdWWFF2De5InJeb6VVaYKfpOT3=s680-w680-h510-rw'),
('Kandy City Hotel', 2, 80.00, 4.0, 'https://lh5.googleusercontent.com/proxy/U8tCfTi_zFgXuMHheskbWcaEFmxnyf111DJnuSaT9uW3C_EZCzGkzvZwgycdBCZtHXrQcrgrMNNKwJZvnRSsN6JgtJEQJRBYFIMh_jV9ThMmyNeZKZoZvGcvCpsKesGUXl-4dTr9jcgmfAUb5PZ_KYjtgJXSJg=w252-h168-k-no'),
('Cinnamon Citadel', 2, 200.00, 4.8, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Yala Safari Lodge', 3, 250.00, 4.7, 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Galle Heritage Hotel', 4, 180.00, 4.6, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Ella Flower Garden Resort', 5, 60.00, 4.3, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
