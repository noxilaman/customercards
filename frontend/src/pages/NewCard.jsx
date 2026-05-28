import { useNavigate } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';

export default function NewCard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">บันทึกลูกค้าใหม่</h1>
      </div>
      <div className="p-4 max-w-lg mx-auto">
        <CustomerForm onSuccess={() => navigate('/')} />
      </div>
    </div>
  );
}
