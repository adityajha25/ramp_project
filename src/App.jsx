import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import RidePage from './pages/RidePage.jsx';
import { useRideComparison } from './hooks/useRideComparison.js';

export default function App() {
  const ride = useRideComparison();

  return (
    <Routes>
      <Route path="/" element={<HomePage ride={ride} />} />
      <Route path="/ride" element={<RidePage ride={ride} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
