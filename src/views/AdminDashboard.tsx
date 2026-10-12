import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Settings as SettingsIcon,
  Star,
  TrendingUp,
  MousePointerClick,
  AlertCircle,
  Phone,
  Download,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ArrowUpRight,
  MapPin,
  QrCode,
  Save,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/components/Toast';
import { supabase, DEPARTMENTS, type FeedbackRow, type AppSettings } from '@/lib/supabase';

type Tab = 'overview' | 'feedback' | 'settings';

export function AdminDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeedbacks = useCallback(async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Failed to load feedback data', 'error');
      return;
    }
    setFeedbacks((data as FeedbackRow[]) || []);
  }, [showToast]);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (data) setSettings(data as AppSettings);
  }, []);

  useEffect(() => {
    Promise.all([fetchFeedbacks(), fetchSettings()]).finally(() => setLoading(false));

    const channel = supabase
      .channel('feedback-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => {
        fetchFeedbacks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeedbacks, fetchSettings]);

  // Stats
  const totalFeedbacks = feedbacks.length;
  const avgRating =
    totalFeedbacks > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1)
      : '—';
  const googleRedirections = feedbacks.filter((f) => f.google_review_clicked).length;
  const pendingComplaints = feedbacks.filter(
    (f) => !f.is_positive && f.status === 'pending'
  ).length;

  // Filtered feedback
  const filteredFeedbacks = feedbacks.filter((f) => {
    if (deptFilter !== 'all' && f.department !== deptFilter) return false;
    if (ratingFilter === 'positive' && !f.is_positive) return false;
    if (ratingFilter === 'negative' && f.is_positive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        f.patient_name?.toLowerCase().includes(q) ||
        f.patient_mobile?.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.message?.toLowerCase().includes(q) ||
        f.feedback_tags?.some((t) => t.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const handleMarkResolved = async (id: string) => {
    const { error } = await supabase
      .from('feedback')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (error) {
      showToast('Failed to update status', 'error');
      return;
    }
    showToast('Marked as resolved', 'success');
  };

  const handleCallPatient = (mobile: string | null) => {
    if (!mobile) {
      showToast('No mobile number provided', 'warning');
      return;
    }
    window.open(`tel:${mobile}`);
  };

  const handleExportCSV = () => {
    if (filteredFeedbacks.length === 0) {
      showToast('No feedback to export', 'warning');
      return;
    }

    const headers = ['Date', 'Department', 'Rating', 'Type', 'Tags', 'Message', 'Patient Name', 'Mobile', 'Room/OPD', 'Status', 'Google Clicked'];
    const rows = filteredFeedbacks.map((f) => [
      new Date(f.created_at).toLocaleString('en-IN'),
      f.department,
      f.rating,
      f.is_positive ? 'Positive' : 'Complaint',
      f.feedback_tags?.join('; ') || '',
      f.message || '',
      f.patient_name || '',
      f.patient_mobile || '',
      f.patient_room || '',
      f.status,
      f.google_review_clicked ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mannat-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredFeedbacks.length} records to CSV`, 'success');
  };

  const handleSaveSettings = async (updated: Partial<AppSettings>) => {
    const { error } = await supabase
      .from('app_settings')
      .update({
        ...updated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      showToast('Failed to save settings', 'error');
      return;
    }
    setSettings((prev) => (prev ? { ...prev, ...updated } : null));
    showToast('Settings saved successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin header */}
      <header className="glass sticky top-0 z-50 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-md">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm sm:text-base text-brand-900 truncate leading-tight">
                Admin Dashboard
              </h1>
              <p className="text-[11px] text-slate-500 truncate">Al Mannat Hospital · Feedback Management</p>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1 bg-slate-100/80 rounded-xl p-1">
            {([
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'feedback', label: 'Feedback', icon: MessageSquare },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-500 hover:text-brand-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard
                    icon={MessageSquare}
                    label="Total Feedbacks"
                    value={totalFeedbacks.toString()}
                    color="brand"
                  />
                  <StatCard
                    icon={Star}
                    label="Avg Rating"
                    value={avgRating !== '—' ? `${avgRating}` : '—'}
                    suffix={avgRating !== '—' ? '★' : ''}
                    color="gold"
                  />
                  <StatCard
                    icon={MousePointerClick}
                    label="Google Redirections"
                    value={googleRedirections.toString()}
                    color="teal"
                  />
                  <StatCard
                    icon={AlertCircle}
                    label="Complaints Pending"
                    value={pendingComplaints.toString()}
                    color="red"
                  />
                </div>

                {/* Recent feedback preview */}
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
                    <h2 className="font-display font-bold text-base sm:text-lg text-brand-900">Recent Activity</h2>
                    <button
                      onClick={() => setActiveTab('feedback')}
                      className="text-sm text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      View all
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {feedbacks.slice(0, 5).map((f) => (
                      <FeedbackRowItem
                        key={f.id}
                        feedback={f}
                        onResolve={handleMarkResolved}
                        onCall={handleCallPatient}
                        compact
                      />
                    ))}
                    {feedbacks.length === 0 && (
                      <div className="py-12 text-center">
                        <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No feedback yet. Share the QR code to start collecting.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-4 animate-fade-in">
                {/* Filters bar */}
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, mobile, message..."
                      className="w-full rounded-xl border-2 border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <FilterSelect
                      value={deptFilter}
                      onChange={setDeptFilter}
                      options={[{ value: 'all', label: 'All Departments' }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
                      icon={Filter}
                    />
                    <FilterSelect
                      value={ratingFilter}
                      onChange={setRatingFilter}
                      options={[
                        { value: 'all', label: 'All Ratings' },
                        { value: 'positive', label: 'Positive (4-5★)' },
                        { value: 'negative', label: 'Complaints (1-3★)' },
                      ]}
                      icon={Star}
                    />
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Feedback table */}
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Date</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Department</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Rating</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Details</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Patient</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredFeedbacks.map((f) => (
                          <FeedbackTableRow
                            key={f.id}
                            feedback={f}
                            onResolve={handleMarkResolved}
                            onCall={handleCallPatient}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredFeedbacks.length === 0 && (
                    <div className="py-12 text-center">
                      <Search className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No feedback matches your filters.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <SettingsTab settings={settings} onSave={handleSaveSettings} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  suffix?: string;
  color: 'brand' | 'gold' | 'teal' | 'red';
}) {
  const colorMap = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-700', iconBg: 'bg-brand-600' },
    gold: { bg: 'bg-gold-50', text: 'text-gold-700', iconBg: 'bg-gold-500' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-600' },
    red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-500' },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 sm:p-5 hover:shadow-premium transition-shadow duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl sm:text-3xl font-bold text-brand-900">{value}</span>
        {suffix && <span className="text-xl text-gold-500 font-bold">{suffix}</span>}
      </div>
      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}

function FeedbackRowItem({
  feedback: f,
  onResolve,
  onCall,
  compact = false,
}: {
  feedback: FeedbackRow;
  onResolve: (id: string) => void;
  onCall: (mobile: string | null) => void;
  compact?: boolean;
}) {
  const timeAgo = getTimeAgo(f.created_at);

  return (
    <div className={`flex items-center gap-3 ${compact ? 'px-4 sm:px-5 py-3' : 'px-4 py-3.5'} hover:bg-slate-50/50 transition-colors`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        f.is_positive ? 'bg-brand-50' : 'bg-amber-50'
      }`}>
        <Star className={`w-5 h-5 ${f.is_positive ? 'fill-brand-500 text-brand-500' : 'fill-amber-400 text-amber-400'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-brand-900">{f.department}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400">{timeAgo}</span>
          {f.google_review_clicked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full">
              <MousePointerClick className="w-2.5 h-2.5" /> Google
            </span>
          )}
        </div>
        {f.feedback_tags && f.feedback_tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {f.feedback_tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        {f.message && !compact && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{f.message}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!f.is_positive && f.status === 'pending' && (
          <button
            onClick={() => onResolve(f.id)}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resolve</span>
          </button>
        )}
        {f.patient_mobile && (
          <button
            onClick={() => onCall(f.patient_mobile)}
            className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Call</span>
          </button>
        )}
      </div>
    </div>
  );
}

function FeedbackTableRow({
  feedback: f,
  onResolve,
  onCall,
}: {
  feedback: FeedbackRow;
  onResolve: (id: string) => void;
  onCall: (mobile: string | null) => void;
}) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3.5">
        <div className="text-sm text-slate-700 font-medium">{new Date(f.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
        <div className="text-xs text-slate-400">{new Date(f.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-sm font-medium text-brand-900">{f.department}</span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <Star className={`w-4 h-4 ${f.is_positive ? 'fill-brand-500 text-brand-500' : 'fill-amber-400 text-amber-400'}`} />
          <span className="text-sm font-bold text-slate-700">{f.rating}</span>
        </div>
      </td>
      <td className="px-4 py-3.5 max-w-xs">
        {f.feedback_tags && f.feedback_tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-1">
            {f.feedback_tags.map((tag) => (
              <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        {f.message && <p className="text-xs text-slate-500 line-clamp-2">{f.message}</p>}
        {!f.feedback_tags?.length && !f.message && <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3.5">
        {f.patient_name ? (
          <>
            <div className="text-sm font-medium text-slate-700">{f.patient_name}</div>
            <div className="text-xs text-slate-400">{f.patient_mobile || '—'}{f.patient_room ? ` · ${f.patient_room}` : ''}</div>
          </>
        ) : (
          <span className="text-xs text-slate-300">Anonymous</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        {f.is_positive ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Positive
          </span>
        ) : f.status === 'resolved' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1.5">
          {!f.is_positive && f.status === 'pending' && (
            <button
              onClick={() => onResolve(f.id)}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Mark as Resolved"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Resolve</span>
            </button>
          )}
          {f.patient_mobile && (
            <button
              onClick={() => onCall(f.patient_mobile)}
              className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Call Patient"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Call</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon: typeof Filter;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border-2 border-slate-200 pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

function SettingsTab({
  settings,
  onSave,
}: {
  settings: AppSettings | null;
  onSave: (updated: Partial<AppSettings>) => void;
}) {
  const [googleUrl, setGoogleUrl] = useState('');
  const [whatsappNum, setWhatsappNum] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setGoogleUrl(settings.google_review_url);
      setWhatsappNum(settings.whatsapp_number);
      setHospitalName(settings.hospital_name);
      setHospitalAddress(settings.hospital_address);
      setHospitalPhone(settings.hospital_phone);
      setQrUrl(window.location.origin);
    }
  }, [settings]);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Configuration card */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-brand-600" />
          </div>
          <h2 className="font-display font-bold text-base sm:text-lg text-brand-900">Configuration</h2>
        </div>

        <div className="space-y-4">
          <SettingField
            label="Google Review URL"
            description="Where patients are redirected after a 4-5 star rating"
            value={googleUrl}
            onChange={setGoogleUrl}
            placeholder="https://maps.app.goo.gl/F8DsCdTSHzyxJaZLA"
            onSave={() => onSave({ google_review_url: googleUrl })}
          />
          <SettingField
            label="WhatsApp Alert Number"
            description="Number used for WhatsApp share links"
            value={whatsappNum}
            onChange={setWhatsappNum}
            placeholder="919355410932"
            onSave={() => onSave({ whatsapp_number: whatsappNum })}
          />
          <SettingField
            label="Hospital Name"
            description="Displayed on patient-facing pages"
            value={hospitalName}
            onChange={setHospitalName}
            placeholder="Al Mannat Hospital Pvt. Ltd."
            onSave={() => onSave({ hospital_name: hospitalName })}
          />
          <SettingField
            label="Hospital Address"
            description="Shown in header and footer"
            value={hospitalAddress}
            onChange={setHospitalAddress}
            placeholder="F-166, Shaheen Bagh, New Delhi - 110025"
            onSave={() => onSave({ hospital_address: hospitalAddress })}
          />
          <SettingField
            label="Hospital Phone"
            description="Emergency call shortcut number"
            value={hospitalPhone}
            onChange={setHospitalPhone}
            placeholder="09355410932"
            onSave={() => onSave({ hospital_phone: hospitalPhone })}
          />
        </div>
      </div>

      {/* QR Code poster */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-teal-600" />
          </div>
          <h2 className="font-display font-bold text-base sm:text-lg text-brand-900">QR Code Poster</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Print this QR code and display it at your reception, consultation rooms, and patient waiting areas. Patients scan it to access the feedback page instantly.
        </p>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Poster preview */}
          <div className="bg-gradient-brand rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-24 h-24 border-4 border-white rounded-full" />
              <div className="absolute bottom-4 right-4 w-20 h-20 border-4 border-white rounded-full" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+</span>
                </div>
                <h3 className="font-display font-bold text-white text-lg">{settings?.hospital_name ?? 'Al Mannat Hospital'}</h3>
              </div>
              <p className="text-white/70 text-xs mb-5 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" /> Shaheen Bagh, New Delhi
              </p>

              <div className="bg-white rounded-2xl p-4 inline-block shadow-xl mb-5">
                <QRCodeSVG
                  value={qrUrl || currentUrl}
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#064e3b"
                />
              </div>

              <p className="text-white font-display font-bold text-xl mb-1">Share Your Experience</p>
              <p className="text-white/70 text-sm">Scan to rate your visit</p>

              <div className="flex justify-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-gold-300 text-gold-300" />
                ))}
              </div>
            </div>
          </div>

          {/* QR download options */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-brand-900 mb-1.5 block">QR Code Destination URL</label>
              <input
                type="text"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">This is the URL the QR code will open when scanned.</p>
            </div>

            <button
              onClick={() => {
                const svg = document.querySelector('.bg-white.rounded-2xl.p-4 svg');
                if (svg) {
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const blob = new Blob([svgData], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'mannat-qr-code.svg';
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-lg"
            >
              <Download className="w-4 h-4" />
              Download QR Code (SVG)
            </button>

            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-brand-200 hover:bg-brand-50 text-brand-700 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Print Poster Layout
            </button>

            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
              <p className="font-semibold text-slate-600 mb-1">Tips for printing:</p>
              <ul className="space-y-1">
                <li>• Print on A4 or A3 size for best visibility</li>
                <li>• Place at eye level near exit points</li>
                <li>• Lamination recommended for durability</li>
                <li>• Use one poster per department/room</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingField({
  label,
  description,
  value,
  onChange,
  placeholder,
  onSave,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSave: () => void;
}) {
  const [savedValue, setSavedValue] = useState(value);

  useEffect(() => {
    setSavedValue(value);
  }, [value]);

  const isDirty = value !== savedValue;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <label className="text-sm font-semibold text-brand-900 block">{label}</label>
        <p className="text-xs text-slate-400 mb-2">{description}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
        />
      </div>
      <button
        onClick={() => {
          onSave();
          setSavedValue(value);
        }}
        disabled={!isDirty}
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
          isDirty
            ? 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95 shadow-sm'
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
        }`}
      >
        <Save className="w-4 h-4" />
        Save
      </button>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
