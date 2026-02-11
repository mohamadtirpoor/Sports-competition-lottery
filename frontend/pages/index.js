import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Home() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTournament, setNewTournament] = useState({ name: '', type: 'knockout' });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get(`${API_URL}/tournaments`);
      setTournaments(response.data);
    } catch (error) {
      console.error('خطا در دریافت مسابقات:', error);
    }
  };

  const deleteTournament = async (tournamentId, e) => {
    e.stopPropagation(); // جلوگیری از باز شدن صفحه مسابقه
    
    if (!confirm('آیا از حذف این مسابقه مطمئن هستید؟')) return;

    try {
      await axios.delete(`${API_URL}/tournaments/${tournamentId}`);
      setTournaments(tournaments.filter(t => t.id !== tournamentId));
    } catch (error) {
      console.error('خطا در حذف مسابقه:', error);
      alert('خطا در حذف مسابقه');
    }
  };

  const createTournament = async () => {
    if (!newTournament.name.trim()) {
      alert('لطفاً نام مسابقه را وارد کنید');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/tournaments`, newTournament);
      router.push(`/tournament/${response.data.id}`);
    } catch (error) {
      console.error('خطا در ایجاد مسابقه:', error);
      alert('خطا در ایجاد مسابقه');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            پلتفرم مدیریت مسابقات ورزشی
          </h1>
          <p className="text-gray-400 text-lg">
            مسابقات خود را ایجاد کنید، قرعه‌کشی کنید و نتایج را مدیریت نمایید
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            ➕ ایجاد مسابقه جدید
          </motion.button>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-400 text-lg">
              هنوز مسابقه‌ای ایجاد نشده است
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => router.push(`/tournament/${tournament.id}`)}
                className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tournament.status === 'active' 
                        ? 'bg-green-900 text-green-300'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {tournament.status === 'active' ? 'فعال' : 'پیش‌نویس'}
                    </span>
                    <button
                      onClick={(e) => deleteTournament(tournament.id, e)}
                      className="text-red-400 hover:text-red-300 text-xl p-1 hover:bg-red-900 rounded transition-all"
                      title="حذف مسابقه"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-2xl">
                    {tournament.type === 'knockout' ? '🏅' : '👥'}
                  </span>
                  <span>
                    {tournament.type === 'knockout' ? 'حذفی' : 'گروهی'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-white">
                ایجاد مسابقه جدید
              </h2>
              
              <div className="mb-6">
                <label className="block text-gray-300 mb-2 font-medium">
                  نام مسابقه
                </label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-700 text-white"
                  placeholder="مثال: مسابقات پینگ‌پنگ"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 mb-2 font-medium">
                  نوع مسابقه
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewTournament({ ...newTournament, type: 'knockout' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      newTournament.type === 'knockout'
                        ? 'border-blue-500 bg-blue-900'
                        : 'border-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">🏅</div>
                    <div className="font-medium text-white">حذفی</div>
                  </button>
                  <button
                    onClick={() => setNewTournament({ ...newTournament, type: 'group' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      newTournament.type === 'group'
                        ? 'border-blue-500 bg-blue-900'
                        : 'border-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">👥</div>
                    <div className="font-medium text-white">گروهی</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={createTournament}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  ایجاد
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-all"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}
