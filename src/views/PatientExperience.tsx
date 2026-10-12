import { useState, useEffect } from 'react';
import {
  Phone,
  MapPin,
  Stethoscope,
  Bone,
  Activity,
  UserRound,
  ClipboardList,
  Heart,
  CheckCircle2,
  Star,
  Share2,
  Send,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { StarRating } from '@/components/StarRating';
import { useToast } from '@/components/Toast';
import { supabase, DEPARTMENTS, FEEDBACK_TAGS, type AppSettings } from '@/lib/supabase';

const DEPT_ICONS: Record<string, typeof Bone> = {
  'Orthopaedic Care': Bone,
  'General Physician': Stethoscope,
  'Physiotherapy': Activity,
  'Front Desk & Billing': ClipboardList,
  'General Care': Heart,
};

type Phase = 'selection' | 'rating' | 'positive' | 'negative';

export function PatientExperience() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [phase, setPhase] = useState<Phase>('selection');
  const [department, setDepartment] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientMobile, setPatientMobile] = useState('');
  const [patientRoom, setPatientRoom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleRedirectTracked, setGoogleRedirectTracked] = useState(false);

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as AppSettings);
    });
  }, []);

  const handleRatingSubmit = async (selectedRating: number) => {
    setRating(selectedRating);
    const isPositive = selectedRating >= 4;

    if (!department) {
      showToast('Please select a department first', 'warning');
      return;
    }

    const { error } = await supabase.from('feedback').insert({
      department,
      rating: selectedRating,
      is_positive: isPositive,
      google_review_clicked: false,
    });

    if (error) {
      showToast('Could not submit rating. Please try again.', 'error');
      return;
    }

    if (isPositive) {
      setPhase('positive');
    } else {
      setPhase('negative');
    }
  };

  const handleGoogleRedirect = async () => {
    if (googleRedirectTracked) {
      window.open(settings?.google_review_url, '_blank');
      return;
    }

    const { data: recentRows } = await supabase
      .from('feedback')
      .select('id')
      .eq('department', department)
      .eq('rating', rating)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentRows && recentRows.length > 0) {
      await supabase
        .from('feedback')
        .update({ google_review_clicked: true })
        .eq('id', recentRows[0].id);
    }

    setGoogleRedirectTracked(true);
    window.open(settings?.google_review_url, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `I had a great experience at ${settings?.hospital_name ?? 'Al Mannat Hospital'}! Rated ${rating} stars for ${department}. Highly recommended.`
    );
    const url = `https://wa.me/${settings?.whatsapp_number ?? '919355410932'}?text=${text}`;
    window.open(url, '_blank');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNegativeSubmit = async () => {
    if (selectedTags.length === 0 && !message.trim()) {
      showToast('Please select a tag or write a message', 'warning');
      return;
    }

    setSubmitting(true);

    const { data: recentRows } = await supabase
      .from('feedback')
      .select('id')
      .eq('department', department)
      .eq('rating', rating)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentRows && recentRows.length > 0) {
      await supabase
        .from('feedback')
        .update({
          feedback_tags: selectedTags,
          message: message.trim() || null,
          patient_name: patientName.trim() || null,
          patient_mobile: patientMobile.trim() || null,
          patient_room: patientRoom.trim() || null,
        })
        .eq('id', recentRows[0].id);
    }

    setSubmitting(false);
    showToast('Your private feedback has been submitted to management. Thank you.', 'success');
    handleReset();
  };

  const handleReset = () => {
    setTimeout(() => {
      setPhase('selection');
      setDepartment('');
      setRating(0);
      setSelectedTags([]);
      setMessage('');
      setPatientName('');
      setPatientMobile('');
      setPatientRoom('');
      setGoogleRedirectTracked(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-brand-soft relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gold-100/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/40 shadow-glass">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-lg">
              <Plus className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm sm:text-base text-brand-900 truncate leading-tight">
                {settings?.hospital_name ?? 'Al Mannat Hospital Pvt. Ltd.'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                Shaheen Bagh, New Delhi
              </p>
            </div>
          </div>
          <a
            href={`tel:${settings?.hospital_phone ?? '09355410932'}`}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 shadow-md flex-shrink-0"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Emergency Call</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 sm:py-10 pb-24">
        {/* Welcome hero - only on selection phase */}
        {phase === 'selection' && (
          <div className="text-center mb-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-brand-200/50 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-xs font-semibold text-brand-700 tracking-wide">Your experience matters to us</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mb-2 leading-tight">
              Share Your Experience
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
              Help us serve you better. Your feedback directly shapes the care we provide.
            </p>
          </div>
        )}

        {/* Phase: Selection */}
        {phase === 'selection' && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-brand-600" />
                </div>
                <h3 className="font-display font-semibold text-brand-900 text-base sm:text-lg">
                  Which department did you visit?
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEPARTMENTS.map((dept) => {
                  const Icon = DEPT_ICONS[dept] ?? Stethoscope;
                  const isSelected = department === dept;
                  return (
                    <button
                      key={dept}
                      onClick={() => {
                        setDepartment(dept);
                        setPhase('rating');
                      }}
                      className={`group flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left active:scale-[0.98] ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 shadow-md'
                          : 'border-slate-100 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-50 text-brand-600 group-hover:bg-brand-100'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-sm font-semibold flex-1 ${isSelected ? 'text-brand-900' : 'text-slate-700'}`}>
                        {dept}
                      </span>
                      <ArrowRight className={`w-4 h-4 transition-all ${isSelected ? 'text-brand-600 translate-x-0' : 'text-slate-300 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                  <span>Your feedback is confidential and secure</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Rating */}
        {phase === 'rating' && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6 sm:p-8">
              <button
                onClick={() => {
                  setPhase('selection');
                  setDepartment('');
                  setRating(0);
                }}
                className="text-sm text-slate-500 hover:text-brand-700 font-medium mb-4 flex items-center gap-1 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Change department
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                  {(() => {
                    const Icon = DEPT_ICONS[department] ?? Stethoscope;
                    return <Icon className="w-5 h-5 text-brand-600" />;
                  })()}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Department</p>
                  <p className="text-sm font-semibold text-brand-900">{department}</p>
                </div>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-900 mb-2 text-center mt-4">
                How was your visit?
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Tap to rate your overall experience
              </p>

              <div className="flex justify-center mb-4">
                <StarRating value={rating} onChange={handleRatingSubmit} size="xl" />
              </div>

              <div className="flex justify-center gap-6 text-center text-xs text-slate-400 mt-4">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                  4-5: Google Review
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-slate-400" />
                  1-3: Private Feedback
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Positive (4-5 stars) */}
        {phase === 'positive' && (
          <div className="animate-bounce-in">
            <div className="bg-white rounded-2xl shadow-deep border border-slate-100 overflow-hidden">
              {/* Success header */}
              <div className="bg-gradient-brand p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 left-4 w-20 h-20 border-4 border-white rounded-full" />
                  <div className="absolute bottom-2 right-4 w-16 h-16 border-4 border-white rounded-full" />
                  <div className="absolute top-1/2 right-8 w-10 h-10 border-2 border-white rounded-full" />
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 animate-float">
                    <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                    We're thrilled you had a great visit!
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base max-w-sm mx-auto">
                    Your {rating}-star rating means the world to our team. Would you mind sharing it publicly?
                  </p>
                  <div className="flex justify-center gap-1.5 mt-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${s <= rating ? 'fill-gold-300 text-gold-300' : 'fill-transparent text-white/30'} animate-star-pop`}
                        style={{ animationDelay: `${s * 80}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-5 sm:p-6 space-y-3">
                <button
                  onClick={handleGoogleRedirect}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 active:scale-[0.98] shadow-lg group"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 11v8.5h-2V11h2zm7.5 1.5c0-3-2.5-5.5-5.5-5.5s-5.5 2.5-5.5 5.5 2.5 5.5 5.5 5.5c1.5 0 2.8-.6 3.8-1.5l-1.2-1.2c-.7.6-1.6 1-2.6 1-2 0-3.5-1.5-3.5-3.5s1.5-3.5 3.5-3.5c1 0 1.9.4 2.6 1.1l1.2-1.2c-1-.9-2.3-1.5-3.8-1.5v-1c3 0 5.5 2.5 5.5 5.5z" opacity="0" />
                  </svg>
                  <span>Post Review on Google Maps</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-green-500 hover:bg-green-50 text-green-600 py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  onClick={handleReset}
                  className="w-full text-sm text-slate-400 hover:text-slate-600 font-medium py-2 transition-colors"
                >
                  Submit another review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Negative (1-3 stars) */}
        {phase === 'negative' && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">
                      We'd like to make this right
                    </h3>
                    <p className="text-white/70 text-xs sm:text-sm">
                      Your feedback goes directly to our management — confidentially.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Tags */}
                <div>
                  <label className="text-sm font-semibold text-brand-900 mb-3 block">
                    What could we improve? <span className="text-slate-400 font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border-2 transition-all duration-200 active:scale-95 ${
                            active
                              ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm font-semibold text-brand-900 mb-2 block">
                    Please tell us how we can improve your experience.
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Share details about your visit..."
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all resize-none"
                  />
                </div>

                {/* Patient details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Your Name
                    </label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full rounded-xl border-2 border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={patientMobile}
                        onChange={(e) => setPatientMobile(e.target.value)}
                        placeholder="10-digit number"
                        className="w-full rounded-xl border-2 border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                    Room / OPD No. <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={patientRoom}
                      onChange={(e) => setPatientRoom(e.target.value)}
                      placeholder="e.g. OPD-12 or Room 204"
                      className="w-full rounded-xl border-2 border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                  />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                  <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>Your details are kept confidential and shared only with hospital management.</span>
                </div>

                <button
                  onClick={handleNegativeSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Private Feedback to Management'}
                </button>

                <button
                  onClick={handleReset}
                  className="w-full text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  Cancel and start over
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-slate-400">
            {settings?.hospital_name ?? 'Al Mannat Hospital Pvt. Ltd.'} · {settings?.hospital_address ?? 'Shaheen Bagh, New Delhi'}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Plus({ className, strokeWidth = 3 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
