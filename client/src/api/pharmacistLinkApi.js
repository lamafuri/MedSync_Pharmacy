import axios from '../lib/axios';

export const linkViaOtp = async (otp) => {
  const response = await axios.post('/api/dashboard/patients/link', { qrToken: otp });
  return response.data;
};

export const linkViaQr = async (qrToken) => {
  const response = await axios.post('/api/dashboard/patients/link', { qrToken });
  return response.data;
};

export const getLinkedPatients = async () => {
  const response = await axios.get('/api/pharmacist-links/linked-patients');
  return response.data;
};

export const unlinkPatient = async (linkId) => {
  const response = await axios.delete(`/api/pharmacist-links/unlink/${linkId}`);
  return response.data;
};
