import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from '../api';

const LIMIT = 20;

function parseJSON(v) {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v) || []; } catch { return []; }
}

function formatDate(s) {
  return s?.slice(0, 10) ?? '';
}

// ── Excel export (xlsx loaded on demand to keep initial bundle small) ─────────
async function exportExcel(search) {
  const XLSX = (await import('xlsx')).default ?? await import('xlsx');
  const { data } = await getCustomers({ search, page: 1, limit: 999999 });
  const rows = data.data.map((c, i) => ({
    '#': i + 1,
    'Visit Date': formatDate(c.visit_date),
    'Visitor': c.is_visitor ? 'Yes' : 'No',
    'Company': c.company_name ?? '',
    'Contact Name': c.contact_name ?? '',
    'Position': c.position ?? '',
    'Phone': c.phone ?? '',
    'Email': c.email ?? '',
    'Website': c.website ?? '',
    'Address': c.address ?? '',
    'Country': parseJSON(c.countries).join(', '),
    'Country Other': c.country_other ?? '',
    'Business Type': parseJSON(c.business_types).join(', '),
    'Business Type Other': c.business_type_other ?? '',
    'Arrange By': c.arrange_by ?? '',
    'Remark': c.remark ?? '',
    'Note': c.note ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 8 }, { wch: 32 }, { wch: 22 },
    { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 28 }, { wch: 36 },
    { wch: 22 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 14 },
    { wch: 36 }, { wch: 24 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  XLSX.writeFile(wb, `customers_${formatDate(new Date().toISOString())}.xlsx`);
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconList = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);
const IconTable = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 10h18M3 6h18M3 14h18M3 18h18M9 6v12M15 6v12" />
  </svg>
);
const IconExcel = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

// ── Table view ────────────────────────────────────────────────────────────────
function TableView({ customers, onEdit, onDelete, onDetail }) {
  const cols = [
    { key: 'visit_date', label: 'วันที่', w: 'min-w-[90px]' },
    { key: 'company_name', label: 'บริษัท', w: 'min-w-[180px]' },
    { key: 'contact_name', label: 'ชื่อ', w: 'min-w-[130px]' },
    { key: 'position', label: 'ตำแหน่ง', w: 'min-w-[130px]' },
    { key: 'phone', label: 'โทรศัพท์', w: 'min-w-[130px]' },
    { key: 'email', label: 'Email', w: 'min-w-[180px]' },
    { key: 'countries', label: 'Country', w: 'min-w-[120px]' },
    { key: 'business_types', label: 'Business Type', w: 'min-w-[150px]' },
    { key: 'arrange_by', label: 'Arrange By', w: 'min-w-[100px]' },
  ];

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-blue-600 text-white text-left">
            <th className="px-3 py-2.5 font-semibold whitespace-nowrap sticky left-0 bg-blue-600 z-10 min-w-[36px]">#</th>
            {cols.map(c => (
              <th key={c.key} className={`px-3 py-2.5 font-semibold whitespace-nowrap ${c.w}`}>{c.label}</th>
            ))}
            <th className="px-3 py-2.5 font-semibold whitespace-nowrap min-w-[120px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, idx) => {
            const countries = parseJSON(c.countries);
            const bizTypes = parseJSON(c.business_types);
            return (
              <tr
                key={c.id}
                className="border-t border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => onDetail(c.id)}
              >
                <td className="px-3 py-2 text-gray-400 sticky left-0 bg-white hover:bg-blue-50 text-xs">
                  {idx + 1}
                </td>
                <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{formatDate(c.visit_date)}</td>
                <td className="px-3 py-2 font-medium text-gray-900 max-w-[180px] truncate">
                  {c.company_name || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2 text-gray-700 max-w-[130px] truncate">
                  {c.contact_name || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2 text-gray-600 max-w-[130px] truncate">
                  {c.position || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.phone || <span className="text-gray-300">—</span>}</td>
                <td className="px-3 py-2 text-blue-600 max-w-[180px] truncate">
                  {c.email ? <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()}>{c.email}</a> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2">
                  {countries.length > 0 ? (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {countries.slice(0, 2).join(', ')}{countries.length > 2 ? ` +${countries.length - 2}` : ''}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2">
                  {bizTypes.length > 0 ? (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {bizTypes.slice(0, 2).join(', ')}{bizTypes.length > 2 ? ` +${bizTypes.length - 2}` : ''}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">
                  {c.arrange_by || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button onClick={() => onEdit(c.id)}
                      className="px-2 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                      แก้ไข
                    </button>
                    <button onClick={() => onDelete(c.id, c.contact_name || c.company_name || 'รายการนี้')}
                      className="px-2 py-1 text-xs rounded-md border border-red-100 text-red-500 hover:bg-red-50 whitespace-nowrap">
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {customers.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่พบข้อมูล</div>
      )}
    </div>
  );
}

// ── Card view (existing) ──────────────────────────────────────────────────────
function CardView({ customers, onDetail, onEdit, onDelete }) {
  if (customers.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p>ยังไม่มีข้อมูลลูกค้า</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {customers.map(c => {
        const countries = parseJSON(c.countries);
        const bizTypes = parseJSON(c.business_types);
        return (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex gap-3 p-3">
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
                <p className="text-xs text-gray-400 mt-1">{formatDate(c.visit_date)}</p>
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
            <div className="border-t border-gray-100 flex">
              <button onClick={() => onDetail(c.id)}
                className="flex-1 py-2 text-blue-600 text-sm font-medium active:bg-blue-50">ดูรายละเอียด</button>
              <div className="w-px bg-gray-100" />
              <button onClick={() => onEdit(c.id)}
                className="flex-1 py-2 text-gray-600 text-sm font-medium active:bg-gray-50">แก้ไข</button>
              <div className="w-px bg-gray-100" />
              <button onClick={() => onDelete(c.id, c.contact_name || c.company_name || 'รายการนี้')}
                className="flex-1 py-2 text-red-500 text-sm font-medium active:bg-red-50">ลบ</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CardList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportExcel(search);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h1 className="text-lg font-bold leading-tight">Customer Cards</h1>
            <span className="text-blue-200 text-xs">{total} รายการ</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Excel */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <IconExcel />
              {exporting ? 'กำลัง Export...' : 'Export Excel'}
            </button>
            {/* View toggle */}
            <div className="flex bg-blue-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 transition-colors ${viewMode === 'card' ? 'bg-white text-blue-600' : 'text-blue-200 hover:text-white'}`}
                title="Card view"
              >
                <IconList />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 transition-colors ${viewMode === 'table' ? 'bg-white text-blue-600' : 'text-blue-200 hover:text-white'}`}
                title="Table view"
              >
                <IconTable />
              </button>
            </div>
          </div>
        </div>
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="ค้นหา บริษัท / ชื่อ / email / arrange by..."
          className="w-full rounded-xl px-4 py-2 text-gray-800 text-base"
        />
      </div>

      {/* Content */}
      <div className={viewMode === 'table' ? 'p-3' : 'p-3 max-w-lg mx-auto'}>
        {loading ? (
          <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
        ) : viewMode === 'table' ? (
          <TableView
            customers={customers}
            onDetail={id => navigate(`/detail/${id}`)}
            onEdit={id => navigate(`/edit/${id}`)}
            onDelete={handleDelete}
          />
        ) : (
          <CardView
            customers={customers}
            onDetail={id => navigate(`/detail/${id}`)}
            onEdit={id => navigate(`/edit/${id}`)}
            onDelete={handleDelete}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 bg-white">
              ก่อนหน้า
            </button>
            <span className="px-3 py-2 text-sm text-gray-600 font-medium">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 bg-white">
              ถัดไป
            </button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl active:bg-blue-700 z-20">
        +
      </button>
    </div>
  );
}
