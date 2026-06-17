import cron from 'node-cron'
import dayjs from 'dayjs'
import { taskQueries, participantQueries } from '../db/database.js'

export function startTaskExpireCron(): void {
  cron.schedule('0 0 0 * * *', async () => {
    try {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const expiredTasks = taskQueries.findExpired(now)

      for (const task of expiredTasks) {
        taskQueries.updateStatus(task.id, 'expired')
        participantQueries.expireByTask(task.id)
      }

      if (expiredTasks.length > 0) {
        console.log(`[Cron] 已处理 ${expiredTasks.length} 个过期任务`)
      }
    } catch (error) {
      console.error('[Cron] 任务过期处理失败:', error)
    }
  })

  console.log('[Cron] 任务过期定时任务已启动，每天 00:00 执行')
}
