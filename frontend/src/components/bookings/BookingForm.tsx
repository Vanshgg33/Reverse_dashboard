'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CollectionType, COLLECTION_TYPE_LABELS, type CreateBookingPayload } from '@/types';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  StickyNote,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

type FormState = {
  customerName: string;
  phoneNumber: string;
  email: string;
  streetAddress: string;
  pincode: string;
  city: string;
  state: string;
  collectionType: CollectionType | '';
  estimatedPackageCount: string;
  preferredCollectionDate: string;
  notes: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  customerName: '',
  phoneNumber: '',
  email: '',
  streetAddress: '',
  pincode: '',
  city: '',
  state: '',
  collectionType: '',
  estimatedPackageCount: '',
  preferredCollectionDate: '',
  notes: '',
};

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.customerName.trim() || f.customerName.trim().length < 2)
    e.customerName = 'Name must be at least 2 characters';
  if (!/^[+\d\s\-()]{7,20}$/.test(f.phoneNumber))
    e.phoneNumber = 'Enter a valid phone number';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = 'Enter a valid email address';
  if (!f.streetAddress.trim() || f.streetAddress.trim().length < 5)
    e.streetAddress = 'Enter a valid street / house address';
  if (!/^\d{6}$/.test(f.pincode))
    e.pincode = 'Enter a valid 6-digit PIN code';
  if (!f.city.trim())
    e.city = 'City is required';
  if (!f.state.trim())
    e.state = 'State is required';
  if (!f.collectionType) e.collectionType = 'Select a collection type';
  const count = parseInt(f.estimatedPackageCount, 10);
  if (isNaN(count) || count < 1 || count > 10000)
    e.estimatedPackageCount = 'Enter a number between 1 and 10,000';
  if (!f.preferredCollectionDate)
    e.preferredCollectionDate = 'Select a preferred date';
  return e;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: keyof FormState;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  touched: Set<keyof FormState>;
  errors: Errors;
  form: FormState;
}

function Field({
  label,
  name,
  required = true,
  hint,
  children,
  touched,
  errors,
  form,
}: FieldProps) {
  const hasError = touched.has(name) && errors[name];
  const isValid = touched.has(name) && !errors[name] && form[name] !== '';
  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {!required && (
          <span className="text-slate-400 font-normal ml-1.5 text-xs">(optional)</span>
        )}
      </label>
      <div className="relative">
        {children}
        {isValid && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
        )}
      </div>
      {hint && !hasError && (
        <p className="text-xs text-slate-400 mt-1.5">{hint}</p>
      )}
      {hasError && (
        <p className="form-error">
          <AlertTriangle className="w-3 h-3" />
          {errors[name]}
        </p>
      )}
    </div>
  );
}

export function BookingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<keyof FormState>>(new Set());
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Keep a synchronously-updated mirror of form state so blur handlers
  // always read the latest values even under React 18 auto-batching.
  const formRef = useRef<FormState>(INITIAL);

  const packageCount = parseInt(form.estimatedPackageCount, 10);
  const willBeHighPriority = !isNaN(packageCount) && packageCount > 100;

  // Auto-fetch city and state when pincode reaches 6 digits
  useEffect(() => {
    const pin = form.pincode.trim();
    if (!/^\d{6}$/.test(pin)) return;

    let cancelled = false;
    setPincodeLoading(true);

    fetch(`https://api.postalpincode.in/pincode/${pin}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const result = data?.[0];
        if (result?.Status === 'Success' && result.PostOffice?.length > 0) {
          const po = result.PostOffice[0];
          const city = po.District || po.Division || po.Block || '';
          const state = po.State || '';
          const next = { ...formRef.current, city, state };
          formRef.current = next;
          setForm(next);
          // Re-validate city/state if already touched
          setErrors((e) => {
            const updated = { ...e };
            if (city) delete updated.city;
            if (state) delete updated.state;
            return updated;
          });
        } else {
          toast.error('PIN code not found. Please enter city and state manually.');
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not fetch location. Please fill city and state manually.');
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false);
      });

    return () => { cancelled = true; };
  }, [form.pincode]);

  const mutation = useMutation({
    mutationFn: async (payload: CreateBookingPayload) => await api.bookings.create(payload),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Booking created successfully!');
      router.push(`/bookings/${booking.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create booking');
    },
  });

  function set(field: keyof FormState, value: string) {
    const next = { ...formRef.current, [field]: value };
    formRef.current = next;
    setForm(next);
    if (touched.has(field)) {
      const errs = validate(next);
      setErrors((e) => ({ ...e, [field]: errs[field] }));
    }
  }

  function blur(field: keyof FormState) {
    setTouched((t) => new Set(t).add(field));
    const errs = validate(formRef.current);
    setErrors((e) => ({ ...e, [field]: errs[field] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allFields = Object.keys(INITIAL) as (keyof FormState)[];
    setTouched(new Set(allFields));
    const errs = validate(formRef.current);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const { streetAddress, pincode, city, state } = formRef.current;
    const composedAddress = `${streetAddress.trim()}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`;

    mutation.mutate({
      customerName: formRef.current.customerName.trim(),
      phoneNumber: formRef.current.phoneNumber.trim(),
      email: formRef.current.email.trim(),
      address: composedAddress,
      collectionType: formRef.current.collectionType as CollectionType,
      estimatedPackageCount: parseInt(formRef.current.estimatedPackageCount, 10),
      preferredCollectionDate: formRef.current.preferredCollectionDate,
      notes: formRef.current.notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Customer info */}
      <div className="card p-6">
        <SectionHeader
          icon={User}
          title="Customer Information"
          subtitle="Contact details for the collection request"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" name="customerName" touched={touched} errors={errors} form={form}>
            <input
              type="text"
              className={`form-input ${touched.has('customerName') && !errors.customerName && form.customerName ? 'pr-9' : ''}`}
              placeholder="Priya Sharma"
              value={form.customerName}
              onChange={(e) => set('customerName', e.target.value)}
              onBlur={() => blur('customerName')}
            />
          </Field>

          <Field label="Phone Number" name="phoneNumber" touched={touched} errors={errors} form={form}>
            <input
              type="tel"
              className={`form-input ${touched.has('phoneNumber') && !errors.phoneNumber && form.phoneNumber ? 'pr-9' : ''}`}
              placeholder="+91 98765 43210"
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value)}
              onBlur={() => blur('phoneNumber')}
            />
          </Field>

          <Field label="Email Address" name="email" touched={touched} errors={errors} form={form}>
            <input
              type="email"
              className={`form-input ${touched.has('email') && !errors.email && form.email ? 'pr-9' : ''}`}
              placeholder="priya@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              onBlur={() => blur('email')}
            />
          </Field>
        </div>

        {/* Address fields */}
        <div className="mt-4 space-y-4">
          <Field
            label="Street / House Address"
            name="streetAddress"
            hint="House no., building name, street, locality"
            touched={touched}
            errors={errors}
            form={form}
          >
            <input
              type="text"
              className={`form-input ${touched.has('streetAddress') && !errors.streetAddress && form.streetAddress ? 'pr-9' : ''}`}
              placeholder="42, Green Park Main Road"
              value={form.streetAddress}
              onChange={(e) => set('streetAddress', e.target.value)}
              onBlur={() => blur('streetAddress')}
            />
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="PIN Code" name="pincode" touched={touched} errors={errors} form={form}>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`form-input pr-9 ${touched.has('pincode') && errors.pincode ? 'border-red-300' : ''}`}
                  placeholder="110016"
                  value={form.pincode}
                  onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={() => blur('pincode')}
                />
                {pincodeLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin pointer-events-none" />
                )}
                {!pincodeLoading && touched.has('pincode') && !errors.pincode && form.pincode && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                )}
              </div>
              {/* PIN field renders its own icons so Field's icon is hidden via pr-9 overlap — no duplicate needed */}
            </Field>

            <Field label="City / District" name="city" touched={touched} errors={errors} form={form}>
              <input
                type="text"
                className={`form-input ${touched.has('city') && !errors.city && form.city ? 'pr-9' : ''}`}
                placeholder="New Delhi"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                onBlur={() => blur('city')}
              />
            </Field>

            <Field label="State" name="state" touched={touched} errors={errors} form={form}>
              <input
                type="text"
                className={`form-input ${touched.has('state') && !errors.state && form.state ? 'pr-9' : ''}`}
                placeholder="Delhi"
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
                onBlur={() => blur('state')}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Collection details */}
      <div className="card p-6">
        <SectionHeader
          icon={Package}
          title="Collection Details"
          subtitle="Specify what needs to be collected and when"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Collection Type" name="collectionType" touched={touched} errors={errors} form={form}>
            <select
              className="form-input"
              value={form.collectionType}
              onChange={(e) => set('collectionType', e.target.value)}
              onBlur={() => blur('collectionType')}
            >
              <option value="">Select type…</option>
              {Object.values(CollectionType).map((t) => (
                <option key={t} value={t}>
                  {COLLECTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Estimated Package Count"
            name="estimatedPackageCount"
            hint="Bookings over 100 packages are marked high priority"
            touched={touched}
            errors={errors}
            form={form}
          >
            <input
              type="number"
              min={1}
              max={10000}
              className={`form-input ${touched.has('estimatedPackageCount') && !errors.estimatedPackageCount && form.estimatedPackageCount ? 'pr-9' : ''}`}
              placeholder="25"
              value={form.estimatedPackageCount}
              onChange={(e) => set('estimatedPackageCount', e.target.value)}
              onBlur={() => blur('estimatedPackageCount')}
            />
          </Field>

          <Field
            label="Preferred Collection Date"
            name="preferredCollectionDate"
            touched={touched}
            errors={errors}
            form={form}
          >
            <input
              type="date"
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              value={form.preferredCollectionDate}
              onChange={(e) => set('preferredCollectionDate', e.target.value)}
              onBlur={() => blur('preferredCollectionDate')}
            />
          </Field>
        </div>

        {willBeHighPriority && (
          <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700">High Priority Booking</p>
              <p className="text-xs text-amber-600 mt-0.5">
                With {packageCount} packages, this booking will be automatically flagged as{' '}
                <strong>high priority</strong> and require immediate agent assignment.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Field label="Notes" name="notes" required={false} touched={touched} errors={errors} form={form}>
            <textarea
              rows={3}
              className="form-input resize-none"
              placeholder="Any special instructions, access codes, or handling requirements…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end pt-1">
        <button type="button" onClick={() => router.push('/')} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[140px]">
          {mutation.isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating…
            </>
          ) : (
            'Create Booking'
          )}
        </button>
      </div>
    </form>
  );
}
