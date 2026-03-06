import { useState } from 'react';
import axios from 'axios';
import { ORDER_TYPES } from '../pages/KanbanBoard';

interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOrderModal = ({ onClose, onSuccess }: CreateOrderModalProps) => {
  const [patientName, setPatientName] = useState('');
  const [patientRx, setPatientRx] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Open');
  const [orderType, setOrderType] = useState('Stock');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OD (Right Eye)
  const [sphOd, setSphOd] = useState('');
  const [cylOd, setCylOd] = useState('');
  const [axisOd, setAxisOd] = useState('');
  const [addOd, setAddOd] = useState('');
  const [vaOd, setVaOd] = useState('');
  const [prismBasesOd, setPrismBasesOd] = useState('');
  
  // OS (Left Eye)
  const [sphOs, setSphOs] = useState('');
  const [cylOs, setCylOs] = useState('');
  const [axisOs, setAxisOs] = useState('');
  const [addOs, setAddOs] = useState('');
  const [vaOs, setVaOs] = useState('');
  const [prismBasesOs, setPrismBasesOs] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/orders', {
        patient_name: patientName,
        patient_rx: patientRx,
        due_date: dueDate,
        status,
        order_type: orderType,
        sph_od: sphOd ? parseFloat(sphOd) : null,
        cyl_od: cylOd ? parseFloat(cylOd) : null,
        axis_od: axisOd ? parseInt(axisOd) : null,
        add_od: addOd ? parseFloat(addOd) : null,
        va_od: vaOd || null,
        prism_bases_od: prismBasesOd || null,
        sph_os: sphOs ? parseFloat(sphOs) : null,
        cyl_os: cylOs ? parseFloat(cylOs) : null,
        axis_os: axisOs ? parseInt(axisOs) : null,
        add_os: addOs ? parseFloat(addOs) : null,
        va_os: vaOs || null,
        prism_bases_os: prismBasesOs || null
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name *
            </label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="patientRx" className="block text-sm font-medium text-gray-700 mb-1">
              Patient RX
            </label>
            <textarea
              id="patientRx"
              value={patientRx}
              onChange={(e) => setPatientRx(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="orderType" className="block text-sm font-medium text-gray-700 mb-1">
              Order Type
            </label>
            <select
              id="orderType"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Open">Open</option>
              <option value="Order Placed">Order Placed</option>
              <option value="In Progress">In Progress</option>
              <option value="Ready for Pickup">Ready for Pickup</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Prescription</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">Eye</th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">Sph</th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">Cyl</th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">Axis</th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">Add.</th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">VA</th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">Prism Bases</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-medium">OD</td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="number"
                        step="0.01"
                        value={sphOd}
                        onChange={(e) => setSphOd(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="number"
                        step="0.01"
                        value={cylOd}
                        onChange={(e) => setCylOd(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={axisOd}
                        onChange={(e) => setAxisOd(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="number"
                        step="0.01"
                        value={addOd}
                        onChange={(e) => setAddOd(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="text"
                        value={vaOd}
                        onChange={(e) => setVaOd(e.target.value)}
                        placeholder="6/12, N8"
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="text"
                        value={prismBasesOd}
                        onChange={(e) => setPrismBasesOd(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-medium">OS</td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="number"
                        step="0.01"
                        value={sphOs}
                        onChange={(e) => setSphOs(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="number"
                        step="0.01"
                        value={cylOs}
                        onChange={(e) => setCylOs(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={axisOs}
                        onChange={(e) => setAxisOs(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="number"
                        step="0.01"
                        value={addOs}
                        onChange={(e) => setAddOs(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="text"
                        value={vaOs}
                        onChange={(e) => setVaOs(e.target.value)}
                        placeholder="6/12, N8"
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                      <input
                        type="text"
                        value={prismBasesOs}
                        onChange={(e) => setPrismBasesOs(e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;

