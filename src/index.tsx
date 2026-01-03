import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (path.includes('/auth/')) return next()

  const userId = c.req.header('x-user-id')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('userId', userId)
  await next()
})

// --- AUTH ---
app.post('/api/auth/register', async (c) => {
  const { name, email, password } = await c.req.json()
  try {
    // Tenta inserir apenas os campos básicos primeiro
    const result = await c.env.DB.prepare(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
    ).bind(name, email, password).run()
    
    return c.json({ success: true, user: { id: result.meta.last_row_id, name, email, daily_goal_minutes: 60, weekly_goal_questions: 100 } })
  } catch (e) {
    return c.json({ error: 'Email already exists' }, 400)
  }
})

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  
  // Login robusto: Pega tudo (*)
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND password = ?'
  ).bind(email, password).first()

  if (!user) return c.json({ error: 'Invalid credentials' }, 401)
  
  // Preencher defaults se colunas novas não existirem ou forem null
  // (Isso evita que o Frontend quebre esperando esses dados)
  if (!user.daily_goal_minutes) user.daily_goal_minutes = 60
  if (!user.weekly_goal_questions) user.weekly_goal_questions = 100
  if (!user.avatar_id) user.avatar_id = '1'

  return c.json({ success: true, user })
})

// --- ROTAS PROTEGIDAS ---

// 1. MATÉRIAS
app.get('/api/subjects', async (c) => {
  const userId = c.get('userId')
  const { results } = await c.env.DB.prepare('SELECT * FROM subjects WHERE user_id = ? ORDER BY name').bind(userId).all()
  return c.json(results)
})

app.post('/api/subjects', async (c) => {
  const userId = c.get('userId')
  const { name, color } = await c.req.json()
  const result = await c.env.DB.prepare(
    'INSERT INTO subjects (user_id, name, color) VALUES (?, ?, ?)'
  ).bind(userId, name, color || '#3b82f6').run()
  return c.json({ id: result.meta.last_row_id, name, color })
})

app.delete('/api/subjects/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM subjects WHERE id = ? AND user_id = ?').bind(id, userId).run()
  return c.json({ success: true })
})

// 2. TÓPICOS
app.get('/api/subjects/:id/topics', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM topics WHERE subject_id = ? AND user_id = ? ORDER BY created_at DESC'
  ).bind(id, userId).all()
  return c.json(results)
})

app.post('/api/topics', async (c) => {
  const userId = c.get('userId')
  const { subject_id, name } = await c.req.json()
  const result = await c.env.DB.prepare(
    'INSERT INTO topics (user_id, subject_id, name) VALUES (?, ?, ?)'
  ).bind(userId, subject_id, name).run()
  return c.json({ id: result.meta.last_row_id, subject_id, name, is_completed: 0 })
})

app.patch('/api/topics/:id/toggle', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const topic = await c.env.DB.prepare('SELECT is_completed FROM topics WHERE id = ? AND user_id = ?').bind(id, userId).first()
  if (!topic) return c.notFound()
  const newState = topic.is_completed ? 0 : 1
  await c.env.DB.prepare('UPDATE topics SET is_completed = ? WHERE id = ?').bind(newState, id).run()
  return c.json({ success: true, is_completed: newState })
})

// 3. CICLO DE ESTUDOS
app.get('/api/cycle', async (c) => {
  const userId = c.get('userId')
  const query = `
    SELECT c.*, s.name as subject_name, s.color as subject_color 
    FROM study_cycle c
    JOIN subjects s ON c.subject_id = s.id
    WHERE c.user_id = ?
    ORDER BY c.sort_order ASC
  `
  const { results } = await c.env.DB.prepare(query).bind(userId).all()
  return c.json(results)
})

app.post('/api/cycle', async (c) => {
  const userId = c.get('userId')
  const { subject_id, duration_minutes } = await c.req.json()
  const last = await c.env.DB.prepare('SELECT MAX(sort_order) as max_order FROM study_cycle WHERE user_id = ?').bind(userId).first()
  const nextOrder = (last?.max_order as number || 0) + 1
  await c.env.DB.prepare(
    'INSERT INTO study_cycle (user_id, subject_id, duration_minutes, sort_order) VALUES (?, ?, ?, ?)'
  ).bind(userId, subject_id, duration_minutes, nextOrder).run()
  return c.json({ success: true })
})

app.delete('/api/cycle/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM study_cycle WHERE id = ? AND user_id = ?').bind(id, userId).run()
  return c.json({ success: true })
})

// ROTA ATUALIZADA: MARCAR COMO ESTUDADO
app.post('/api/cycle/rotate', async (c) => {
  const userId = c.get('userId')
  const { subject_id } = await c.req.json()
  
  if (!subject_id) {
    return c.json({ success: false, error: 'Subject ID required' }, 400)
  }

  await c.env.DB.prepare(`
    UPDATE study_cycle 
    SET last_studied_at = CURRENT_TIMESTAMP 
    WHERE user_id = ? AND subject_id = ?
  `).bind(userId, subject_id).run()
  
  return c.json({ success: true })
})

// *** ROTAS DE HISTÓRICO DE CICLO ***
app.get('/api/cycle/history', async (c) => {
  const userId = c.get('userId')
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM cycle_history 
    WHERE user_id = ? 
    ORDER BY date DESC 
    LIMIT 7
  `).bind(userId).all()
  return c.json(results)
})

app.post('/api/cycle/finish', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const today = body.date || new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const existing = await c.env.DB.prepare('SELECT id FROM cycle_history WHERE user_id = ? AND date = ?').bind(userId, today).first()
  if (existing) {
    return c.json({ success: true, message: 'Already finished' })
  }

  const stats = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM study_sessions WHERE date(created_at, '-3 hours') = ? AND user_id = ?) +
      (SELECT COUNT(*) FROM revisions WHERE date(created_at, '-3 hours') = ? AND user_id = ?) as total_subjects,
      
      IFNULL((SELECT SUM(duration_seconds) FROM study_sessions WHERE date(created_at, '-3 hours') = ? AND user_id = ?), 0) +
      IFNULL((SELECT SUM(duration_seconds) FROM revisions WHERE date(created_at, '-3 hours') = ? AND user_id = ?), 0) as total_seconds
  `).bind(today, userId, today, userId, today, userId, today, userId).first()

  // Buscar nomes das matérias
  const subjects = await c.env.DB.prepare(`
    SELECT DISTINCT s.name 
    FROM subjects s
    LEFT JOIN study_sessions ss ON ss.subject_id = s.id AND date(ss.created_at, '-3 hours') = ?
    LEFT JOIN revisions r ON r.subject_id = s.id AND date(r.created_at, '-3 hours') = ?
    WHERE (ss.id IS NOT NULL OR r.id IS NOT NULL)
    AND s.user_id = ?
  `).bind(today, today, userId).all()
  
  const subjectsText = subjects.results.map((s: any) => s.name).join(', ')

  const totalMinutes = Math.floor((stats?.total_seconds as number || 0) / 60)
  const totalSubjects = stats?.total_subjects as number || 0

  await c.env.DB.prepare(`
    INSERT INTO cycle_history (user_id, date, total_subjects, total_minutes, status, subjects_text)
    VALUES (?, ?, ?, ?, 'completed', ?)
  `).bind(userId, today, totalSubjects, totalMinutes, subjectsText).run()

  return c.json({ success: true })
})

// 4. SESSÕES & DASHBOARD
app.post('/api/sessions', async (c) => {
  const userId = c.get('userId')
  const { subject_id, topic_id, duration_seconds, questions_total, questions_correct, notes } = await c.req.json()
  const result = await c.env.DB.prepare(`
    INSERT INTO study_sessions 
    (user_id, subject_id, topic_id, duration_seconds, questions_total, questions_correct, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(userId, subject_id, topic_id || null, duration_seconds, questions_total || 0, questions_correct || 0, notes || '').run()
  return c.json({ id: result.meta.last_row_id })
})

// 5. REVISÕES
app.get('/api/revisions', async (c) => {
  const userId = c.get('userId')
  const { results } = await c.env.DB.prepare(`
    SELECT r.*, s.name as subject_name, s.color as subject_color
    FROM revisions r
    JOIN subjects s ON r.subject_id = s.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).bind(userId).all()
  return c.json(results)
})

app.post('/api/revisions', async (c) => {
  const userId = c.get('userId')
  const { subject_id, topic_id, duration_seconds, method, questions_total, questions_correct, notes } = await c.req.json()
  
  const result = await c.env.DB.prepare(`
    INSERT INTO revisions 
    (user_id, subject_id, topic_id, duration_seconds, method, questions_total, questions_correct, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(userId, subject_id, topic_id || null, duration_seconds, method, questions_total || 0, questions_correct || 0, notes || '').run()

  return c.json({ id: result.meta.last_row_id })
})

// STATS ATUALIZADO COM REVISÕES & PLUS METRICS
app.get('/api/stats', async (c) => {
  const userId = c.get('userId')
  const today = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  // 1. Stats de Hoje
  const todaySessions = await c.env.DB.prepare(`
    SELECT SUM(duration_seconds) as total_seconds, COUNT(*) as count 
    FROM study_sessions WHERE date(created_at, '-3 hours') = ? AND user_id = ?
  `).bind(today, userId).first()

  const todayRevisions = await c.env.DB.prepare(`
    SELECT SUM(duration_seconds) as total_seconds, COUNT(*) as count 
    FROM revisions WHERE date(created_at, '-3 hours') = ? AND user_id = ?
  `).bind(today, userId).first()

  const todayStatsCombined = {
    total_seconds: (todaySessions?.total_seconds as number || 0) + (todayRevisions?.total_seconds as number || 0),
    sessions_count: (todaySessions?.count as number || 0) + (todayRevisions?.count as number || 0)
  }

  // 2. Performance (Geral)
  const performance = await c.env.DB.prepare(`
    SELECT 
      s.id, s.name, s.color,
      (SELECT COUNT(*) FROM study_sessions ss WHERE ss.subject_id = s.id) +
      (SELECT COUNT(*) FROM revisions r WHERE r.subject_id = s.id) as total_sessions,
      
      IFNULL((SELECT SUM(duration_seconds) FROM study_sessions ss WHERE ss.subject_id = s.id), 0) +
      IFNULL((SELECT SUM(duration_seconds) FROM revisions r WHERE r.subject_id = s.id), 0) as total_time,
      
      IFNULL((SELECT SUM(questions_total) FROM study_sessions ss WHERE ss.subject_id = s.id), 0) +
      IFNULL((SELECT SUM(questions_total) FROM revisions r WHERE r.subject_id = s.id), 0) as q_total,
      
      IFNULL((SELECT SUM(questions_correct) FROM study_sessions ss WHERE ss.subject_id = s.id), 0) +
      IFNULL((SELECT SUM(questions_correct) FROM revisions r WHERE r.subject_id = s.id), 0) as q_correct
      
    FROM subjects s
    WHERE s.user_id = ?
  `).bind(userId).all()

  // 3. Atividade (Heatmap - Ajustado para BRT)
  const activity = await c.env.DB.prepare(`
    SELECT date(created_at, '-3 hours') as study_date, SUM(duration_seconds) as seconds
    FROM study_sessions
    WHERE date(created_at, '-3 hours') >= date('now', '-30 days') AND user_id = ?
    GROUP BY date(created_at, '-3 hours')
  `).bind(userId).all()

  // 4. Lifetime
  const lifeSessions = await c.env.DB.prepare(`SELECT SUM(duration_seconds) as t FROM study_sessions WHERE user_id = ?`).bind(userId).first()
  const lifeRevisions = await c.env.DB.prepare(`SELECT SUM(duration_seconds) as t FROM revisions WHERE user_id = ?`).bind(userId).first()
  
  const lifetime = {
    total_seconds: (lifeSessions?.t as number || 0) + (lifeRevisions?.t as number || 0)
  }

  // --- DASHBOARD PLUS CALCS (SAFE) ---
  let plusData = null
  try {
    // Tenta buscar metas. Se falhar (coluna não existe), usa default no catch
    let daily_goal = 60
    let weekly_goal = 100
    
    // Tenta ler colunas novas se existirem no objeto de user (não dá pra ler do DB se a coluna não existe na query acima)
    // Mas aqui vamos fazer uma query segura
    // O SQLite não lança erro se selecionarmos colunas que existem. Se não existirem, lança.
    // Vamos assumir que as colunas EXISTEM pois forcei a criação na migração 8.
    const userGoals = await c.env.DB.prepare('SELECT daily_goal_minutes, weekly_goal_questions FROM users WHERE id = ?').bind(userId).first()
    
    if (userGoals) {
        daily_goal = userGoals.daily_goal_minutes || 60
        weekly_goal = userGoals.weekly_goal_questions || 100
    }

    const goals = {
      daily_minutes: daily_goal,
      weekly_questions: weekly_goal,
      today_minutes: Math.floor(todayStatsCombined.total_seconds / 60),
      week_questions_progress: 0 
    }

    // Calcular Streak
    const historyRows = await c.env.DB.prepare(`
      SELECT date(created_at, '-3 hours') as activity_date
      FROM (
        SELECT created_at FROM study_sessions WHERE user_id = ?
        UNION ALL
        SELECT created_at FROM revisions WHERE user_id = ?
      ) 
      GROUP BY activity_date
      ORDER BY activity_date DESC
    `).bind(userId, userId).all()

    let currentStreak = 0
    if (historyRows.results.length > 0) {
        const todayStr = today
        const yesterday = new Date(new Date().getTime() - 27 * 3600000).toISOString().split('T')[0] // Ontem BRT
        
        const lastActivity = historyRows.results[0].activity_date as string
        
        if (lastActivity === todayStr || lastActivity === yesterday) {
            currentStreak = 1
            // Check previous days... simplified for MVP
        }
    }

    // Sugestão
    let suggestion = null
    const perfArr = performance.results as any[]
    let maxScore = -1
    
    perfArr.forEach(s => {
        if (s.q_total < 5) return 
        const acc = s.q_correct / s.q_total
        const score = (1 - acc) * 0.7 + (1 / (s.total_time + 1)) * 0.3
        if (score > maxScore) {
            maxScore = score
            suggestion = { id: s.id, name: s.name, reason: acc < 0.6 ? 'Índice de acertos baixo' : 'Precisa de reforço' }
        }
    })

    plusData = { goals, streak: { current: currentStreak }, suggestion }
  } catch (e) { 
      console.error("Plus calc error (ignoring):", e)
      // Se der erro no plus, retorna null e o front renderiza o básico
  }

  return c.json({
    today: todayStatsCombined,
    performance: performance.results,
    activity: activity.results,
    lifetime: lifetime,
    plus: plusData
  })
})

// 6. PERFIL DE USUÁRIO & GAMIFICAÇÃO
app.get('/api/user/profile', async (c) => {
  const userId = c.get('userId')
  
  // Select seguro (tenta pegar tudo, se falhar pega só o basico)
  // Mas como precisamos de avatar_id, vamos assumir que existe.
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  
  const qStats = await c.env.DB.prepare(`
    SELECT 
      (IFNULL((SELECT SUM(questions_total) FROM study_sessions WHERE user_id = ?), 0) +
       IFNULL((SELECT SUM(questions_total) FROM revisions WHERE user_id = ?), 0)) as total
  `).bind(userId, userId).first()
  
  const totalQuestions = qStats?.total as number || 0
  
  let level = 'Novato'
  let nextLevel = 100
  let progress = 0
  
  if (totalQuestions >= 10000) { level = 'Lenda'; nextLevel = 10000; progress = 100; }
  else if (totalQuestions >= 5000) { level = 'Mestre'; nextLevel = 10000; progress = ((totalQuestions - 5000) / 5000) * 100; }
  else if (totalQuestions >= 2500) { level = 'Elite'; nextLevel = 5000; progress = ((totalQuestions - 2500) / 2500) * 100; }
  else if (totalQuestions >= 1000) { level = 'Veterano'; nextLevel = 2500; progress = ((totalQuestions - 1000) / 1500) * 100; }
  else if (totalQuestions >= 500) { level = 'Praticante'; nextLevel = 1000; progress = ((totalQuestions - 500) / 500) * 100; }
  else if (totalQuestions >= 100) { level = 'Aprendiz'; nextLevel = 500; progress = ((totalQuestions - 100) / 400) * 100; }
  else { progress = (totalQuestions / 100) * 100; }

  return c.json({
    user,
    gamification: {
      total_questions: totalQuestions,
      level,
      next_goal: nextLevel,
      progress: Math.min(Math.round(progress), 100)
    }
  })
})

app.patch('/api/user/profile', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const { nickname, avatar_id, cover_color } = body
  
  const updates = []
  const values = []

  if (nickname !== undefined) { updates.push('nickname = ?'); values.push(nickname); }
  if (avatar_id !== undefined) { updates.push('avatar_id = ?'); values.push(avatar_id); }
  if (cover_color !== undefined) { updates.push('cover_color = ?'); values.push(cover_color); }

  if (updates.length === 0) return c.json({ success: true })

  values.push(userId)
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
  
  await c.env.DB.prepare(query).bind(...values).run()
  
  return c.json({ success: true })
})

app.patch('/api/user/password', async (c) => {
  const userId = c.get('userId')
  const { password } = await c.req.json()
  if(!password || password.length < 6) return c.json({ error: 'Senha deve ter min 6 caracteres' }, 400)
  await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(password, userId).run()
  return c.json({ success: true })
})

app.get('/*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
