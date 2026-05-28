import { useState } from 'react';
import CameraCapture from './CameraCapture';
import { createCustomer, updateCustomer } from '../api';
import { recognizeCard } from '../utils/ocr';

const COUNTRIES = ['Thailand', 'Japan', 'China', 'South Korea', 'United States', 'Singapore', 'Hong Kong'];
const BUSINESS_TYPES = ['Trader', 'Wholeseller/Distributor', 'Supplier', 'Manufacturer', 'Government', 'Retailer', 'Visitor'];

const today = () => new Date().toISOString().slice(0, 10);

export default function CustomerForm({ initial = null, onSuccess }) {
  const [cardPhoto, setCardPhoto] = useState(null);
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);

  const [form, setForm] = useState({
    visit_date: initial?.visit_date?.slice(0, 10) || today(),
    is_visitor: initial?.is_visitor ? 'true' : 'false',
    company_name: initial?.company_name || '',
    contact_name: initial?.contact_name || '',
    position: initial?.position || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    website: initial?.website || '',
    address: initial?.address || '',
    countries: initial?.countries ? (typeof initial.countries === 'string' ? JSON.parse(initial.countries) : initial.countries) : [],
    country_other: initial?.country_other || '',
    business_types: initial?.business_types ? (typeof initial.business_types === 'string' ? JSON.parse(initial.business_types) : initial.business_types) : [],
    business_type_other: initial?.business_type_other || '',
    remark: initial?.remark || '',
    note: initial?.note || '',
    arrange_by: initial?.arrange_by || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleOCR = async () => {
    setOcrLoading(true);
    setOcrDone(false);
    try {
      const fields = await recognizeCard(cardPhoto);
      // Only fill non-null fields returned by the API
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v != null && v !== '')
      );
      setForm(f => ({ ...f, ...updates }));
      setOcrDone(true);
    } catch (err) {
      setError(`OCR: ${err.message}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const toggleCheck = (key, value) => {
    setForm(f => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!initial && !cardPhoto) { setError('กรุณาถ่ายรูปนามบัตรก่อน'); return; }
    setError('');
    setSubmitting(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
      else fd.append(k, v);
    });
    if (cardPhoto) fd.append('card_photo', cardPhoto);
    if (customerPhoto) fd.append('customer_photo', customerPhoto);

    try {
      if (initial) {
        await updateCustomer(initial.id, fd);
      } else {
        await createCustomer(fd);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Photos */}
      <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-800">รูปภาพ</h2>
        <CameraCapture
          label="รูปนามบัตร"
          required
          aspect={1.8}
          onCapture={(f) => { setCardPhoto(f); setOcrDone(false); }}
        />
        {initial?.card_photo && !cardPhoto && (
          <img src={`/uploads/${initial.card_photo}`} className="w-full rounded-lg max-h-40 object-contain bg-gray-50 border" alt="card" />
        )}
        {cardPhoto && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={handleOCR}
              disabled={ocrLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 active:bg-emerald-700"
            >
              {ocrLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  กำลังอ่านนามบัตร...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  อ่านข้อมูลจากนามบัตร (OCR)
                </>
              )}
            </button>
            {ocrDone && (
              <p className="text-emerald-600 text-xs text-center">อ่านข้อมูลสำเร็จ กรุณาตรวจสอบและแก้ไขข้อมูล</p>
            )}
          </div>
        )}
        <CameraCapture
          label="รูปลูกค้า (ไม่บังคับ)"
          onCapture={setCustomerPhoto}
        />
        {initial?.customer_photo && !customerPhoto && (
          <img src={`/uploads/${initial.customer_photo}`} className="w-full rounded-lg max-h-40 object-contain bg-gray-50 border" alt="customer" />
        )}
      </section>

      {/* Date & Visitor */}
      <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-gray-800">ข้อมูลการเยี่ยมชม</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่ <span className="text-red-500">*</span>
          </label>
          <input type="date" value={form.visit_date} onChange={e => set('visit_date', e.target.value)}
            required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_visitor === 'true'}
            onChange={e => set('is_visitor', e.target.checked ? 'true' : 'false')}
            className="w-5 h-5 rounded border-gray-300 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Visitor</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrange by</label>
          <input type="text" value={form.arrange_by} onChange={e => set('arrange_by', e.target.value)}
            placeholder="ชื่อผู้รับผิดชอบ" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base" />
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-gray-800">ข้อมูลติดต่อ (จากนามบัตร)</h2>
        {[
          { key: 'company_name', label: 'บริษัท / ชื่อองค์กร', placeholder: 'Company name' },
          { key: 'contact_name', label: 'ชื่อ-นามสกุล', placeholder: 'Contact person' },
          { key: 'position', label: 'ตำแหน่ง', placeholder: 'Position / Title' },
          { key: 'phone', label: 'โทรศัพท์', placeholder: 'Phone / Tel', type: 'tel' },
          { key: 'email', label: 'Email', placeholder: 'email@example.com', type: 'email' },
          { key: 'website', label: 'Website', placeholder: 'www.example.com' },
          { key: 'address', label: 'ที่อยู่', placeholder: 'Address', multiline: true },
        ].map(({ key, label, placeholder, type = 'text', multiline }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {multiline ? (
              <textarea value={form[key]} onChange={e => set(key, e.target.value)}
                placeholder={placeholder} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base resize-none" />
            ) : (
              <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base" />
            )}
          </div>
        ))}
      </section>

      {/* Country */}
      <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-gray-800">Country</h2>
        <div className="grid grid-cols-2 gap-2">
          {COUNTRIES.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.countries.includes(c)}
                onChange={() => toggleCheck('countries', c)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">{c}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer col-span-2">
            <input type="checkbox" checked={!!form.country_other}
              onChange={e => { if (!e.target.checked) set('country_other', ''); }}
              className="w-5 h-5 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Other:</span>
            <input type="text" value={form.country_other} onChange={e => set('country_other', e.target.value)}
              placeholder="ระบุประเทศ" className="flex-1 border-b border-gray-300 px-1 text-sm" />
          </label>
        </div>
      </section>

      {/* Business Type */}
      <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-gray-800">Business Type</h2>
        <div className="grid grid-cols-2 gap-2">
          {BUSINESS_TYPES.map(bt => (
            <label key={bt} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.business_types.includes(bt)}
                onChange={() => toggleCheck('business_types', bt)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">{bt}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer col-span-2">
            <input type="checkbox" checked={!!form.business_type_other}
              onChange={e => { if (!e.target.checked) set('business_type_other', ''); }}
              className="w-5 h-5 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Other:</span>
            <input type="text" value={form.business_type_other} onChange={e => set('business_type_other', e.target.value)}
              placeholder="ระบุประเภท" className="flex-1 border-b border-gray-300 px-1 text-sm" />
          </label>
        </div>
      </section>

      {/* Remark & Note */}
      <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-gray-800">หมายเหตุ</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remark / Special Requirement</label>
          <textarea value={form.remark} onChange={e => set('remark', e.target.value)}
            rows={3} placeholder="ความต้องการพิเศษ, สินค้าที่สนใจ..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)}
            rows={2} placeholder="Note เพิ่มเติม..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base resize-none" />
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>
      )}

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base disabled:opacity-60 active:bg-blue-700">
          {submitting ? 'กำลังบันทึก...' : initial ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลลูกค้า'}
        </button>
      </div>
    </form>
  );
}
