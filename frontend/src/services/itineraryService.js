import api from './api';

export const generateItinerary = async (payload) => {
  const response = await api.post('/itineraries/generate', payload, { silent: true });
  return response.data;
};

export const saveItinerary = async (itineraryData) => {
  const response = await api.post('/itineraries', itineraryData, { silent: true });
  return response.data;
};

export const getSavedItineraries = async () => {
  const response = await api.get('/itineraries', { silent: true });
  return response.data;
};

export const getItineraryById = async (id) => {
  const response = await api.get(`/itineraries/${id}`, { silent: true });
  return response.data;
};

export const updateItinerary = async (id, itineraryData) => {
  const response = await api.put(`/itineraries/${id}`, itineraryData, { silent: true });
  return response.data;
};

export const deleteItinerary = async (id) => {
  const response = await api.delete(`/itineraries/${id}`, { silent: true });
  return response.data;
};
