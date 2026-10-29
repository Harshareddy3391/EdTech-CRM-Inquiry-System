import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  X, 
  Check, 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  MessageSquare,
  Sparkles,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Category, Inquiry, InquiryFilterParams, InquiryStatus, UserType } from '../types/inquiry';
import { dbStorage } from '../services/storage';

interface AdminDashboardProps {
  onOpenSupabaseModal: () => void;
  onGoToInquiryForm: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenSupabaseModal,
  onGoToInquiryForm,
}) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedUserType, setSelectedUserType] = useState<UserType | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<InquiryStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected detail modal
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);

  // Status updating feedback
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const filters: InquiryFilterParams = {
        category: selectedCategory,
        user_type: selectedUserType,
        status: selectedStatus,
        search: searchQuery,
      };
      const data = await dbStorage.getInquiries(filters);
      setInquiries(data);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [selectedCategory, selectedUserType, selectedStatus, searchQuery]);

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    setUpdatingId(inquiryId);
    try {
      const updated = await dbStorage.updateInquiryStatus(inquiryId, newStatus);
      if (updated) {
        setInquiries(prev => prev.map(item => (item.id === inquiryId ? updated : item)));
        if (activeInquiry && activeInquiry.id === inquiryId) {
          setActiveInquiry(updated);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedUserType('All');
    setSelectedStatus('All');
    setSearchQuery('');
  };

  const handleSeedInquiries = async () => {
    setIsLoading(true);
    await dbStorage.seedDemoInquiries();
    await fetchInquiries();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all inquiries from database storage?')) {
      await dbStorage.clearAllInquiries();
      await fetchInquiries();
    }
  };

  const exportToCSV = () => {
    if (inquiries.length === 0) return;
    const headers = ['ID', 'Name', 'Phone', 'Email', 'User Type', 'Category', 'Date', 'Status', 'Message'];
    const rows = inquiries.map(i => [
      `"${i.id}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.phone.replace(/"/g, '""')}"`,
      `"${i.email.replace(/"/g, '""')}"`,
      `"${i.user_type}"`,
      `"${i.category}"`,
      `"${new Date(i.created_at).toISOString()}"`,
      `"${i.status}"`,
      `"${i.message.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edtech_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = inquiries.length;
    const countNew = inquiries.filter(i => i.status === 'New').length;
    const countInReview = inquiries.filter(i => i.status === 'In Review').length;
    const countContacted = inquiries.filter(i => i.status === 'Contacted').length;
    const countResolved = inquiries.filter(i => i.status === 'Resolved').length;
    return { total, countNew, countInReview, countContacted, countResolved };
  }, [inquiries]);

  const hasActiveFilters = 
    selectedCategory !== 'All' || 
    selectedUserType !== 'All' || 
    selectedStatus !== 'All' || 
    searchQuery.trim().length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Admin CRM Control Center
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-mono text-slate-500">JWT Authenticated</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Inquiry Management Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, filter, search, and progress all educational inquiries submitted to Supabase.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={fetchInquiries}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Refresh inquiry records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={inquiries.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onGoToInquiryForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>+ New Inquiry</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip (Tabular Numerals, Clean Single Elevation) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <span className="text-xs text-slate-500 block mb-1">Total Filtered</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.total}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <span className="text-xs text-blue-600 font-medium block mb-1">New Inquiries</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-blue-600">
            {stats.countNew}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <span className="text-xs text-amber-600 font-medium block mb-1">In Review</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-600">
            {stats.countInReview}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <span className="text-xs text-purple-600 font-medium block mb-1">Contacted</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-purple-600">
            {stats.countContacted}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-lg p-3.5">
          <span className="text-xs text-emerald-600 font-medium block mb-1">Resolved</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {stats.countResolved}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar (Mandatory Requirement C) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search bar for Name or Phone number */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by applicant name or phone number..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Filters (Category & User Type mandatory) */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter by Category */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Concert">Concert</option>
                <option value="Admission">Admission</option>
                <option value="General Query">General Query</option>
              </select>
            </div>

            {/* Filter by User Type */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                User Type:
              </label>
              <select
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value as any)}
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 cursor-pointer"
              >
                <option value="All">All Users</option>
                <option value="Parent">Parent</option>
                <option value="Student">Student</option>
                <option value="School">School</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Status:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="In Review">In Review</option>
                <option value="Contacted">Contacted</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Tabular View (Mandatory Requirement B) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-600" />
            <span className="text-sm">Loading inquiry records from Supabase...</span>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {hasActiveFilters ? 'No inquiries matching your criteria' : 'Database is currently empty'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              {hasActiveFilters
                ? 'Try adjusting your search query, user type, or category filters.'
                : 'As requested, the database initialized with clean empty tables. You can submit public inquiries or seed demo test inquiries.'}
            </p>

            <div className="flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Active Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={onGoToInquiryForm}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Submit First Inquiry
                  </button>
                  <button
                    onClick={handleSeedInquiries}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Populate Test Inquiries</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant & Details</th>
                  <th className="py-3 px-4">User Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inquiry) => (
                  <tr 
                    key={inquiry.id} 
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Name, Phone, Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {inquiry.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono tabular-nums">
                        <span>{inquiry.phone}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-sans truncate max-w-[200px]">{inquiry.email}</span>
                      </div>
                    </td>

                    {/* User Type (Clean Unboxed Metadata) */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {inquiry.user_type}
                    </td>

                    {/* Category (Clean Unboxed Metadata) */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {inquiry.category}
                    </td>

                    {/* Date (Tabular figures) */}
                    <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status Dropdown Workflow */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value as InquiryStatus)}
                        disabled={updatingId === inquiry.id}
                        className={`text-xs font-semibold py-1 px-2.5 rounded border focus:outline-none focus:ring-1 cursor-pointer transition-colors ${
                          inquiry.status === 'New'
                            ? 'bg-blue-50 border-blue-200 text-blue-700 focus:ring-blue-500'
                            : inquiry.status === 'In Review'
                            ? 'bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500'
                            : inquiry.status === 'Contacted'
                            ? 'bg-purple-50 border-purple-200 text-purple-700 focus:ring-purple-500'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500'
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="In Review">In Review</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActiveInquiry(inquiry)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info strip */}
        <div className="px-4 py-3 bg-slate-50/75 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="font-semibold text-slate-700">{inquiries.length}</strong> inquiries</span>
            <span aria-hidden="true">·</span>
            <span>Supabase PostgreSQL Schema Compliant</span>
          </div>
          {inquiries.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Table</span>
            </button>
          )}
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {activeInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  Inquiry #{activeInquiry.id.slice(0, 8)}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeInquiry.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveInquiry(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block mb-0.5">User Type</span>
                  <span className="font-semibold text-slate-800">{activeInquiry.user_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Category</span>
                  <span className="font-semibold text-slate-800">{activeInquiry.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Phone Number</span>
                  <a href={`tel:${activeInquiry.phone}`} className="font-mono text-blue-600 hover:underline">
                    {activeInquiry.phone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Email Address</span>
                  <a href={`mailto:${activeInquiry.email}`} className="text-blue-600 hover:underline truncate block">
                    {activeInquiry.email}
                  </a>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 block mb-0.5">Submitted On</span>
                  <span className="font-mono text-slate-700">
                    {new Date(activeInquiry.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                  Full Message Query
                </label>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {activeInquiry.message}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                  Lifecycle Status
                </label>
                <div className="flex items-center gap-2">
                  {(['New', 'In Review', 'Contacted', 'Resolved'] as InquiryStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(activeInquiry.id, st)}
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                        activeInquiry.status === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <a
                href={`mailto:${activeInquiry.email}?subject=RE: Your EdTech Inquiry on ${activeInquiry.category}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Compose Direct Email</span>
              </a>

              <button
                onClick={() => setActiveInquiry(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
