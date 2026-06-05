import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  XCircle,
  PackageCheck,
  Save,
  RefreshCw,
  User,
  Phone,
  Mail,
  FileText,
  Truck,
  MapPin,
  Hash,
  Timer,
  CalendarClock,
  CircleDot,
  BadgeCheck,
} from 'lucide-react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

// ─── constants ────────────────────────────────────────────────────────────────

const ORDER_STATUS = {
  pending:   { label: 'Pending',   color: 'text-amber bg-amber-light border-amber/30',   Icon: Clock        },
  priced:    { label: 'Priced',    color: 'text-mint  bg-mint-light  border-mint/30',    Icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', color: 'text-mint  bg-mint-light  border-mint/30',    Icon: PackageCheck },
  completed: { label: 'Completed', color: 'text-muted bg-faint       border-border',     Icon: BadgeCheck   },
  cancelled: { label: 'Cancelled', color: 'text-red   bg-red-light   border-red/30',     Icon: XCircle      },
};

const DELIVERY_STATUS = {
  '':          { label: 'Not set',    color: 'text-muted  bg-faint      border-border'    },
  preparing:   { label: 'Preparing',  color: 'text-amber  bg-amber-light border-amber/30' },
  dispatched:  { label: 'Dispatched', color: 'text-navy   bg-navy/10    border-navy/20'   },
  on_the_way:  { label: 'On the Way', color: 'text-mint   bg-mint-light  border-mint/30'  },
  delivered:   { label: 'Delivered',  color: 'text-mint   bg-mint-light  border-mint/30'  },
  failed:      { label: 'Failed',     color: 'text-red    bg-red-light   border-red/30'   },
};

const DELIVERY_STEPS = ['preparing', 'dispatched', 'on_the_way', 'delivered'];

const PARTNERS = [
  { value: 'pathao',   label: 'Pathao'   },
  { value: 'yango',    label: 'Yango'    },
  { value: 'indrive',  label: 'InDrive'  },
  { value: 'walk_in',  label: 'Walk-in'  },
  { value: 'others',   label: 'Others'   },
];

const FILTERS = ['all', 'pending', 'priced', 'confirmed', 'completed', 'cancelled'];

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n || 0).toFixed(2);
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function toDatetimeLocal(d) {
  if (!d) return '';
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = ORDER_STATUS[status] || ORDER_STATUS.pending;
  const { label, color, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      {label}
    </span>
  );
}

function DeliveryBadge({ status }) {
  if (!status) return null;
  const cfg = DELIVERY_STATUS[status] || DELIVERY_STATUS[''];
  if (!cfg.label || cfg.label === 'Not set') return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Truck className="w-3.5 h-3.5" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs text-muted font-medium uppercase tracking-wide mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-btn border border-border bg-white text-sm text-primary placeholder:text-muted ' +
  'focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint/30 transition-all';

// ─── PricingPanel ─────────────────────────────────────────────────────────────

function PricingPanel({ order, onSave, onCancel }) {
  const [rows, setRows] = useState(() =>
    (order.medicines || []).map((m) => ({
      ...m,
      unitPrice: m.unitPrice != null ? String(m.unitPrice) : '',
    }))
  );
  const [notes, setNotes] = useState(order.pharmacistNotes || '');
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const updatePrice = (idx, raw) => {
    if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, unitPrice: raw } : r));
  };

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.unitPrice) || 0) * (Number(r.quantity) || 1), 0);

  const handleSave = async () => {
    if (rows.some((r) => r.unitPrice === '' || r.unitPrice === '.')) {
      toast.error('Please enter a price for every medicine.');
      return;
    }
    setSaving(true);
    try {
      await onSave(rows.map((r) => ({ ...r, unitPrice: parseFloat(r.unitPrice) || 0 })), notes);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = document.querySelectorAll(`[data-price-input="${order._id}"]`);
      if (idx + 1 < inputs.length) inputs[idx + 1].focus();
    }
  };

  if (!rows.length) {
    return <div className="mt-4 p-4 rounded-card bg-faint border border-border text-center text-muted text-sm">No medicine items on this order.</div>;
  }

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-4">
      <p className="text-xs text-muted font-medium uppercase tracking-wide">Set Medicine Prices</p>

      <div className="space-y-2">
        {rows.map((row, idx) => {
          const lineTotal = (parseFloat(row.unitPrice) || 0) * (Number(row.quantity) || 1);
          return (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-card bg-faint border border-border">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary text-sm truncate">{row.name}</p>
                {((row.strength && row.strength !== '0') || row.unit) && (
                  <p className="text-xs text-muted mt-0.5">
                    {[row.strength !== '0' ? row.strength : null, row.unit].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-xs text-muted mt-0.5">
                  Qty: <span className="font-semibold text-primary">{row.quantity || 1}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center border border-border rounded-btn bg-white focus-within:border-mint focus-within:ring-1 focus-within:ring-mint/30 transition-all">
                  <span className="pl-3 pr-1 text-muted text-sm font-medium select-none">Rs.</span>
                  <input
                    ref={idx === 0 ? firstRef : null}
                    data-price-input={order._id}
                    type="text"
                    inputMode="decimal"
                    value={row.unitPrice}
                    onChange={(e) => updatePrice(idx, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    placeholder="0.00"
                    className="w-24 py-2 pr-3 bg-transparent outline-none text-sm text-right font-mono text-primary"
                  />
                </div>
                {lineTotal > 0 && (
                  <p className="text-xs text-muted">= <span className="font-semibold text-mint">Rs. {fmt(lineTotal)}</span></p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 rounded-card bg-mint-light border border-mint/20">
        <span className="text-sm font-semibold text-mint">Order Total</span>
        <span className="text-base font-bold text-mint font-mono">Rs. {fmt(total)}</span>
      </div>

      <div>
        <label className="text-xs text-muted font-medium uppercase tracking-wide block mb-1.5">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Availability note, substitution info…"
          className={inputCls + ' resize-none'}
        />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn bg-mint text-white font-semibold text-sm hover:bg-mint/90 transition-colors disabled:opacity-60">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Save className="w-4 h-4" strokeWidth={2} />}
          {saving ? 'Saving…' : 'Save Prices'}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="px-4 py-2.5 rounded-btn border border-border text-muted text-sm font-medium hover:bg-faint transition-colors disabled:opacity-60">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── DeliveryPanel ────────────────────────────────────────────────────────────

function DeliveryPanel({ order, onSave, onCancel }) {
  const d = order.delivery || {};

  const [partner, setPartner]           = useState(d.partner || '');
  const [partnerLabel, setPartnerLabel] = useState(d.partnerLabel || '');
  const [trackingId, setTrackingId]     = useState(d.trackingId || '');
  const [riderName, setRiderName]       = useState(d.riderName || '');
  const [riderPhone, setRiderPhone]     = useState(d.riderPhone || '');
  const [fee, setFee]                   = useState(d.fee != null ? String(d.fee) : '');
  const [estimatedTime, setEstimatedTime] = useState(d.estimatedTime || '');
  const [scheduledAt, setScheduledAt]   = useState(toDatetimeLocal(d.scheduledAt));
  const [deliveryStatus, setDeliveryStatus] = useState(d.status || '');
  const [notes, setNotes]               = useState(d.notes || '');
  const [saving, setSaving]             = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        partner, partnerLabel, trackingId, riderName, riderPhone,
        fee: parseFloat(fee) || 0,
        estimatedTime, scheduledAt: scheduledAt || null,
        deliveryStatus, notes,
      });
    } finally {
      setSaving(false);
    }
  };

  // quick numeric-only fee input
  const handleFeeChange = (v) => {
    if (v === '' || /^\d*\.?\d*$/.test(v)) setFee(v);
  };

  const hasDeliveryAddress = order.deliveryAddress || order.contactPhone || order.contactEmail;

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-5">

      {/* Patient delivery context — read-only */}
      {hasDeliveryAddress && (
        <div className="p-3 rounded-card bg-navy/5 border border-navy/10 space-y-1.5">
          <p className="text-xs text-muted font-medium uppercase tracking-wide mb-2">Delivering to</p>
          {order.deliveryAddress && (
            <div className="flex items-start gap-2 text-sm text-primary">
              <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{order.deliveryAddress}</span>
            </div>
          )}
          {order.contactPhone && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Phone className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <a href={`tel:${order.contactPhone}`} className="hover:text-primary transition-colors">{order.contactPhone}</a>
            </div>
          )}
          {order.contactEmail && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Mail className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>{order.contactEmail}</span>
            </div>
          )}
          {order.notes && (
            <div className="flex items-start gap-2 text-sm text-muted mt-1 pt-1.5 border-t border-navy/10">
              <FileText className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span className="italic">"{order.notes}"</span>
            </div>
          )}
        </div>
      )}

      {/* Delivery partner */}
      <div>
        <p className="text-xs text-muted font-medium uppercase tracking-wide mb-2">Delivery Partner</p>
        <div className="flex flex-wrap gap-2">
          {PARTNERS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPartner(p.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                partner === p.value
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-muted border-border hover:border-navy/40 hover:text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {partner === 'others' && (
          <input
            type="text"
            value={partnerLabel}
            onChange={(e) => setPartnerLabel(e.target.value)}
            placeholder="Enter delivery service name"
            className={inputCls + ' mt-2'}
            autoFocus
          />
        )}
      </div>

      {/* Rider / logistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Rider Name" icon={User}>
          <input type="text" value={riderName} onChange={(e) => setRiderName(e.target.value)}
            placeholder="e.g. Ram Bahadur" className={inputCls} />
        </Field>
        <Field label="Rider Phone" icon={Phone}>
          <input type="tel" value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)}
            placeholder="98XXXXXXXX" className={inputCls} />
        </Field>
        <Field label="Tracking ID" icon={Hash} >
          <input type="text" value={trackingId} onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Service tracking number" className={`${inputCls} sm:col-span-2`} />
        </Field>
      </div>

      {/* Timing & fee */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Delivery Fee" icon={null}>
          <div className="flex items-center border border-border rounded-btn bg-white focus-within:border-mint focus-within:ring-1 focus-within:ring-mint/30 transition-all">
            <span className="pl-3 pr-1 text-muted text-sm font-medium select-none">Rs.</span>
            <input
              type="text"
              inputMode="decimal"
              value={fee}
              onChange={(e) => handleFeeChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="flex-1 py-2 pr-3 bg-transparent outline-none text-sm font-mono text-primary"
            />
          </div>
        </Field>
        <Field label="ETA" icon={Timer}>
          <input type="text" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)}
            placeholder="e.g. 20-30 min" className={inputCls} />
        </Field>
        <Field label="Scheduled At" icon={CalendarClock}>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            className={inputCls} />
        </Field>
      </div>

      {/* Delivery status */}
      <div>
        <p className="text-xs text-muted font-medium uppercase tracking-wide mb-2">Delivery Status</p>

        {/* Step flow */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {DELIVERY_STEPS.map((step, i) => {
            const isActive = deliveryStatus === step;
            const cfg = DELIVERY_STATUS[step];
            const isPast = DELIVERY_STEPS.indexOf(deliveryStatus) > i;
            return (
              <div key={step} className="flex items-center gap-1">
                <button
                  onClick={() => setDeliveryStatus(step)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isActive
                      ? `${cfg.color} font-bold shadow-sm`
                      : isPast
                        ? 'text-mint bg-mint-light border-mint/30'
                        : 'text-muted bg-white border-border hover:border-navy/30'
                  }`}
                >
                  {isPast && !isActive && <span className="mr-1">✓</span>}
                  {cfg.label}
                </button>
                {i < DELIVERY_STEPS.length - 1 && (
                  <span className={`text-xs ${isPast ? 'text-mint' : 'text-border'}`}>→</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Failed button (outside flow) */}
        <button
          onClick={() => setDeliveryStatus(deliveryStatus === 'failed' ? '' : 'failed')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            deliveryStatus === 'failed'
              ? 'text-red bg-red-light border-red/30'
              : 'text-muted bg-white border-border hover:border-red/30 hover:text-red'
          }`}
        >
          {deliveryStatus === 'failed' ? '✕ Failed (tap to clear)' : '✕ Mark as Failed'}
        </button>
      </div>

      {/* Internal delivery notes */}
      <Field label="Internal Notes" icon={FileText}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Rider instructions, building info, gate code…"
          className={inputCls + ' resize-none'}
        />
      </Field>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn bg-navy text-white font-semibold text-sm hover:bg-navy/90 transition-colors disabled:opacity-60">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Truck className="w-4 h-4" strokeWidth={2} />}
          {saving ? 'Saving…' : 'Save Delivery Info'}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="px-4 py-2.5 rounded-btn border border-border text-muted text-sm font-medium hover:bg-faint transition-colors disabled:opacity-60">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── DeliveryInfo (read-only) ─────────────────────────────────────────────────

function DeliveryInfo({ delivery }) {
  if (!delivery || !delivery.partner) return null;
  const partnerLabel = delivery.partner === 'others'
    ? (delivery.partnerLabel || 'Others')
    : PARTNERS.find((p) => p.value === delivery.partner)?.label || delivery.partner;

  return (
    <div className="mt-3 p-3 rounded-card bg-faint border border-border space-y-2">
      <p className="text-xs text-muted font-medium uppercase tracking-wide">Delivery Details</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <span className="text-muted">Partner</span>
        <span className="font-semibold text-primary">{partnerLabel}</span>
        {delivery.riderName && <><span className="text-muted">Rider</span><span className="font-semibold text-primary">{delivery.riderName}</span></>}
        {delivery.riderPhone && <><span className="text-muted">Rider Phone</span><a href={`tel:${delivery.riderPhone}`} className="font-semibold text-mint hover:underline">{delivery.riderPhone}</a></>}
        {delivery.trackingId && <><span className="text-muted">Tracking ID</span><span className="font-mono text-primary">{delivery.trackingId}</span></>}
        {delivery.fee > 0 && <><span className="text-muted">Delivery Fee</span><span className="font-semibold text-primary">Rs. {fmt(delivery.fee)}</span></>}
        {delivery.estimatedTime && <><span className="text-muted">ETA</span><span className="text-primary">{delivery.estimatedTime}</span></>}
        {delivery.scheduledAt && <><span className="text-muted">Scheduled</span><span className="text-primary">{fmtDateTime(delivery.scheduledAt)}</span></>}
        {delivery.deliveredAt && <><span className="text-muted">Delivered at</span><span className="text-primary">{fmtDateTime(delivery.deliveredAt)}</span></>}
      </div>
      {delivery.notes && (
        <div className="flex gap-2 pt-1.5 border-t border-border text-sm text-muted">
          <FileText className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
          <span>{delivery.notes}</span>
        </div>
      )}
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order, onUpdated }) {
  // activePanel: null | 'pricing' | 'delivery' | 'details'
  const [activePanel, setActivePanel] = useState(null);

  const hasPrices    = order.totalAmount > 0;
  const hasDelivery  = !!(order.delivery?.partner);
  const medicineCount = (order.medicines || []).length;
  const isCancelled  = order.status === 'cancelled';

  const patientLabel =
    order.patientName ||
    order.contactPhone ||
    order.patientEmail ||
    (order.patientId ? `Patient #${String(order.patientId).slice(-6)}` : 'Unknown patient');

  const toggle = (panel) => setActivePanel((cur) => (cur === panel ? null : panel));

  const handleSavePrices = async (medicines, pharmacistNotes) => {
    const { data } = await axios.put(`/api/orders/${order._id}/price`, { medicines, pharmacistNotes });
    toast.success('Prices saved.');
    setActivePanel(null);
    onUpdated(data.order);
  };

  const handleSaveDelivery = async (payload) => {
    const { data } = await axios.put(`/api/orders/${order._id}/delivery`, payload);
    toast.success('Delivery info saved.');
    setActivePanel(null);
    onUpdated(data.order);
  };

  return (
    <div className="bg-white rounded-card border border-border transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Status row */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={order.status} />
              <DeliveryBadge status={order.delivery?.status} />
              {order.orderId && (
                <span className="text-xs font-mono text-muted bg-faint px-1.5 py-0.5 rounded border border-border">
                  {order.orderId}
                </span>
              )}
              <span className="text-xs text-muted">{fmtDate(order.orderDate || order.createdAt)}</span>
            </div>

            {/* Patient */}
            <div className="mt-2 flex items-center gap-1.5 text-sm text-primary font-semibold">
              <User className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
              <span className="truncate">{patientLabel}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              {order.contactPhone && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Phone className="w-3 h-3" strokeWidth={1.5} /> {order.contactPhone}
                </span>
              )}
              {order.contactEmail && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Mail className="w-3 h-3" strokeWidth={1.5} /> {order.contactEmail}
                </span>
              )}
              {order.deliveryAddress && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <MapPin className="w-3 h-3" strokeWidth={1.5} />
                  <span className="truncate max-w-[180px]">{order.deliveryAddress}</span>
                </span>
              )}
            </div>

            {/* Delivery partner quick info */}
            {hasDelivery && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>
                  {PARTNERS.find((p) => p.value === order.delivery.partner)?.label ||
                    order.delivery.partnerLabel || 'Others'}
                  {order.delivery.riderName && ` · ${order.delivery.riderName}`}
                  {order.delivery.estimatedTime && ` · ETA ${order.delivery.estimatedTime}`}
                </span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            {hasPrices ? (
              <>
                <p className="text-lg font-bold text-primary font-mono">Rs. {fmt(order.totalAmount)}</p>
                <p className="text-xs text-muted">{medicineCount} item{medicineCount !== 1 ? 's' : ''}</p>
              </>
            ) : (
              <p className="text-xs text-amber font-semibold bg-amber-light border border-amber/20 px-2 py-1 rounded-full">
                {medicineCount} item{medicineCount !== 1 ? 's' : ''} · Price needed
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!isCancelled && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {(order.status === 'pending' || order.status === 'priced') && (
              <button
                onClick={() => toggle('pricing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold transition-colors ${
                  activePanel === 'pricing'
                    ? 'bg-mint text-white'
                    : 'bg-navy text-white hover:bg-navy/90'
                }`}
              >
                <Save className="w-3.5 h-3.5" strokeWidth={2} />
                {hasPrices ? 'Update Prices' : 'Set Prices'}
              </button>
            )}

            <button
              onClick={() => toggle('delivery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn border text-xs font-semibold transition-colors ${
                activePanel === 'delivery'
                  ? 'bg-navy text-white border-navy'
                  : hasDelivery
                    ? 'border-navy/30 text-navy hover:bg-navy/5'
                    : 'border-border text-muted hover:bg-faint'
              }`}
            >
              <Truck className="w-3.5 h-3.5" strokeWidth={2} />
              {hasDelivery ? 'Update Delivery' : 'Manage Delivery'}
            </button>

            <button
              onClick={() => toggle('details')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-border text-muted text-xs font-medium hover:bg-faint transition-colors"
            >
              {activePanel === 'details'
                ? <><ChevronUp className="w-3.5 h-3.5" strokeWidth={2} /> Hide</>
                : <><ChevronDown className="w-3.5 h-3.5" strokeWidth={2} /> Details</>
              }
            </button>
          </div>
        )}

        {/* Cancelled: details only */}
        {isCancelled && (
          <div className="mt-4">
            <button onClick={() => toggle('details')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-border text-muted text-xs font-medium hover:bg-faint transition-colors">
              {activePanel === 'details'
                ? <><ChevronUp className="w-3.5 h-3.5" strokeWidth={2} /> Hide details</>
                : <><ChevronDown className="w-3.5 h-3.5" strokeWidth={2} /> View details</>}
            </button>
          </div>
        )}
      </div>

      {/* Panels */}
      {activePanel && (
        <div className="px-5 pb-5">
          {activePanel === 'pricing' && (
            <PricingPanel
              order={order}
              onSave={handleSavePrices}
              onCancel={() => setActivePanel(null)}
            />
          )}

          {activePanel === 'delivery' && (
            <DeliveryPanel
              order={order}
              onSave={handleSaveDelivery}
              onCancel={() => setActivePanel(null)}
            />
          )}

          {activePanel === 'details' && (
            <div className="border-t border-border pt-4 space-y-3">
              {/* Medicine list */}
              {medicineCount === 0 ? (
                <p className="text-sm text-muted">No medicine items recorded.</p>
              ) : (
                <div className="space-y-2">
                  {(order.medicines || []).map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-primary">{m.name}</p>
                        {((m.strength && m.strength !== '0') || m.unit) && (
                          <p className="text-xs text-muted">
                            {[m.strength !== '0' ? m.strength : null, m.unit].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted">Qty: <span className="font-semibold text-primary">{m.quantity || 1}</span></p>
                        {m.unitPrice > 0 && (
                          <p className="text-xs text-muted">
                            Rs. {fmt(m.unitPrice)} × {m.quantity || 1} = <span className="font-semibold text-mint">Rs. {fmt(m.totalPrice)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pharmacist notes */}
              {order.pharmacistNotes && (
                <div className="flex gap-2 p-3 rounded-card bg-faint border border-border">
                  <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-sm text-muted">{order.pharmacistNotes}</p>
                </div>
              )}

              {/* Delivery info read-only */}
              <DeliveryInfo delivery={order.delivery} />

              {/* Timestamps */}
              <div className="text-xs text-muted space-y-0.5">
                {order.pricedAt && <p>Priced on {fmtDateTime(order.pricedAt)}</p>}
                {order.delivery?.deliveredAt && <p>Delivered on {fmtDateTime(order.delivery.deliveredAt)}</p>}
                {order.cancelledReason && <p className="text-red">Cancellation reason: {order.cancelledReason}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── OrdersPage ───────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);

  const fetchOrders = useCallback(async (activeFilter, activePage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: activePage, limit: 15 });
      if (activeFilter !== 'all') params.set('status', activeFilter);
      const { data } = await axios.get(`/api/orders?${params}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(filter, page); }, [filter, page, fetchOrders]);

  const handleFilterChange = (f) => { setFilter(f); setPage(1); };

  const handleOrderUpdated = (updated) =>
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-primary">Orders</h2>
          <p className="text-sm text-muted mt-0.5">
            {total} order{total !== 1 ? 's' : ''} total
            {pendingCount > 0 && (
              <span className="ml-2 text-amber font-semibold">· {pendingCount} awaiting price</span>
            )}
          </p>
        </div>
        <button onClick={() => fetchOrders(filter, page)}
          className="flex items-center gap-2 px-4 py-2 rounded-btn border border-border text-muted text-sm hover:bg-faint transition-colors">
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => handleFilterChange(f)}
            className={`shrink-0 px-3 py-1.5 rounded-btn text-sm font-medium transition-colors ${
              filter === f ? 'bg-navy text-white' : 'border border-border text-muted hover:bg-faint'
            }`}>
            {f === 'all' ? 'All Orders' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-faint rounded-card border border-border animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-12 h-12 text-muted mb-4" strokeWidth={1} />
          <p className="text-lg font-semibold text-primary">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </p>
          <p className="text-sm text-muted mt-1">
            {filter === 'all' ? 'Orders placed by patients will appear here.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} onUpdated={handleOrderUpdated} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-btn border border-border text-sm text-muted hover:bg-faint disabled:opacity-40 transition-colors">
            Previous
          </button>
          <span className="text-sm text-muted px-2">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-btn border border-border text-sm text-muted hover:bg-faint disabled:opacity-40 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
