import { useState } from 'react';
import { LayoutDashboard, Heart } from 'lucide-react';
import { ToastProvider } from '@/components/Toast';
import { PatientExperience } from '@/views/PatientExperience';
import { AdminDashboard } from '@/views/AdminDashboard';

type View = 'patient' | 'admin';

function App() {
  const [view, setView] = useState<View>('patient');

  return (
    <ToastProvider>
      {/* View toggle switch - fixed position */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 sm:bottom-5">
        <div className="glass border border-white/40 rounded-full p-1 shadow-premium flex items-center gap-1">
          <button
            onClick={() => setView('patient')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              view === 'patient'
                ? 'bg-gradient-brand text-white shadow-md'
                : 'text-slate-500 hover:text-brand-600'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Patient
          </button>
          <button
            onClick={() => setView('admin')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              view === 'admin'
                ? 'bg-gradient-brand text-white shadow-md'
                : 'text-slate-500 hover:text-brand-600'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>
      </div>

      {/* Main content */}
      <div key={view} className="animate-fade-in">
        {view === 'patient' ? <PatientExperience /> : <AdminDashboard />}
      </div>
    </ToastProvider>
  );
}

export default App;
