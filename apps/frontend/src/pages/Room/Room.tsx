import { useParams } from 'react-router-dom';

export function Room(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>
      <div className="text-center text-gray-500">
        Room board coming soon...
      </div>
    </div>
  );
}
