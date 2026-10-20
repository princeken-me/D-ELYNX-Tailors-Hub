import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Save,
  Ruler,
  Info,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { useAuth } from '../../contexts/AuthContext';

interface BespokeMeasurements {
  unit: 'inches' | 'cm';
  chest: string;
  waist: string;
  hips: string;
  shoulder: string;
  sleeve: string;
  inseam: string;
  neck: string;
  height: string;
  fitPreference: 'slim' | 'regular' | 'relaxed';
  specialNotes: string;
}

const DEFAULT_MEASUREMENTS: BespokeMeasurements = {
  unit: 'inches',
  chest: '',
  waist: '',
  hips: '',
  shoulder: '',
  sleeve: '',
  inseam: '',
  neck: '',
  height: '',
  fitPreference: 'regular',
  specialNotes: '',
};

const STORAGE_KEY = 'delynx_customer_measurements';

export const MeasurementsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const userId = user?.id || profile?.id || 'usr_guest_demo';

  const [measurements, setMeasurements] = useState<BespokeMeasurements>(DEFAULT_MEASUREMENTS);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (stored) {
        setMeasurements(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse saved measurements:', e);
    }
  }, [userId]);

  const handleChange = (field: keyof BespokeMeasurements, val: any) => {
    setMeasurements((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(measurements));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="customer-measurements-page" className="space-y-8 pb-12 max-w-3xl">
      {/* Header & Back Link */}
      <div>
        <Link
          to="/account"
          id="btn-back-to-account-measurements"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </Link>

        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
              Bespoke Tailoring
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Custom Measurements Profile
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Save your anatomical specifications for bespoke commissions and tailor consultations.
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Your measurements profile has been securely saved.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Unit and Fit Preference */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-serif uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                <span>Measurement Preferences</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Select your preferred unit system and tailoring drape.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleChange('unit', 'inches')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  measurements.unit === 'inches'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => handleChange('unit', 'cm')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  measurements.unit === 'cm'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">
              Silhouette & Fit Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slim', 'regular', 'relaxed'] as const).map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => handleChange('fitPreference', pref)}
                  className={`p-2.5 rounded-xl border text-xs font-medium capitalize transition cursor-pointer ${
                    measurements.fitPreference === pref
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {pref} Fit
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Anatomical Dimensions Grid */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <h3 className="text-xs font-serif uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>Body Dimensions ({measurements.unit})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Chest / Bust
              </label>
              <input
                type="text"
                placeholder={measurements.unit === 'inches' ? 'e.g. 40' : 'e.g. 102'}
                value={measurements.chest}
                onChange={(e) => handleChange('chest', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Waist
              </label>
              <input
                type="text"
                placeholder={measurements.unit === 'inches' ? 'e.g. 34' : 'e.g. 86'}
                value={measurements.waist}
                onChange={(e) => handleChange('waist', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Hips / Seat
              </label>
              <input
                type="text"
                placeholder={measurements.unit === 'inches' ? 'e.g. 42' : 'e.g. 107'}
                value={measurements.hips}
                onChange={(e) => handleChange('hips', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Shoulder Width
              </label>
              <input
                type="text"
                placeholder={measurements.unit === 'inches' ? 'e.g. 18.5' : 'e.g. 47'}
                value={measurements.shoulder}
                onChange={(e) => handleChange('shoulder', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Sleeve Length
              </label>
              <input
                type="text"
                placeholder={measurements.unit === 'inches' ? 'e.g. 25' : 'e.g. 64'}
                value={measurements.sleeve}
                onChange={(e) => handleChange('sleeve', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Trouser Inseam
              </label>
              <input
                type="text"
                placeholder={measurements.unit === 'inches' ? 'e.g. 32' : 'e.g. 81'}
                value={measurements.inseam}
                onChange={(e) => handleChange('inseam', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Neck Collar
              </label>
              <input
                type="text"
                placeholder={measurements.unit === 'inches' ? 'e.g. 16' : 'e.g. 41'}
                value={measurements.neck}
                onChange={(e) => handleChange('neck', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Total Height
              </label>
              <input
                type="text"
                placeholder={measurements.unit === 'inches' ? 'e.g. 5 ft 11 in' : 'e.g. 180 cm'}
                value={measurements.height}
                onChange={(e) => handleChange('height', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs text-zinc-400 font-medium block">
              Special Posture / Tailoring Instructions
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Sloping left shoulder, prefers extra room in biceps, high-waisted preference..."
              value={measurements.specialNotes}
              onChange={(e) => handleChange('specialNotes', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Your measurements will be shared confidentially with verified atelier tailors when you commission bespoke garments or request customized sizing.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            id="btn-save-measurements"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Measurements'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
