import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PublicInquiryForm } from './components/PublicInquiryForm';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { CodeExplorerModal } from './components/CodeExplorerModal';
import { authService } from './services/auth';
import { dbStorage } from './services/storage';
import { AuthSession } from './types/inquiry';

export default function App() {
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [inquiryCount, setInquiryCount] = useState<number>(0);

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  useEffect(() => {
    // Check initial auth session
    const currentSession = authService.getSession();
    setSession(currentSession);
    updateInquiryCount();
  }, []);

  const updateInquiryCount = async () => {
    try {
      const items = await dbStorage.getInquiries();
      setInquiryCount(items.length);
    } catch {
      setInquiryCount(0);
    }
  };

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setActiveTab('admin');
  };

  const handleLogout = () => {
    authService.logout();
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Strict 3-Zone Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        session={session}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        inquiryCount={inquiryCount}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'public' ? (
          <PublicInquiryForm
            onInquirySubmitted={updateInquiryCount}
            onGoToAdmin={() => setActiveTab('admin')}
          />
        ) : session ? (
          <AdminDashboard
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onGoToInquiryForm={() => setActiveTab('public')}
          />
        ) : (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        )}
      </main>

      {/* Quiet, Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Veritas EdTech CRM</span>
            <span aria-hidden="true">·</span>
            <span>Assessment Deliverable</span>
            <span aria-hidden="true">·</span>
            <span>FastAPI + React + Supabase PostgreSQL</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Supabase Settings
            </button>
            <button
              onClick={() => setIsCodeModalOpen(true)}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Inspect Code & Schema
            </button>
            <span>Custom JWT Auth Enabled</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigUpdated={updateInquiryCount}
      />

      <CodeExplorerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}
