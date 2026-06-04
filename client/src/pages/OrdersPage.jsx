import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  PackageCheck,
  Save,
  RefreshCw,
  User,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-amber  bg-amber-light  border-amber/30',  Icon: Clock        },
  priced:    { label: 'Priced',    color: 'text-mint   bg-mint-light   border-mint/30',   Icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', color: 'text-mint   bg-mint-light   border-mint/30',   Icon: PackageCheck },
  completed: { label: 'Completed', color: 'text-muted  bg-faint        border-border',    Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red    bg-red-light    border-red/30',    Icon: XCircle      },
};

const FILTERS = ['all', 'pending', 'priced', 'confirmed', 'completed', 'cancelled'];

function fmt(n) {
  return Number(n || 0).toFixed(2);
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const { label, color, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      {label}
    </span>
  );
}

// ── PricingPanel ──────────────────────────────────────────────────────────────
// Inline panel that shows when "Set Prices" is clicked
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

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const updatePrice = (idx, raw) => {
    // Allow digits, one dot, empty
    if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, unitPrice: raw } : r))
    );
  };

  const total = rows.reduce((sum, r) => {
    const price = parseFloat(r.unitPrice) || 0;
    const qty = Number(r.quantity) || 1;
    return sum + price * qty;
  }, 0);

  const handleSave = async () => {
    const anyEmpty = rows.some((r) => r.unitPrice === '' || r.unitPrice === '.');
    if (anyEmpty) {
      toast.error('Please enter a price for every medicine.');
      return;
    }
    setSaving(true);
    try {
      await onSave(
        rows.map((r) => ({ ...r, unitPrice: parseFloat(r.unitPrice) || 0 })),
        notes
      );
    } finally {
      setSaving(false);
    }
  };

  // Jump to next price input on Enter
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = document.querySelectorAll(`[data-price-input="${order._id}"]`);
      if (idx + 1 < inputs.length) inputs[idx + 1].focus();
    }
  };

  if (!rows.length) {
    return (
      <div className="mt-4 p-4 rounded-card bg-faint border border-border text-center text-muted text-sm">
        No medicine items on this order.
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-4">
      <p className="text-xs text-muted font-medium uppercase tracking-wide">Set Medicine Prices</p>

      <div className="space-y-2">
        {rows.map((row, idx) => {
          const lineTotal = (parseFloat(row.unitPrice) || 0) * (Number(row.quantity) || 1);
          return (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-card bg-faint border border-border"
            >
              {/* Medicine info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary text-sm truncate">{row.name}</p>
                {(row.strength || row.unit) && (
                  <p className="text-xs text-muted mt-0.5">
                    {[row.strength, row.unit].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-xs text-muted mt-0.5">
                  Qty: <span className="font-semibold text-primary">{row.quantity || 1}</span>
                </p>
              </div>

              {/* Price input */}
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
                  <p className="text-xs text-muted">
                    = <span className="font-semibold text-mint">Rs. {fmt(lineTotal)}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-card bg-mint-light border border-mint/20">
        <span className="text-sm font-semibold text-mint">Order Total</span>
        <span className="text-base font-bold text-mint font-mono">Rs. {fmt(total)}</span>
      </div>

      {/* Pharmacist notes */}
      <div>
        <label className="text-xs text-muted font-medium uppercase tracking-wide block mb-1.5">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Availability note, substitution info, pickup time…"
          className="w-full px-3 py-2 rounded-btn border border-border bg-faint text-sm text-primary placeholder:text-muted resize-none focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint/30 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn bg-mint text-white font-semibold text-sm hover:bg-mint/90 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2} />
          ) : (
            <Save className="w-4 h-4" strokeWidth={2} />
          )}
          {saving ? 'Saving…' : 'Save Prices'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2.5 rounded-btn border border-border text-muted text-sm font-medium hover:bg-faint transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── OrderCard ─────────────────────────────────────────────────────────────────
function OrderCard({ order, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [pricing, setPricing] = useState(false);

  const hasPrices = order.totalAmount > 0;
  const medicineCount = (order.medicines || []).length;

  const patientLabel =
    order.patientName ||
    order.patientEmail ||
    order.patientPhone ||
    (order.patientId ? `Patient #${String(order.patientId).slice(-6)}` : 'Unknown patient');

  const handleSavePrices = async (medicines, pharmacistNotes) => {
    try {
      const { data } = await axios.put(`/api/orders/${order._id}/price`, {
        medicines,
        pharmacistNotes,
      });
      toast.success('Prices saved successfully!');
      setPricing(false);
      setExpanded(false);
      onUpdated(data.order);
    } catch {
      toast.error('Failed to save prices. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-card border border-border shadow-card transition-shadow hover:shadow-md">
      {/* Card header — always visible */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={order.status} />
              <span className="text-xs text-muted">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>

            {/* Patient info row */}
            <div className="mt-2 flex items-center gap-1.5 text-sm text-primary font-semibold">
              <User className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
              <span className="truncate">{patientLabel}</span>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              {order.patientPhone && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Phone className="w-3 h-3" strokeWidth={1.5} /> {order.patientPhone}
                </span>
              )}
              {order.patientEmail && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Mail className="w-3 h-3" strokeWidth={1.5} /> {order.patientEmail}
                </span>
              )}
            </div>
          </div>

          {/* Total / item count */}
          <div className="text-right shrink-0">
            {hasPrices ? (
              <>
                <p className="text-lg font-bold text-primary font-mono">
                  Rs. {fmt(order.totalAmount)}
                </p>
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
        <div className="mt-4 flex gap-2 flex-wrap">
          {order.status === 'pending' || order.status === 'priced' ? (
            <button
              onClick={() => { setPricing(true); setExpanded(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors"
            >
              <Save className="w-3.5 h-3.5" strokeWidth={2} />
              {hasPrices ? 'Update Prices' : 'Set Prices'}
            </button>
          ) : null}

          <button
            onClick={() => { setExpanded((v) => !v); if (pricing) setPricing(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-border text-muted text-xs font-medium hover:bg-faint transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="w-3.5 h-3.5" strokeWidth={2} /> Hide details</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" strokeWidth={2} /> View details</>
            )}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5">
          {pricing ? (
            <PricingPanel
              order={order}
              onSave={handleSavePrices}
              onCancel={() => { setPricing(false); setExpanded(false); }}
            />
          ) : (
            <div className="border-t border-border pt-4 space-y-3">
              {/* Medicine list (read-only) */}
              {(order.medicines || []).length === 0 ? (
                <p className="text-sm text-muted">No medicine items recorded.</p>
              ) : (
                <div className="space-y-2">
                  {(order.medicines || []).map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-primary">{m.name}</p>
                        {(m.strength || m.unit) && (
                          <p className="text-xs text-muted">{[m.strength, m.unit].filter(Boolean).join(' · ')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted">Qty: <span className="font-semibold text-primary">{m.quantity || 1}</span></p>
                        {m.unitPrice > 0 && (
                          <p className="text-xs text-muted">
                            Rs. {fmt(m.unitPrice)} × {m.quantity || 1} ={' '}
                            <span className="font-semibold text-mint">Rs. {fmt(m.totalPrice)}</span>
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

              {/* Priced timestamp */}
              {order.pricedAt && (
                <p className="text-xs text-muted">
                  Priced on {new Date(order.pricedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── OrdersPage ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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

  useEffect(() => {
    fetchOrders(filter, page);
  }, [filter, page, fetchOrders]);

  const handleFilterChange = (f) => {
    setFilter(f);
    setPage(1);
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
  };

  // summary counts
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-primary">Orders</h2>
          <p className="text-sm text-muted mt-0.5">
            {total} order{total !== 1 ? 's' : ''} total
            {pendingCount > 0 && (
              <span className="ml-2 text-amber font-semibold">
                · {pendingCount} awaiting price
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchOrders(filter, page)}
          className="flex items-center gap-2 px-4 py-2 rounded-btn border border-border text-muted text-sm hover:bg-faint transition-colors"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`shrink-0 px-3 py-1.5 rounded-btn text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-navy text-white'
                : 'border border-border text-muted hover:bg-faint'
            }`}
          >
            {f === 'all' ? 'All Orders' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-faint rounded-card border border-border animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-12 h-12 text-muted mb-4" strokeWidth={1} />
          <p className="text-lg font-semibold text-primary">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </p>
          <p className="text-sm text-muted mt-1">
            {filter === 'all'
              ? 'Orders placed by patients will appear here.'
              : 'Try a different filter.'}
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
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-btn border border-border text-sm text-muted hover:bg-faint disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted px-2">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-btn border border-border text-sm text-muted hover:bg-faint disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
