import React from 'react';
import Button from '../ui/Button';

interface StravaConnectProps {
  onConnect: () => void;
  isConnected: boolean;
  isLoading?: boolean;
}

const StravaConnect: React.FC<StravaConnectProps> = ({
  onConnect,
  isConnected,
  isLoading = false
}) => {
  const handleConnect = () => {
    if (!isConnected) {
      onConnect();
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Connected to Strava</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading}
      className="bg-orange-500 hover:bg-orange-600 text-white"
    >
      {isLoading ? 'Connecting...' : 'Connect Strava'}
    </Button>
  );
};

export default StravaConnect;
