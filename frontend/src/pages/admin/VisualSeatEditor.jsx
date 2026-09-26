import React, { useState, useEffect } from 'react';
import { requestGraphQL } from '../../utils/graphqlClient';
import { toast } from 'react-toastify';
import { Armchair, Plus, Trash2, Save, Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';
import ErrorMessage from '../../components/ErrorMessage';

const GENERATE_SEAT_LAYOUT_MUTATION = `
  mutation GenerateSeatLayout($input: SeatLayoutInput!) {
    generateSeatLayout(input: $input) {
      id
      seatNumber
      row
      seatType
      price
    }
  }
`;

const VisualSeatEditor = ({ screen, onSaved, onCancel }) => {
  // Default configuration: Rows A to E
  const [rows, setRows] = useState([
    { row: 'A', seatCount: 12, seatType: 'REGULAR', price: 200 },
    { row: 'B', seatCount: 12, seatType: 'REGULAR', price: 200 },
    { row: 'C', seatCount: 10, seatType: 'PREMIUM', price: 300 },
    { row: 'D', seatCount: 10, seatType: 'PREMIUM', price: 300 },
    { row: 'E', seatCount: 8, seatType: 'RECLINER', price: 450 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // If screen already has seats, initialize state from screen.seats
  useEffect(() => {
    if (screen && screen.seats && screen.seats.length > 0) {
      const grouped = screen.seats.reduce((acc, s) => {
        if (!acc[s.row]) {
          acc[s.row] = { row: s.row, seatCount: 0, seatType: s.seatType, price: s.price };
        }
        acc[s.row].seatCount++;
        return acc;
      }, {});

      const sortedRows = Object.values(grouped).sort((a, b) => a.row.localeCompare(b.row));
      setRows(sortedRows);
    }
  }, [screen]);

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = field === 'seatCount' || field === 'price' ? parseFloat(value) || 0 : value;
    setRows(updated);
  };

  const handleAddRow = () => {
    const lastRowChar = rows.length > 0 ? rows[rows.length - 1].row : '@';
    const nextRowChar = String.fromCharCode(lastRowChar.charCodeAt(0) + 1);
    setRows([
      ...rows,
      { row: nextRowChar, seatCount: 10, seatType: 'REGULAR', price: 200 },
    ]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length <= 1) {
      toast.warning('At least one row is required.');
      return;
    }
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  const calculatedTotalSeats = rows.reduce((sum, r) => sum + (parseInt(r.seatCount, 10) || 0), 0);

  const handleSaveLayout = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        screenId: screen.id,
        rows: rows.map((r) => ({
          row: r.row,
          seatCount: parseInt(r.seatCount, 10),
          seatType: r.seatType,
          price: parseFloat(r.price),
        })),
      };

      await requestGraphQL(GENERATE_SEAT_LAYOUT_MUTATION, { input: payload });
      toast.success(`Successfully generated custom layout with ${calculatedTotalSeats} seats!`);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-8 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2 font-bold"
          >
            <ArrowLeft size={14} />
            Back to Screens List
          </button>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Armchair className="text-rose-500" size={24} />
            Visual Seat Layout Editor: {screen.name}
          </h2>
          <p className="text-xs text-slate-400">
            Configure custom row capacities, assign seat types (REGULAR, PREMIUM, RECLINER), and set prices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-slate-950 border border-slate-800 text-amber-400 text-sm font-black rounded-2xl">
            Calculated Capacity: {calculatedTotalSeats} Seats
          </span>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Row Configuration Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Row Configurations</h3>
        <div className="space-y-3">
          {rows.map((rowConfig, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800"
            >
              <div className="w-16">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Row Label</label>
                <input
                  type="text"
                  value={rowConfig.row}
                  onChange={(e) => handleRowChange(idx, 'row', e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-black text-white uppercase text-center focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="w-28">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Seats Count</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={rowConfig.seatCount}
                  onChange={(e) => handleRowChange(idx, 'seatCount', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-extrabold text-white text-center focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Seat Type</label>
                <select
                  value={rowConfig.seatType}
                  onChange={(e) => handleRowChange(idx, 'seatType', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="REGULAR">REGULAR (Standard)</option>
                  <option value="PREMIUM">PREMIUM (VIP)</option>
                  <option value="RECLINER">RECLINER (Luxury)</option>
                </select>
              </div>

              <div className="w-28">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Price (₹)</label>
                <input
                  type="number"
                  step="10"
                  value={rowConfig.price}
                  onChange={(e) => handleRowChange(idx, 'price', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-400 text-center focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={() => handleRemoveRow(idx)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                  title="Remove Row"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddRow}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-2xl transition flex items-center gap-2"
        >
          <Plus size={16} />
          Add Another Row
        </button>
      </div>

      {/* Visual Live Preview */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="text-amber-400" size={16} />
          Live Seating Layout Preview
        </h3>

        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col items-center overflow-x-auto space-y-4">
          <div className="w-full max-w-md h-2.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-t-full shadow-[0_-5px_15px_rgba(225,29,72,0.5)] mb-4" />

          <div className="space-y-2.5 w-full flex flex-col items-center">
            {rows.map((r, rIdx) => (
              <div key={rIdx} className="flex items-center gap-3">
                <span className="w-6 text-right font-black text-xs text-slate-400">{r.row}</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: parseInt(r.seatCount, 10) || 0 }).map((_, sIdx) => (
                    <div
                      key={sIdx}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-extrabold ${
                        r.seatType === 'RECLINER'
                          ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                          : r.seatType === 'PREMIUM'
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                          : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      }`}
                      title={`${r.row}${sIdx + 1} (${r.seatType} - ₹${r.price})`}
                    >
                      {sIdx + 1}
                    </div>
                  ))}
                </div>
                <span className="w-12 text-left text-[10px] font-bold text-slate-500">₹{r.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-2xl text-xs transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveLayout}
          disabled={saving || calculatedTotalSeats === 0}
          className="px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black rounded-2xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Generating Layout...' : 'GENERATE SEAT LAYOUT'}
        </button>
      </div>
    </div>
  );
};

export default VisualSeatEditor;
