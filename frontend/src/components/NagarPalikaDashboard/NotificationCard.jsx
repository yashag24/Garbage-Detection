import { Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

const NotificationCard = ({ notification, formatDate }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/4 mb-4 md:mb-0 relative">
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
              AI Confidence: {(notification.confidence * 100).toFixed(0)}%
            </div>
            <img
              src={notification.image}
              alt={`Garbage at ${notification.location}`}
              className="rounded-lg w-full h-48 object-cover"
            />
          </div>

          <div className="md:w-3/4 md:pl-6">
            <div className="flex flex-col md:flex-row md:justify-between mb-2">
              <h3 className="text-lg font-medium text-indigo-900 mb-1 md:mb-0">{notification.location}</h3>
              <StatusBadge status={notification.status} />
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatDate(notification.timestamp)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Coordinates:</p>
                <p className="font-medium">
                  {notification.coordinates.lat.toFixed(4)}, {notification.coordinates.lng.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Reported by:</p>
                <p className="font-medium">{notification.reportedBy}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              {notification.status === "pending" && (
                <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-700 hover:to-blue-700">
                  Assign Cleanup Team
                </button>
              )}
              {notification.status === "inProgress" && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Update Status
                </button>
              )}
              {notification.status === "completed" && (
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 opacity-50" disabled>
                  Cleanup Complete
                </button>
              )}
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;