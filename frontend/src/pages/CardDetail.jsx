import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer, deleteCustomer } from '../api';

const Row = ({ label, value }) => value ? (
  <div className="py-2 border-b border-gray-100 last:border-0">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-sm text-gray-800 mt-0.5">{value}</p>
  </div>
) : null;

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomer(id).then(r => { setCustomer(r.data); setLoading(false); })
      .catch(() => navigate('/'));
  }, [id, navigate]);

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">กำลังโหลด...</div>;
  if (!customer) return null;

  const countries = typeof customer.countries === 'string' ? JSON.parse(customer.countries) : (customer.countries || []);
  const bizTypes = typeof customer.business_types === 'string' ? JSON.parse(customer.business_types) : (customer.business_types || []);
  const allCountries = [...countries, customer.country_other].filter(Boolean);
  const allBizTypes = [...bizTypes, customer.business_type_other].filter(Boolean);

  const handleDelete = async () => {
    if (!confirm('ลบข้อมูลนี้?')) return;
    await deleteCustomer(id);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1 truncate">
          {customer.contact_name || customer.company_name || 'รายละเอียด'}
        </h1>
        <button onClick={() => navigate(`/edit/${id}`)} className="text-sm underline">แก้ไข</button>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Photos */}
        <div className="flex gap-3">
          {customer.card_photo && (
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">นามบัตร</p>
              <img src={`/uploads/${customer.card_photo}`}
                className="w-full rounded-xl border border-gray-200 max-h-48 object-contain bg-gray-50" alt="card" />
            </div>
          )}
          {customer.customer_photo && (
            <div className="w-32">
              <p className="text-xs text-gray-500 mb-1">รูปลูกค้า</p>
              <img src={`/uploads/${customer.customer_photo}`}
                className="w-full rounded-xl border border-gray-200 h-32 object-cover" alt="customer" />
            </div>
          )}
        </div>

        {/* Visit info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-2">การเยี่ยมชม</h2>
          <Row label="วันที่" value={customer.visit_date?.slice(0, 10)} />
          {customer.is_visitor ? <Row label="ประเภท" value="Visitor" /> : null}
          <Row label="Arrange by" value={customer.arrange_by} />
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-2">ข้อมูลติดต่อ</h2>
          <Row label="บริษัท" value={customer.company_name} />
          <Row label="ชื่อ" value={customer.contact_name} />
          <Row label="ตำแหน่ง" value={customer.position} />
          <Row label="โทรศัพท์" value={customer.phone} />
          <Row label="Email" value={customer.email} />
          <Row label="Website" value={customer.website} />
          <Row label="ที่อยู่" value={customer.address} />
        </div>

        {/* Country & Business type */}
        {(allCountries.length > 0 || allBizTypes.length > 0) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {allCountries.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-bold text-gray-700 mb-2">Country</h2>
                <div className="flex flex-wrap gap-2">
                  {allCountries.map(c => (
                    <span key={c} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {allBizTypes.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-700 mb-2">Business Type</h2>
                <div className="flex flex-wrap gap-2">
                  {allBizTypes.map(bt => (
                    <span key={bt} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">{bt}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Remark & Note */}
        {(customer.remark || customer.note) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Row label="Remark / Special Requirement" value={customer.remark} />
            <Row label="Note" value={customer.note} />
          </div>
        )}

        <button onClick={handleDelete}
          className="w-full py-3 rounded-xl border border-red-300 text-red-500 font-medium text-sm mt-2">
          ลบข้อมูลนี้
        </button>
      </div>
    </div>
  );
}
