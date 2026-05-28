import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from '../api';

export default function CardList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCustomers({ search, page, limit: LIMIT });
      setCustomers(data.data);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, name) => {
    if (!confirm(`ลบข้อมูล "${name}" ?`)) return;
    await deleteCustomer(id);
    load();
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold">Customer Cards</h1>
          <span className="text-blue-200 text-sm">{total} รายการ</span>
        </div>
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="ค้นหา บริษัท / ชื่อ / email..."
          className="w-full rounded-xl px-4 py-2 text-gray-800 text-base"
        />
      </div>

      {/* List */}
      <div className="p-3 space-y-3 max-w-lg mx-auto">
        {loading && (
          <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
        )}
        {!loading && customers.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>ยังไม่มีข้อมูลลูกค้า</p>
          </div>
        )}

        {customers.map(c => {
          const countries = typeof c.countries === 'string' ? JSON.parse(c.countries) : (c.countries || []);
          const bizTypes = typeof c.business_types === 'string' ? JSON.parse(c.business_types) : (c.business_types || []);
          return (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex gap-3 p-3">
                {/* Card photo thumb */}
                <div className="w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {c.card_photo ? (
                    <img src={`/uploads/${c.card_photo}`} className="w-full h-full object-cover" alt="card" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {c.contact_name || c.company_name || '(ไม่มีชื่อ)'}
                      </p>
                      {c.company_name && c.contact_name && (
                        <p className="text-xs text-gray-500 truncate">{c.company_name}</p>
                      )}
                    </div>
                    {c.customer_photo && (
                      <img src={`/uploads/${c.customer_photo}`}
                        className="w-8 h-8 rounded-full object-cover border-2 border-blue-200 flex-shrink-0" alt="customer" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{c.visit_date?.slice(0, 10)}</p>
                  {countries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {countries.slice(0, 3).map(ct => (
                        <span key={ct} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{ct}</span>
                      ))}
                    </div>
                  )}
                  {bizTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bizTypes.slice(0, 2).map(bt => (
                        <span key={bt} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{bt}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 flex">
                <button onClick={() => navigate(`/detail/${c.id}`)}
                  className="flex-1 py-2 text-blue-600 text-sm font-medium active:bg-blue-50">
                  ดูรายละเอียด
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => navigate(`/edit/${c.id}`)}
                  className="flex-1 py-2 text-gray-600 text-sm font-medium active:bg-gray-50">
                  แก้ไข
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => handleDelete(c.id, c.contact_name || c.company_name || 'รายการนี้')}
                  className="flex-1 py-2 text-red-500 text-sm font-medium active:bg-red-50">
                  ลบ
                </button>
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40">
              ก่อนหน้า
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40">
              ถัดไป
            </button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl active:bg-blue-700">
        +
      </button>
    </div>
  );
}
