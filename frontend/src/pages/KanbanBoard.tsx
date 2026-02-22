import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import OrderCard from '../components/OrderCard';
import CreateOrderModal from '../components/CreateOrderModal';
import { differenceInDays, parseISO } from 'date-fns';

export interface OrderHistoryItem {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  user_name: string;
  created_at: string;
}

export interface OrderComment {
  id: number;
  comment: string;
  user_name: string;
  created_at: string;
}

export const ORDER_TYPES = ['Stock', 'Purchase', 'Special'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export interface Order {
  id: number;
  patient_name: string;
  patient_rx: string;
  status: string;
  order_type?: string;
  date_created: string;
  due_date: string;
  created_by_name?: string;
  comments?: OrderComment[];
  history?: OrderHistoryItem[];
}

const STATUSES = ['Open', 'Order Placed', 'In Progress', 'Ready for Pickup', 'Delivered'];

const KanbanBoard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await axios.put(`/api/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (orderId: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`/api/orders/${orderId}`);
        fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const isDueSoon = (dueDate: string) => {
    const daysUntilDue = differenceInDays(parseISO(dueDate), new Date());
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                + New Order
              </button>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
          {STATUSES.map((status) => {
            const statusOrders = getOrdersByStatus(status);
            return (
              <div key={status} className="bg-gray-100 rounded-lg p-4 min-h-[500px] min-w-[250px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-700">{status}</h2>
                  <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                    {statusOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {statusOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isDueSoon={isDueSoon(order.due_date)}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onClick={() => navigate(`/order/${order.id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};

export default KanbanBoard;

