import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { Order, ORDER_TYPES, STATUSES } from './KanbanBoard';
import CreateOrderModal from '../components/CreateOrderModal';

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');

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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (
        nameFilter &&
        !order.patient_name.toLowerCase().includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }

      const effectiveType = order.order_type ?? 'Stock';
      if (typeFilter !== 'All' && effectiveType !== typeFilter) {
        return false;
      }

      if (dueFrom) {
        const fromDate = new Date(dueFrom);
        const orderDue = new Date(order.due_date);
        if (orderDue < fromDate) return false;
      }

      if (dueTo) {
        const toDate = new Date(dueTo);
        const orderDue = new Date(order.due_date);
        if (orderDue > toDate) return false;
      }

      return true;
    });
  }, [orders, nameFilter, statusFilter, typeFilter, dueFrom, dueTo]);

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
            <h1 className="text-2xl font-bold text-gray-900">Order List</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1 rounded-md"
              >
                Kanban View
              </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="bg-white rounded-lg shadow-md p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Patient Name
            </label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Order Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All</option>
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Due From
              </label>
              <input
                type="date"
                value={dueFrom}
                onChange={(e) => setDueFrom(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Due To
              </label>
              <input
                type="date"
                value={dueTo}
                onChange={(e) => setDueTo(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Patient</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Due Date</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Created By
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Comments
                  </th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-gray-500 text-sm"
                    >
                      No orders match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/order/${order.id}`)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {order.patient_name}
                        </div>
                        {order.patient_rx && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            RX: {order.patient_rx}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {order.order_type ?? 'Stock'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {order.status}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {format(new Date(order.due_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {format(new Date(order.date_created), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {order.created_by_name ?? '—'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {order.comments?.length ?? 0}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/order/${order.id}`);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

export default OrderList;

