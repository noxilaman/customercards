import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer } from '../api';
import CustomerForm from '../components/CustomerForm';

export default function EditCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    getCustomer(id).then(r => setCustomer(r.data)).catch(() => navigate('/'));
  }, [id, navigate]);

  if (!customer) return <div className="flex items-center justify-center h-screen text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">แก้ไขข้อมูล</h1>
      </div>
      <div className="p-4 max-w-lg mx-auto">
        <CustomerForm initial={customer} onSuccess={() => navigate(`/detail/${id}`)} />
      </div>
    </div>
  );
}
