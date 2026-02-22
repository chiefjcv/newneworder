import { format } from 'date-fns';
import { Order } from '../pages/KanbanBoard';

interface OrderCardProps {
  order: Order;
  isDueSoon: boolean;
  onStatusChange: (orderId: number, newStatus: string) => void;
  onDelete: (orderId: number) => void;
  onClick: () => void;
}

const OrderCard = ({ order, isDueSoon, onStatusChange, onDelete, onClick }: OrderCardProps) => {
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(order.id);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
        isDueSoon ? 'border-2 border-red-500' : 'border border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-wrap gap-1 mb-2">
        <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
          {order.order_type ?? 'Stock'}
        </span>
        {isDueSoon && (
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Due Soon
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{order.patient_name}</h3>
      <div className="text-sm text-gray-600 space-y-1 mb-3">
        <p>
          <span className="font-medium">Due:</span>{' '}
          {format(new Date(order.due_date), 'MMM dd, yyyy')}
        </p>
        <p>
          <span className="font-medium">Created:</span>{' '}
          {format(new Date(order.date_created), 'MMM dd, yyyy')}
        </p>
        {order.patient_rx && (
          <p className="text-xs text-gray-500 truncate">
            RX: {order.patient_rx}
          </p>
        )}
      </div>
      <div className="flex gap-2" onClick={handleStatusClick}>
        <select
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="Open">Open</option>
          <option value="Order Placed">Order Placed</option>
          <option value="In Progress">In Progress</option>
          <option value="Ready for Pickup">Ready for Pickup</option>
          <option value="Delivered">Delivered</option>
        </select>
        <button
          onClick={handleDeleteClick}
          className="text-red-600 hover:text-red-800 text-xs px-2"
          title="Delete order"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default OrderCard;

