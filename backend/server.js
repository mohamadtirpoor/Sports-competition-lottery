const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// سرو کردن فایل‌های استاتیک Next.js (برای production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/.next/static')));
  app.use(express.static(path.join(__dirname, '../frontend/public')));
}

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'tournament.db'), (err) => {
  if (err) {
    console.error('خطا در اتصال به دیتابیس:', err);
  } else {
    console.log('✅ اتصال به دیتابیس برقرار شد');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // جدول مسابقات
    db.run(`CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // جدول شرکت‌کننده‌ها
    db.run(`CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'player',
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    )`);

    // جدول بازی‌ها
    db.run(`CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      round INTEGER NOT NULL,
      match_number INTEGER NOT NULL,
      participant1_id TEXT,
      participant2_id TEXT,
      winner_id TEXT,
      score TEXT,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    )`);

    // جدول پیش‌بینی‌ها
    db.run(`CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      predicted_winner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches(id)
    )`);
  });
}

// ایجاد مسابقه جدید
app.post('/api/tournaments', (req, res) => {
  const { name, type } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO tournaments (id, name, type) VALUES (?, ?, ?)',
    [id, name, type],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در ایجاد مسابقه' });
      }
      res.json({ id, name, type, status: 'draft' });
    }
  );
});

// دریافت لیست مسابقات
app.get('/api/tournaments', (req, res) => {
  db.all('SELECT * FROM tournaments ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'خطا در دریافت مسابقات' });
    }
    res.json(rows);
  });
});

// دریافت جزئیات یک مسابقه
app.get('/api/tournaments/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM tournaments WHERE id = ?', [id], (err, tournament) => {
    if (err || !tournament) {
      return res.status(404).json({ error: 'مسابقه یافت نشد' });
    }

    db.all('SELECT * FROM participants WHERE tournament_id = ?', [id], (err, participants) => {
      db.all('SELECT * FROM matches WHERE tournament_id = ? ORDER BY round, match_number', [id], (err, matches) => {
        res.json({ ...tournament, participants, matches });
      });
    });
  });
});

// افزودن شرکت‌کننده
app.post('/api/tournaments/:id/participants', (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  const participantId = uuidv4();

  db.run(
    'INSERT INTO participants (id, tournament_id, name, type) VALUES (?, ?, ?, ?)',
    [participantId, id, name, type || 'player'],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در افزودن شرکت‌کننده' });
      }
      res.json({ id: participantId, tournament_id: id, name, type: type || 'player' });
    }
  );
});

// حذف شرکت‌کننده
app.delete('/api/participants/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM participants WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'خطا در حذف شرکت‌کننده' });
    }
    res.json({ message: 'شرکت‌کننده حذف شد' });
  });
});

// ویرایش شرکت‌کننده
app.put('/api/participants/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  db.run('UPDATE participants SET name = ? WHERE id = ?', [name, id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'خطا در ویرایش شرکت‌کننده' });
    }
    res.json({ message: 'شرکت‌کننده ویرایش شد' });
  });
});

// حذف مسابقه
app.delete('/api/tournaments/:id', (req, res) => {
  const { id } = req.params;

  // حذف تمام داده‌های مرتبط با مسابقه
  db.serialize(() => {
    db.run('DELETE FROM predictions WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [id]);
    db.run('DELETE FROM matches WHERE tournament_id = ?', [id]);
    db.run('DELETE FROM participants WHERE tournament_id = ?', [id]);
    db.run('DELETE FROM tournaments WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در حذف مسابقه' });
      }
      res.json({ message: 'مسابقه حذف شد' });
    });
  });
});

// قرعه‌کشی
app.post('/api/tournaments/:id/draw', (req, res) => {
  const { id } = req.params;

  db.get('SELECT type FROM tournaments WHERE id = ?', [id], (err, tournament) => {
    if (err || !tournament) {
      return res.status(404).json({ error: 'مسابقه یافت نشد' });
    }

    db.all('SELECT * FROM participants WHERE tournament_id = ?', [id], (err, participants) => {
      if (participants.length < 2) {
        return res.status(400).json({ error: 'حداقل ۲ شرکت‌کننده نیاز است' });
      }

      // برای مسابقات حذفی، تعداد باید زوج باشه
      if (tournament.type === 'knockout' && participants.length % 2 !== 0) {
        return res.status(400).json({ error: 'برای مسابقات حذفی، تعداد شرکت‌کننده‌ها باید زوج باشد' });
      }

      // حذف بازی‌های قبلی
      db.run('DELETE FROM matches WHERE tournament_id = ?', [id], () => {
        // شافل کردن شرکت‌کننده‌ها
        const shuffled = [...participants].sort(() => Math.random() - 0.5);

        if (tournament.type === 'knockout') {
          createKnockoutMatches(id, shuffled, res);
        } else {
          createGroupMatches(id, shuffled, res);
        }
      });
    });
  });
});

function createKnockoutMatches(tournamentId, participants, res) {
  const matches = [];
  const numParticipants = participants.length;
  
  // محاسبه تعداد دورها
  const totalRounds = Math.log2(numParticipants);
  
  // ایجاد تمام بازی‌های دور اول
  for (let i = 0; i < numParticipants / 2; i++) {
    const p1 = participants[i * 2];
    const p2 = participants[i * 2 + 1];

    matches.push({
      id: uuidv4(),
      tournament_id: tournamentId,
      round: 1,
      match_number: i + 1,
      participant1_id: p1.id,
      participant2_id: p2.id,
      winner_id: null,
      score: null
    });
  }

  // ایجاد بازی‌های دورهای بعدی (خالی)
  let currentRoundMatches = numParticipants / 2;
  for (let round = 2; round <= totalRounds; round++) {
    currentRoundMatches = currentRoundMatches / 2;
    for (let i = 0; i < currentRoundMatches; i++) {
      matches.push({
        id: uuidv4(),
        tournament_id: tournamentId,
        round: round,
        match_number: i + 1,
        participant1_id: null,
        participant2_id: null,
        winner_id: null,
        score: null
      });
    }
  }

  const stmt = db.prepare(
    'INSERT INTO matches (id, tournament_id, round, match_number, participant1_id, participant2_id, winner_id, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  matches.forEach(m => {
    stmt.run(m.id, m.tournament_id, m.round, m.match_number, m.participant1_id, m.participant2_id, m.winner_id, m.score);
  });

  stmt.finalize(() => {
    db.run('UPDATE tournaments SET status = ? WHERE id = ?', ['active', tournamentId], () => {
      res.json({ message: 'قرعه‌کشی انجام شد', matches });
    });
  });
}

function createGroupMatches(tournamentId, participants, res) {
  const matches = [];
  let matchNumber = 1;

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        id: uuidv4(),
        tournament_id: tournamentId,
        round: 1,
        match_number: matchNumber++,
        participant1_id: participants[i].id,
        participant2_id: participants[j].id,
        winner_id: null,
        score: null
      });
    }
  }

  const stmt = db.prepare(
    'INSERT INTO matches (id, tournament_id, round, match_number, participant1_id, participant2_id, winner_id, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  matches.forEach(m => {
    stmt.run(m.id, m.tournament_id, m.round, m.match_number, m.participant1_id, m.participant2_id, m.winner_id, m.score);
  });

  stmt.finalize(() => {
    db.run('UPDATE tournaments SET status = ? WHERE id = ?', ['active', tournamentId], () => {
      res.json({ message: 'قرعه‌کشی انجام شد', matches });
    });
  });
}

// ثبت نتیجه بازی
app.put('/api/matches/:id/result', (req, res) => {
  const { id } = req.params;
  const { winner_id, score } = req.body;

  db.run(
    'UPDATE matches SET winner_id = ?, score = ? WHERE id = ?',
    [winner_id, score, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در ثبت نتیجه' });
      }

      // بررسی برای ایجاد بازی بعدی در حذفی
      db.get('SELECT * FROM matches WHERE id = ?', [id], (err, match) => {
        if (match) {
          createNextRoundMatch(match, res);
        } else {
          res.json({ message: 'نتیجه ثبت شد' });
        }
      });
    }
  );
});

function createNextRoundMatch(match, res) {
  db.get('SELECT type FROM tournaments WHERE id = ?', [match.tournament_id], (err, tournament) => {
    if (tournament && tournament.type === 'knockout' && match.winner_id) {
      const nextRound = match.round + 1;
      const nextMatchNumber = Math.ceil(match.match_number / 2);

      db.get(
        'SELECT * FROM matches WHERE tournament_id = ? AND round = ? AND match_number = ?',
        [match.tournament_id, nextRound, nextMatchNumber],
        (err, existingMatch) => {
          if (existingMatch) {
            // تعیین اینکه برنده باید در کدام سمت قرار بگیرد
            const field = match.match_number % 2 === 1 ? 'participant1_id' : 'participant2_id';
            
            db.run(
              `UPDATE matches SET ${field} = ? WHERE id = ?`,
              [match.winner_id, existingMatch.id]
            );
          }
        }
      );
    }
    if (res) {
      res.json({ message: 'نتیجه ثبت شد' });
    }
  });
}

// ثبت پیش‌بینی
app.post('/api/predictions', (req, res) => {
  const { match_id, user_name, predicted_winner_id } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO predictions (id, match_id, user_name, predicted_winner_id) VALUES (?, ?, ?, ?)',
    [id, match_id, user_name, predicted_winner_id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در ثبت پیش‌بینی' });
      }
      res.json({ id, match_id, user_name, predicted_winner_id });
    }
  );
});

// دریافت رتبه‌بندی پیش‌بینی‌ها
app.get('/api/tournaments/:id/leaderboard', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      p.user_name,
      COUNT(*) as total_predictions,
      SUM(CASE WHEN p.predicted_winner_id = m.winner_id THEN 1 ELSE 0 END) as correct_predictions
    FROM predictions p
    JOIN matches m ON p.match_id = m.id
    WHERE m.tournament_id = ? AND m.winner_id IS NOT NULL
    GROUP BY p.user_name
    ORDER BY correct_predictions DESC, total_predictions DESC
  `;

  db.all(query, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'خطا در دریافت رتبه‌بندی' });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 سرور در حال اجرا است: http://localhost:${PORT}`);
});
