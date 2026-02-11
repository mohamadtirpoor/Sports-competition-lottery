import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Bracket({ matches, participants, onUpdateResult }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [score, setScore] = useState('');

  const getParticipantName = (id) => {
    const participant = participants.find(p => p.id === id);
    return participant ? participant.name : 'منتظر برنده';
  };

  const rounds = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  const getRoundName = (round, totalRounds) => {
    const roundNum = parseInt(round);
    if (roundNum === totalRounds) return 'فینال';
    if (roundNum === totalRounds - 1) return 'نیمه نهایی';
    if (roundNum === totalRounds - 2) return 'یک چهارم نهایی';
    return `دور ${roundNum}`;
  };

  const totalRounds = Math.max(...Object.keys(rounds).map(r => parseInt(r)));

  const handleWinnerSelect = (matchId, winnerId) => {
    if (!score.trim()) {
      alert('لطفاً نتیجه را وارد کنید');
      return;
    }
    onUpdateResult(matchId, winnerId, score);
    setSelectedMatch(null);
    setScore('');
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">
        🏆 جدول حذفی
      </h2>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-8 min-w-max pb-4">
          {Object.keys(rounds).sort((a, b) => a - b).map((round) => (
            <div key={round} className="flex flex-col gap-4 min-w-[300px]">
              <h3 className="text-lg font-bold text-center text-gray-300 mb-2">
                {getRoundName(round, totalRounds)}
              </h3>
              
              {rounds[round].map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-700 rounded-lg p-4 shadow-md"
                >
                  <div className="space-y-3">
                    <div
                      onClick={() => !match.winner_id && match.participant1_id && match.participant2_id && setSelectedMatch(match)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        match.winner_id === match.participant1_id
                          ? 'bg-green-900 border-2 border-green-500'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">
                          {match.participant1_id ? getParticipantName(match.participant1_id) : 'منتظر...'}
                        </span>
                        {match.winner_id === match.participant1_id && <span className="text-xl">✅</span>}
                      </div>
                    </div>

                    <div className="text-center text-gray-400 text-sm font-medium">
                      VS
                    </div>

                    <div
                      onClick={() => !match.winner_id && match.participant1_id && match.participant2_id && setSelectedMatch(match)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        match.winner_id === match.participant2_id
                          ? 'bg-green-900 border-2 border-green-500'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">
                          {match.participant2_id ? getParticipantName(match.participant2_id) : 'منتظر...'}
                        </span>
                        {match.winner_id === match.participant2_id && <span className="text-xl">✅</span>}
                      </div>
                    </div>
                  </div>

                  {match.score && (
                    <div className="mt-3 text-center text-sm text-gray-400 bg-gray-800 rounded py-2">
                      نتیجه: {match.score}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6 text-white">
              ثبت نتیجه بازی
            </h3>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">
                نتیجه (مثال: 3-1)
              </label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-700 text-white"
                placeholder="3-1"
              />
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleWinnerSelect(selectedMatch.id, selectedMatch.participant1_id)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all"
              >
                برنده: {getParticipantName(selectedMatch.participant1_id)}
              </button>
              <button
                onClick={() => handleWinnerSelect(selectedMatch.id, selectedMatch.participant2_id)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all"
              >
                برنده: {getParticipantName(selectedMatch.participant2_id)}
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedMatch(null);
                setScore('');
              }}
              className="w-full bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-all"
            >
              انصراف
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
