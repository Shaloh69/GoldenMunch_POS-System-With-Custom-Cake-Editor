import * as cron from 'node-cron';
import { emailService } from './email.service';

class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all scheduled jobs
   */
  initialize(): void {
    console.log('🕐 Initializing scheduler service...');

    // Process pending email notifications every 5 minutes
    this.scheduleJob(
      'processPendingEmails',
      '*/5 * * * *', // Every 5 minutes
      async () => {
        console.log('📧 Processing pending email notifications...');
        await emailService.processPendingNotifications();
      }
    );

    // Retry failed notifications every hour
    this.scheduleJob(
      'retryFailedEmails',
      '0 * * * *', // Every hour
      async () => {
        console.log('🔄 Retrying failed email notifications...');
        await emailService.retryFailedNotifications();
      }
    );

    // Send pickup reminders daily at 9:00 AM
    this.scheduleJob(
      'sendPickupReminders',
      '0 9 * * *', // Every day at 9:00 AM
      async () => {
        console.log('📅 Sending pickup reminders for tomorrow...');
        await emailService.sendPickupReminders();
      }
    );

    // Additional reminder in the evening at 6:00 PM
    this.scheduleJob(
      'sendEveningReminders',
      '0 18 * * *', // Every day at 6:00 PM
      async () => {
        console.log('📅 Sending evening pickup reminders...');
        await emailService.sendPickupReminders();
      }
    );

    console.log('✅ Scheduler service initialized with', this.jobs.size, 'jobs');
  }

  /**
   * Schedule a new cron job
   */
  private scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    try {
      const job = cron.schedule(schedule, async () => {
        try {
          await task();
        } catch (error) {
          console.error(`Error executing scheduled job "${name}":`, error);
        }
      });

      this.jobs.set(name, job);
      console.log(`✅ Scheduled job "${name}" with pattern: ${schedule}`);
    } catch (error) {
      console.error(`❌ Failed to schedule job "${name}":`, error);
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`🛑 Stopped job: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    console.log('🛑 Stopping all scheduled jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get status of all jobs
   */
  getStatus(): { name: string; running: boolean }[] {
    const status: { name: string; running: boolean }[] = [];
    this.jobs.forEach((job, name) => {
      status.push({
        name,
        running: true, // If it's in the map, it's running
      });
    });
    return status;
  }

  /**
   * Manually trigger a job (for testing)
   */
  async triggerJob(name: string): Promise<boolean> {
    const job = this.jobs.get(name);
    if (!job) {
      console.error(`Job "${name}" not found`);
      return false;
    }

    console.log(`🔧 Manually triggering job: ${name}`);

    try {
      switch (name) {
        case 'processPendingEmails':
          await emailService.processPendingNotifications();
          break;
        case 'retryFailedEmails':
          await emailService.retryFailedNotifications();
          break;
        case 'sendPickupReminders':
        case 'sendEveningReminders':
          await emailService.sendPickupReminders();
          break;
        default:
          console.error(`Unknown job: ${name}`);
          return false;
      }
      return true;
    } catch (error) {
      console.error(`Error triggering job "${name}":`, error);
      return false;
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
