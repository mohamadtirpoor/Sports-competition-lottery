import { useState } from 'react';
import { motion } from 'framer-motion';

export default function GroupStage({ matches, participants, onUpdateResult }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [score, setScore] = useState('');

  const getParticipantName = (id) => {
    const participant = participants.find(p => p.id === id);
    return participant ? participant.name : 'نامشخص';
  };

  const calculateStandings = () => {
    const standings = {};
    
    participants.forEach(p => {
      standings[p.id] = {
        name: p.name,
        played: 0,
        won: 0,
        lost: 0,
        points: 0
      };
    });

    matches.forEach(match => {
      if (match.winner_id) {
        standings[match.participant1_id].played++;
        standings[match.participant2_id].played++;

        if (match.winner_id === match.participant1_id) {
          standings[match.participant1_id].won++;
          standings[match.participant1_id].points += 3;
          standings[match.participant2_id].lost++;
        } else {
          standings[match.participant2_id].won++;
          standings[match.participant2_id].points += 3;
          standings[match.participant1_id].lost++;
        }
      }
    });

    return Object.values(standings).sort((a, b) => b.points - a.points);
  };

  const handleWinnerSelect = (matchId, winnerId) => {
    if (!score.trim()) {
      alert('لطفاً نتیجه را وارد کنید');
      return;
    }
    onUpdateResult(matchId, winnerId, score);
    setSelectedMatch(null);
    setScore('');
  };

  const standings = calculateStandings();

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-white">
          📊 جدول رده‌بندی
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-4 py-3 text-right font-bold text-gray-300">رتبه</th>
                <th className="px-4 py-3 text-right font-bold text-gray-300">نام</th>
                <th className="px-4 py-3 text-center font-bold text-gray-300">بازی</th>
                <th className="px-4 py-3 text-center font-bold text-gray-300">برد</th>
                <th className="px-4 py-3 text-center font-bold text-gray-300">باخت</th>
                <th className="px-4 py-3 text-center font-bold text-gray-300">امتیاز</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-700 hover:bg-gray-700"
                >
                  <td className="px-4 py-3 font-bold text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {team.name}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">
                    {team.played}
                  </td>
                  <td className="px-4 py-3 text-center text-green-400 font-medium">
                    {team.won}
                  </td>
                  <td className="px-4 py-3 text-center text-red-400 font-medium">
                    {team.lost}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-blue-400">
                    {team.points}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-white">
          🏅 بازی‌ها
        </h2>

        <div className="space-y-4">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !match.winner_id && setSelectedMatch(match)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                match.winner_id
                  ? 'bg-gray-700'
                  : 'bg-blue-900 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className={`font-medium ${
                    match.winner_id === match.participant1_id
                      ? 'text-green-400 font-bold'
                      : 'text-white'
                  }`}>
                    {getParticipantName(match.participant1_id)}
                  </span>
                  <span className="text-gray-400">VS</span>
                  <span className={`font-medium ${
                    match.winner_id === match.participant2_id
                      ? 'text-green-400 font-bold'
                      : 'text-white'
                  }`}>
                    {getParticipantName(match.participant2_id)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {match.score && (
                    <span className="text-sm bg-gray-600 px-3 py-1 rounded-full text-gray-300">
                      {match.score}
                    </span>
                  )}
                  {match.winner_id ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <span className="text-sm text-blue-400 font-medium">
                      ثبت نتیجه
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
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
