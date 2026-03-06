import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../contexts/AuthContext';
import { Order } from './KanbanBoard';

interface OrderComment {
  id: number;
  comment: string;
  user_name: string;
  created_at: string;
}

interface HistoryItem {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  user_name: string;
  created_at: string;
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const orderInfoRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    patient_name: '',
    due_date: '',
    status: 'Open',
    order_type: 'Stock',
    sph_od: null as number | null,
    cyl_od: null as number | null,
    axis_od: null as number | null,
    add_od: null as number | null,
    va_od: '' as string,
    prism_bases_od: '' as string,
    sph_os: null as number | null,
    cyl_os: null as number | null,
    axis_os: null as number | null,
    add_os: null as number | null,
    va_os: '' as string,
    prism_bases_os: '' as string
  });

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`/api/orders/${id}`);
      setOrder(response.data);
      setFormData({
        patient_name: response.data.patient_name,
        due_date: response.data.due_date.split('T')[0],
        status: response.data.status,
        order_type: response.data.order_type ?? 'Stock',
        sph_od: response.data.sph_od ?? null,
        cyl_od: response.data.cyl_od ?? null,
        axis_od: response.data.axis_od ?? null,
        add_od: response.data.add_od ?? null,
        va_od: response.data.va_od ?? '',
        prism_bases_od: response.data.prism_bases_od ?? '',
        sph_os: response.data.sph_os ?? null,
        cyl_os: response.data.cyl_os ?? null,
        axis_os: response.data.axis_os ?? null,
        add_os: response.data.add_os ?? null,
        va_os: response.data.va_os ?? '',
        prism_bases_os: response.data.prism_bases_os ?? ''
      });
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      await axios.post(`/api/orders/${id}/comments`, { comment });
      setComment('');
      fetchOrder();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/orders/${id}`, formData);
      setEditing(false);
      fetchOrder();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const downloadPDF = () => {
    if (!orderInfoRef.current || !order) {
      console.error('Cannot download PDF: missing ref or order');
      return;
    }

    const element = orderInfoRef.current;
    const opt = {
      margin: 10,
      filename: `Order-${order.id}-${order.patient_name}.pdf`,
      image: { type: 'png' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const }
    };

    console.log('Generating PDF...');
    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Board
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div ref={orderInfoRef} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">Order Information</h2>
            <div className="flex gap-2">
              {!editing && (
                <>
                  <button
                    onClick={downloadPDF}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm font-medium flex items-center gap-1 transition-colors"
                    title="Download as PDF"
                  >
                    📄 Download PDF
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Type
                </label>
                <select
                  value={formData.order_type}
                  onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Stock">Stock</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Special">Special</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Order Placed">Order Placed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Eye</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Sph</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Cyl</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Axis</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Add.</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">VA</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Prism. Bases</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50">OD</td>
                      <td className="border border-gray-300 px-2 py-1"><input type="number" step="0.01" value={formData.sph_od ?? ''} onChange={(e) => setFormData({ ...formData, sph_od: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="number" step="0.01" value={formData.cyl_od ?? ''} onChange={(e) => setFormData({ ...formData, cyl_od: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="number" min="0" max="180" value={formData.axis_od ?? ''} onChange={(e) => setFormData({ ...formData, axis_od: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="number" step="0.01" value={formData.add_od ?? ''} onChange={(e) => setFormData({ ...formData, add_od: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="text" value={formData.va_od} onChange={(e) => setFormData({ ...formData, va_od: e.target.value })} placeholder="6/12" className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="text" value={formData.prism_bases_od} onChange={(e) => setFormData({ ...formData, prism_bases_od: e.target.value })} placeholder="6/12, N8" className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50">OS</td>
                      <td className="border border-gray-300 px-2 py-1"><input type="number" step="0.01" value={formData.sph_os ?? ''} onChange={(e) => setFormData({ ...formData, sph_os: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="number" step="0.01" value={formData.cyl_os ?? ''} onChange={(e) => setFormData({ ...formData, cyl_os: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="number" min="0" max="180" value={formData.axis_os ?? ''} onChange={(e) => setFormData({ ...formData, axis_os: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="number" step="0.01" value={formData.add_os ?? ''} onChange={(e) => setFormData({ ...formData, add_os: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="text" value={formData.va_os} onChange={(e) => setFormData({ ...formData, va_os: e.target.value })} placeholder="6/12" className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                      <td className="border border-gray-300 px-2 py-1"><input type="text" value={formData.prism_bases_os} onChange={(e) => setFormData({ ...formData, prism_bases_os: e.target.value })} placeholder="6/12, N8" className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      patient_name: order.patient_name,
                      due_date: order.due_date.split('T')[0],
                      status: order.status,
                      order_type: order.order_type ?? 'Stock',
                      sph_od: order.sph_od ?? null,
                      cyl_od: order.cyl_od ?? null,
                      axis_od: order.axis_od ?? null,
                      add_od: order.add_od ?? null,
                      va_od: order.va_od ?? '',
                      prism_bases_od: order.prism_bases_od ?? '',
                      sph_os: order.sph_os ?? null,
                      cyl_os: order.cyl_os ?? null,
                      axis_os: order.axis_os ?? null,
                      add_os: order.add_os ?? null,
                      va_os: order.va_os ?? '',
                      prism_bases_os: order.prism_bases_os ?? ''
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Patient Name:</span>
                <p className="text-lg text-gray-900">{order.patient_name}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Order Type:</span>
                  <p className="text-lg text-gray-900">{order.order_type ?? 'Stock'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <p className="text-lg text-gray-900">{order.status}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Due Date:</span>
                  <p className="text-lg text-gray-900">
                    {format(new Date(order.due_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Date Created:</span>
                <p className="text-gray-900">
                  {format(new Date(order.date_created), 'MMm dd, yyyy HH:mm')}
                </p>
              </div>

              <div className="border-t border-gray-300 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Eye</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Sph</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Cyl</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Axis</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Add.</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">VA</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Prism. Bases</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-semibold">OD</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.sph_od ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.cyl_od ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.axis_od ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.add_od ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.va_od ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.prism_bases_od ?? '—'}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-semibold">OS</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.sph_os ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.cyl_os ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.axis_os ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.add_os ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.va_os ?? '—'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{order.prism_bases_os ?? '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <form onSubmit={handleSubmitComment} className="mb-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
              />
              <button
                type="submit"
                disabled={submittingComment || !comment.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Comment
              </button>
            </form>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {order.comments && order.comments.length > 0 ? (
                order.comments.map((c: OrderComment) => (
                  <div key={c.id} className="border-b border-gray-200 pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900">{c.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(c.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{c.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No comments yet</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {order.history && order.history.length > 0 ? (
                order.history.map((item: HistoryItem) => (
                  <div key={item.id} className="border-b border-gray-200 pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900">{item.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Changed <span className="font-medium">{item.field_name}</span>
                      {item.old_value && (
                        <>
                          {' '}from <span className="italic">{item.old_value}</span>
                        </>
                      )}
                      {' '}to <span className="font-medium">{item.new_value}</span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No history yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

