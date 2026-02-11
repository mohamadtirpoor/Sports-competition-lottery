import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import Bracket from '@/components/Bracket';
import GroupStage from '@/components/GroupStage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function TournamentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editName, setEditName] = useState('');
  const [showDrawAnimation, setShowDrawAnimation] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('setup');

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  const fetchTournament = async () => {
    try {
      const response = await axios.get(`${API_URL}/tournaments/${id}`);
      setTournament(response.data);
      setParticipants(response.data.participants || []);
      setMatches(response.data.matches || []);
      
      if (response.data.status === 'active') {
        setActiveTab('bracket');
        fetchLeaderboard();
      }
    } catch (error) {
      console.error('خطا در دریافت مسابقه:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/tournaments/${id}/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('خطا در دریافت رتبه‌بندی:', error);
    }
  };

  const addParticipant = async () => {
    if (!newParticipant.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/tournaments/${id}/participants`, {
        name: newParticipant,
        type: 'player'
      });
      setParticipants([...participants, response.data]);
      setNewParticipant('');
    } catch (error) {
      console.error('خطا در افزودن شرکت‌کننده:', error);
    }
  };

  const deleteParticipant = async (participantId) => {
    if (!confirm('آیا از حذف این شرکت‌کننده مطمئن هستید؟')) return;

    try {
      await axios.delete(`${API_URL}/participants/${participantId}`);
      setParticipants(participants.filter(p => p.id !== participantId));
    } catch (error) {
      console.error('خطا در حذف شرکت‌کننده:', error);
    }
  };

  const startEditParticipant = (participant) => {
    setEditingParticipant(participant.id);
    setEditName(participant.name);
  };

  const saveEditParticipant = async (participantId) => {
    if (!editName.trim()) return;

    try {
      await axios.put(`${API_URL}/participants/${participantId}`, {
        name: editName
      });
      setParticipants(participants.map(p => 
        p.id === participantId ? { ...p, name: editName } : p
      ));
      setEditingParticipant(null);
      setEditName('');
    } catch (error) {
      console.error('خطا در ویرایش شرکت‌کننده:', error);
    }
  };

  const cancelEdit = () => {
    setEditingParticipant(null);
    setEditName('');
  };

  const performDraw = async () => {
    if (participants.length < 2) {
      alert('حداقل ۲ شرکت‌کننده نیاز است');
      return;
    }

    setShowDrawAnimation(true);
    
    setTimeout(async () => {
      try {
        await axios.post(`${API_URL}/tournaments/${id}/draw`);
        await fetchTournament();
        setShowDrawAnimation(false);
        setActiveTab('bracket');
      } catch (error) {
        console.error('خطا در قرعه‌کشی:', error);
        setShowDrawAnimation(false);
      }
    }, 3000);
  };

  const updateMatchResult = async (matchId, winnerId, score) => {
    try {
      await axios.put(`${API_URL}/matches/${matchId}/result`, {
        winner_id: winnerId,
        score: score
      });
      await fetchTournament();
      await fetchLeaderboard();
    } catch (error) {
      console.error('خطا در ثبت نتیجه:', error);
    }
  };

  if (!tournament) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <p className="text-xl text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white">
              {tournament.name}
            </h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              tournament.status === 'active'
                ? 'bg-green-900 text-green-300'
                : 'bg-gray-700 text-gray-300'
            }`}>
              {tournament.status === 'active' ? 'فعال' : 'پیش‌نویس'}
            </span>
          </div>
          <p className="text-gray-400">
            نوع مسابقه: {tournament.type === 'knockout' ? '🏅 حذفی' : '👥 گروهی'}
          </p>
        </motion.div>

        <div className="flex gap-4 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'setup'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            ⚙️ تنظیمات
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            disabled={tournament.status !== 'active'}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'bracket'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300'
            } ${tournament.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🏆 جدول مسابقات
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            disabled={tournament.status !== 'active'}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'predictions'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300'
            } ${tournament.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            📊 رتبه‌بندی
          </button>
        </div>

        {activeTab === 'setup' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-white">
                شرکت‌کننده‌ها ({participants.length})
              </h2>
              
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                  placeholder="نام بازیکن یا تیم"
                  className="flex-1 px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-700 text-white"
                />
                <button
                  onClick={addParticipant}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  افزودن
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-700 p-4 rounded-lg flex items-center justify-between gap-3"
                  >
                    {editingParticipant === participant.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveEditParticipant(participant.id)}
                          className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none bg-gray-600 text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEditParticipant(participant.id)}
                          className="text-green-400 hover:text-green-300 text-xl"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-400 hover:text-red-300 text-xl"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">👤</span>
                          <span className="font-medium text-white">
                            {participant.name}
                          </span>
                        </div>
                        {tournament.status === 'draft' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditParticipant(participant)}
                              className="text-blue-400 hover:text-blue-300 text-xl"
                              title="ویرایش"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteParticipant(participant.id)}
                              className="text-red-400 hover:text-red-300 text-xl"
                              title="حذف"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}
              </div>

              {participants.length >= 2 && tournament.status === 'draft' && (
                <button
                  onClick={performDraw}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all"
                >
                  🎲 شروع قرعه‌کشی
                </button>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'bracket' && tournament.status === 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {tournament.type === 'knockout' ? (
              <Bracket
                matches={matches}
                participants={participants}
                onUpdateResult={updateMatchResult}
              />
            ) : (
              <GroupStage
                matches={matches}
                participants={participants}
                onUpdateResult={updateMatchResult}
              />
            )}
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">
              🏅 رتبه‌بندی پیش‌بینی‌کننده‌ها
            </h2>
            
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-400">
                  هنوز پیش‌بینی ثبت نشده است
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((user, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-white">
                        {user.user_name}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-green-400">
                        {user.correct_predictions}
                      </div>
                      <div className="text-sm text-gray-400">
                        از {user.total_predictions} پیش‌بینی
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {showDrawAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-9xl"
              >
                🎲
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-32 text-white text-2xl font-bold"
              >
                در حال قرعه‌کشی...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
