import { useState } from 'react';
import { Download, Mail, FileText, FileSpreadsheet, Calendar, Filter, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [delivery, setDelivery] = useState<'download' | 'email'>('download');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    type: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to export data');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (delivery === 'email') params.append('email', 'true');

      const endpoint = format === 'csv' ? 'csv' : 'excel';
      const url = `http://localhost:8000/api/export/${endpoint}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Export failed');
      }

      if (delivery === 'email') {
        // Email delivery
        const data = await response.json();
        setMessage(`✅ ${data.message}`);
      } else {
        // Direct download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `expenses_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        setMessage('✅ Download complete!');
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Export failed');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Export Your Data</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              📄 Export Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormat('csv')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  format === 'csv'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <FileText className={`w-8 h-8 mx-auto mb-2 ${format === 'csv' ? 'text-purple-600' : 'text-gray-400'}`} />
                <p className="font-semibold text-gray-800">CSV</p>
                <p className="text-xs text-gray-500 mt-1">Universal format</p>
              </button>

              <button
                onClick={() => setFormat('excel')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  format === 'excel'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${format === 'excel' ? 'text-purple-600' : 'text-gray-400'}`} />
                <p className="font-semibold text-gray-800">Excel</p>
                <p className="text-xs text-gray-500 mt-1">With formatting</p>
              </button>
            </div>
          </div>

          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              📬 Delivery Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDelivery('download')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  delivery === 'download'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <Download className={`w-8 h-8 mx-auto mb-2 ${delivery === 'download' ? 'text-purple-600' : 'text-gray-400'}`} />
                <p className="font-semibold text-gray-800">Download</p>
                <p className="text-xs text-gray-500 mt-1">Save to device</p>
              </button>

              <button
                onClick={() => setDelivery('email')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  delivery === 'email'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <Mail className={`w-8 h-8 mx-auto mb-2 ${delivery === 'email' ? 'text-purple-600' : 'text-gray-400'}`} />
                <p className="font-semibold text-gray-800">Email</p>
                <p className="text-xs text-gray-500 mt-1">Send via email</p>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                Filters (Optional)
              </label>
            </div>
            
            <div className="space-y-3">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Category and Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Food"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All</option>
                    <option value="expense">Expenses</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  {delivery === 'download' ? <Download className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                  Export {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}