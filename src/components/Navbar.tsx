import React from 'react';
import { Database, FileCode, Shield, LogOut, ArrowRight, UserCheck } from 'lucide-react';
import { AuthSession } from '../types/inquiry';

interface NavbarProps {
  activeTab: 'public' | 'admin';
  setActiveTab: (tab: 'public' | 'admin') => void;
  session: AuthSession | null;
  onLogout: () => void;
  onOpenSupabaseModal: () => void;
  onOpenCodeModal: () => void;
  inquiryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  session,
  onLogout,
  onOpenSupabaseModal,
  onOpenCodeModal,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      {/* Strict 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text wordmark element */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('public')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
              Veritas <span className="text-blue-600">EdTech</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('public')}
            className={`transition-colors whitespace-nowrap pb-0.5 cursor-pointer ${
              activeTab === 'public'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Public Inquiry Form
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`transition-colors whitespace-nowrap pb-0.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Admin CRM Dashboard
          </button>

          <button
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Database className="w-4 h-4 text-slate-400" />
            <span>Supabase Config</span>
          </button>

          <button
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-slate-400" />
            <span>Schema & Code</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / Auth State */}
        <div className="flex items-center gap-3 shrink-0">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-medium text-slate-900 truncate max-w-[140px]">
                  {session.admin.full_name}
                </span>
                <span className="text-slate-500 font-mono text-[11px] truncate max-w-[140px]">
                  {session.admin.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                title="Log out from Admin session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('admin')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
              <ArrowRight className="w-3 h-3 hidden sm:inline" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
