import { Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing/Landing';
import { Room } from './pages/Room/Room';

export function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </div>
  );
}
