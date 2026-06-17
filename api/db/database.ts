import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import bcrypt from 'bcryptjs'
import dayjs from 'dayjs'
import type {
  User,
  Task,
  TaskParticipant,
  ProofSubmission,
  TaskWithPublisher,
  ParticipantWithDetails,
  ProofWithDetails,
  UserRole,
  TaskStatus,
  ParticipantStatus,
  ProofStatus,
} from './types.js'

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null
let db: SqlJsDatabase | null = null

function rowToObject<T>(columns: string[], values: unknown[]): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((col, idx) => {
    obj[col] = values[idx]
  })
  return obj as T
}

function execQuery<T>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error('Database not initialized')
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results: T[] = []
  while (stmt.step()) {
    results.push(rowToObject<T>(stmt.getColumnNames(), stmt.get()))
  }
  stmt.free()
  return results
}

function runQuery(sql: string, params: unknown[] = []): number {
  if (!db) throw new Error('Database not initialized')
  db.run(sql, params)
  return db.getRowsModified()
}

function getOne<T>(sql: string, params: unknown[] = []): T | null {
  const results = execQuery<T>(sql, params)
  return results.length > 0 ? results[0] : null
}

function getLastInsertId(): number {
  const result = getOne<{ id: number }>('SELECT last_insert_rowid() as id')
  return result?.id ?? 0
}

export async function initDatabase(): Promise<void> {
  if (db) return

  SQL = await initSqlJs()
  db = new SQL.Database()

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      points INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      deadline DATETIME NOT NULL,
      required_people INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      publisher_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (publisher_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS task_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'joined',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (task_id, user_id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS proof_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      proof_content TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      reject_reason TEXT,
      reviewer_id INTEGER,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (participant_id) REFERENCES task_participants(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    )
  `)

  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)')
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)')
  db.run('CREATE INDEX IF NOT EXISTS idx_participants_user ON task_participants(user_id, status)')
  db.run('CREATE INDEX IF NOT EXISTS idx_proofs_status ON proof_submissions(status)')

  const adminHash = await bcrypt.hash('admin123', 10)
  db.run(
    'INSERT OR IGNORE INTO users (username, password_hash, role, points) VALUES (?, ?, ?, ?)',
    ['admin', adminHash, 'admin', 0],
  )

  const user1Hash = await bcrypt.hash('user123', 10)
  db.run(
    'INSERT OR IGNORE INTO users (username, password_hash, role, points) VALUES (?, ?, ?, ?)',
    ['user1', user1Hash, 'user', 100],
  )
  db.run(
    'INSERT OR IGNORE INTO users (username, password_hash, role, points) VALUES (?, ?, ?, ?)',
    ['user2', user1Hash, 'user', 50],
  )

  const now = dayjs()
  const sampleTasks = [
    {
      title: '社区垃圾分类宣传活动',
      description: '在社区内进行垃圾分类知识宣传，发放宣传手册，帮助居民了解分类标准。需要有耐心，善于沟通。',
      deadline: now.add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
      required_people: 5,
      status: 'open' as TaskStatus,
    },
    {
      title: '图书馆书籍整理志愿',
      description: '协助图书馆管理员整理书籍、归类上架、维护阅览室秩序。需要细心，有责任感。',
      deadline: now.add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      required_people: 3,
      status: 'open' as TaskStatus,
    },
    {
      title: '敬老院探访陪伴活动',
      description: '前往敬老院陪伴老人聊天、表演节目，给老人们带去温暖和欢乐。',
      deadline: now.add(14, 'day').format('YYYY-MM-DD HH:mm:ss'),
      required_people: 8,
      status: 'open' as TaskStatus,
    },
    {
      title: '公园环境清洁行动',
      description: '清理公园内的垃圾，维护公共环境整洁。自带手套和垃圾袋。',
      deadline: now.add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      required_people: 10,
      status: 'in_progress' as TaskStatus,
    },
    {
      title: '义务辅导小学生作业',
      description: '为社区贫困家庭小学生提供课后作业辅导，科目不限。',
      deadline: now.add(30, 'day').format('YYYY-MM-DD HH:mm:ss'),
      required_people: 4,
      status: 'open' as TaskStatus,
    },
  ]

  for (const task of sampleTasks) {
    const existing = getOne<{ id: number }>('SELECT id FROM tasks WHERE title = ?', [task.title])
    if (!existing) {
      runQuery(
        'INSERT INTO tasks (title, description, deadline, required_people, status, publisher_id) VALUES (?, ?, ?, ?, ?, ?)',
        [task.title, task.description, task.deadline, task.required_people, task.status, 1],
      )
    }
  }

  const user1 = getOne<User>('SELECT id FROM users WHERE username = ?', ['user1'])
  if (user1) {
    const participantExists = getOne<{ id: number }>(
      'SELECT id FROM task_participants WHERE task_id = 4 AND user_id = ?',
      [user1.id],
    )
    if (!participantExists) {
      runQuery(
        'INSERT INTO task_participants (task_id, user_id, status) VALUES (?, ?, ?)',
        [4, user1.id, 'joined'],
      )
    }
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export const userQueries = {
  findByUsername(username: string): User | null {
    return getOne<User>('SELECT * FROM users WHERE username = ?', [username])
  },

  findById(id: number): User | null {
    return getOne<User>('SELECT * FROM users WHERE id = ?', [id])
  },

  create(username: string, passwordHash: string, role: UserRole = 'user'): User | null {
    runQuery(
      'INSERT INTO users (username, password_hash, role, points) VALUES (?, ?, ?, ?)',
      [username, passwordHash, role, 0],
    )
    const id = getLastInsertId()
    return userQueries.findById(id)
  },

  updatePoints(userId: number, points: number): void {
    runQuery('UPDATE users SET points = points + ? WHERE id = ?', [points, userId])
  },

  getAll(): User[] {
    return execQuery<User>('SELECT id, username, role, points, created_at FROM users ORDER BY id')
  },
}

export const taskQueries = {
  findAll(status?: TaskStatus, page: number = 1, pageSize: number = 10): TaskWithPublisher[] {
    const offset = (page - 1) * pageSize
    let sql = `
      SELECT t.*, u.username as publisher_username,
             (SELECT COUNT(*) FROM task_participants tp WHERE tp.task_id = t.id) as participant_count
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
    `
    const params: unknown[] = []
    if (status) {
      sql += ' WHERE t.status = ?'
      params.push(status)
    }
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?'
    params.push(pageSize, offset)
    return execQuery<TaskWithPublisher>(sql, params)
  },

  countAll(status?: TaskStatus): number {
    let sql = 'SELECT COUNT(*) as count FROM tasks'
    const params: unknown[] = []
    if (status) {
      sql += ' WHERE status = ?'
      params.push(status)
    }
    const result = getOne<{ count: number }>(sql, params)
    return result?.count ?? 0
  },

  findById(id: number): TaskWithPublisher | null {
    return getOne<TaskWithPublisher>(
      `
      SELECT t.*, u.username as publisher_username,
             (SELECT COUNT(*) FROM task_participants tp WHERE tp.task_id = t.id) as participant_count
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
      WHERE t.id = ?
      `,
      [id],
    )
  },

  findByPublisher(publisherId: number): TaskWithPublisher[] {
    return execQuery<TaskWithPublisher>(
      `
      SELECT t.*, u.username as publisher_username,
             (SELECT COUNT(*) FROM task_participants tp WHERE tp.task_id = t.id) as participant_count
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
      WHERE t.publisher_id = ?
      ORDER BY t.created_at DESC
      `,
      [publisherId],
    )
  },

  findByParticipant(userId: number): TaskWithPublisher[] {
    return execQuery<TaskWithPublisher>(
      `
      SELECT t.*, u.username as publisher_username,
             (SELECT COUNT(*) FROM task_participants tp WHERE tp.task_id = t.id) as participant_count
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
      INNER JOIN task_participants tp ON t.id = tp.task_id
      WHERE tp.user_id = ?
      ORDER BY tp.joined_at DESC
      `,
      [userId],
    )
  },

  create(data: {
    title: string
    description: string
    deadline: string
    required_people: number
    publisher_id: number
  }): TaskWithPublisher | null {
    runQuery(
      'INSERT INTO tasks (title, description, deadline, required_people, publisher_id) VALUES (?, ?, ?, ?, ?)',
      [data.title, data.description, data.deadline, data.required_people, data.publisher_id],
    )
    const id = getLastInsertId()
    return taskQueries.findById(id)
  },

  updateStatus(id: number, status: TaskStatus): void {
    runQuery('UPDATE tasks SET status = ? WHERE id = ?', [status, id])
  },

  findExpired(now: string): Task[] {
    return execQuery<Task>(
      `
      SELECT * FROM tasks
      WHERE status IN ('open', 'in_progress') AND deadline < ?
      `,
      [now],
    )
  },
}

export const participantQueries = {
  findByTaskAndUser(taskId: number, userId: number): TaskParticipant | null {
    return getOne<TaskParticipant>(
      'SELECT * FROM task_participants WHERE task_id = ? AND user_id = ?',
      [taskId, userId],
    )
  },

  findById(id: number): TaskParticipant | null {
    return getOne<TaskParticipant>('SELECT * FROM task_participants WHERE id = ?', [id])
  },

  findByUser(userId: number): ParticipantWithDetails[] {
    return execQuery<ParticipantWithDetails>(
      `
      SELECT tp.*, u.username, t.title as task_title
      FROM task_participants tp
      LEFT JOIN users u ON tp.user_id = u.id
      LEFT JOIN tasks t ON tp.task_id = t.id
      WHERE tp.user_id = ?
      ORDER BY tp.joined_at DESC
      `,
      [userId],
    )
  },

  findByTask(taskId: number): ParticipantWithDetails[] {
    return execQuery<ParticipantWithDetails>(
      `
      SELECT tp.*, u.username, t.title as task_title
      FROM task_participants tp
      LEFT JOIN users u ON tp.user_id = u.id
      LEFT JOIN tasks t ON tp.task_id = t.id
      WHERE tp.task_id = ?
      ORDER BY tp.joined_at DESC
      `,
      [taskId],
    )
  },

  create(taskId: number, userId: number): TaskParticipant | null {
    runQuery(
      'INSERT INTO task_participants (task_id, user_id, status) VALUES (?, ?, ?)',
      [taskId, userId, 'joined'],
    )
    const id = getLastInsertId()
    return getOne<TaskParticipant>('SELECT * FROM task_participants WHERE id = ?', [id])
  },

  updateStatus(id: number, status: ParticipantStatus): void {
    runQuery('UPDATE task_participants SET status = ? WHERE id = ?', [status, id])
  },

  countByTask(taskId: number): number {
    const result = getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM task_participants WHERE task_id = ?',
      [taskId],
    )
    return result?.count ?? 0
  },

  countCompletedByTask(taskId: number): number {
    const result = getOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM task_participants WHERE task_id = ? AND status = 'completed'",
      [taskId],
    )
    return result?.count ?? 0
  },

  expireByTask(taskId: number): void {
    runQuery(
      "UPDATE task_participants SET status = 'expired' WHERE task_id = ? AND status IN ('joined', 'submitted')",
      [taskId],
    )
  },

  countActiveByUser(userId: number): number {
    const result = getOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM task_participants WHERE user_id = ? AND status IN ('joined', 'submitted')",
      [userId],
    )
    return result?.count ?? 0
  },
}

export const proofQueries = {
  findAll(status?: ProofStatus): ProofWithDetails[] {
    let sql = `
      SELECT ps.*,
             u.id as user_id, u.username as user_username, u.role as user_role, u.points as user_points,
             t.id as task_id, t.title as task_title, t.description as task_description,
             ru.id as reviewer_id, ru.username as reviewer_username
      FROM proof_submissions ps
      LEFT JOIN task_participants tp ON ps.participant_id = tp.id
      LEFT JOIN users u ON tp.user_id = u.id
      LEFT JOIN tasks t ON tp.task_id = t.id
      LEFT JOIN users ru ON ps.reviewer_id = ru.id
    `
    const params: unknown[] = []
    if (status) {
      sql += ' WHERE ps.status = ?'
      params.push(status)
    }
    sql += ' ORDER BY ps.submitted_at DESC'
    const rows = execQuery<any>(sql, params)
    return rows.map(row => ({
      id: row.id,
      participant_id: row.participant_id,
      proof_content: row.proof_content,
      status: row.status,
      reject_reason: row.reject_reason,
      reviewer_id: row.reviewer_id,
      submitted_at: row.submitted_at,
      reviewed_at: row.reviewed_at,
      user: row.user_id ? {
        id: row.user_id,
        username: row.user_username,
        role: row.user_role,
        points: row.user_points,
      } : undefined,
      task: row.task_id ? {
        id: row.task_id,
        title: row.task_title,
        description: row.task_description,
      } : undefined,
      reviewer: row.reviewer_id ? {
        id: row.reviewer_id,
        username: row.reviewer_username,
      } : undefined,
    })) as ProofWithDetails[]
  },

  findById(id: number): ProofWithDetails | null {
    const row = getOne<any>(
      `
      SELECT ps.*,
             u.id as user_id, u.username as user_username, u.role as user_role, u.points as user_points,
             t.id as task_id, t.title as task_title, t.description as task_description,
             ru.id as reviewer_id, ru.username as reviewer_username
      FROM proof_submissions ps
      LEFT JOIN task_participants tp ON ps.participant_id = tp.id
      LEFT JOIN users u ON tp.user_id = u.id
      LEFT JOIN tasks t ON tp.task_id = t.id
      LEFT JOIN users ru ON ps.reviewer_id = ru.id
      WHERE ps.id = ?
      `,
      [id],
    )
    if (!row) return null
    return {
      id: row.id,
      participant_id: row.participant_id,
      proof_content: row.proof_content,
      status: row.status,
      reject_reason: row.reject_reason,
      reviewer_id: row.reviewer_id,
      submitted_at: row.submitted_at,
      reviewed_at: row.reviewed_at,
      user: row.user_id ? {
        id: row.user_id,
        username: row.user_username,
        role: row.user_role,
        points: row.user_points,
      } : undefined,
      task: row.task_id ? {
        id: row.task_id,
        title: row.task_title,
        description: row.task_description,
      } : undefined,
      reviewer: row.reviewer_id ? {
        id: row.reviewer_id,
        username: row.reviewer_username,
      } : undefined,
    } as ProofWithDetails
  },

  findByParticipant(participantId: number): ProofWithDetails | null {
    const row = getOne<any>(
      `
      SELECT ps.*,
             u.id as user_id, u.username as user_username, u.role as user_role, u.points as user_points,
             t.id as task_id, t.title as task_title, t.description as task_description,
             ru.id as reviewer_id, ru.username as reviewer_username
      FROM proof_submissions ps
      LEFT JOIN task_participants tp ON ps.participant_id = tp.id
      LEFT JOIN users u ON tp.user_id = u.id
      LEFT JOIN tasks t ON tp.task_id = t.id
      LEFT JOIN users ru ON ps.reviewer_id = ru.id
      WHERE ps.participant_id = ?
      ORDER BY ps.submitted_at DESC
      LIMIT 1
      `,
      [participantId],
    )
    if (!row) return null
    return {
      id: row.id,
      participant_id: row.participant_id,
      proof_content: row.proof_content,
      status: row.status,
      reject_reason: row.reject_reason,
      reviewer_id: row.reviewer_id,
      submitted_at: row.submitted_at,
      reviewed_at: row.reviewed_at,
      user: row.user_id ? {
        id: row.user_id,
        username: row.user_username,
        role: row.user_role,
        points: row.user_points,
      } : undefined,
      task: row.task_id ? {
        id: row.task_id,
        title: row.task_title,
        description: row.task_description,
      } : undefined,
      reviewer: row.reviewer_id ? {
        id: row.reviewer_id,
        username: row.reviewer_username,
      } : undefined,
    } as ProofWithDetails
  },

  create(participantId: number, proofContent: string): ProofSubmission | null {
    runQuery(
      'INSERT INTO proof_submissions (participant_id, proof_content, status) VALUES (?, ?, ?)',
      [participantId, proofContent, 'pending'],
    )
    const id = getLastInsertId()
    return getOne<ProofSubmission>('SELECT * FROM proof_submissions WHERE id = ?', [id])
  },

  review(
    id: number,
    approved: boolean,
    reviewerId: number,
    rejectReason?: string,
  ): void {
    const status: ProofStatus = approved ? 'approved' : 'rejected'
    const reviewedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    runQuery(
      'UPDATE proof_submissions SET status = ?, reject_reason = ?, reviewer_id = ?, reviewed_at = ? WHERE id = ?',
      [status, rejectReason ?? null, reviewerId, reviewedAt, id],
    )
  },
}

export { rowToObject, execQuery, runQuery, getOne, getLastInsertId }
