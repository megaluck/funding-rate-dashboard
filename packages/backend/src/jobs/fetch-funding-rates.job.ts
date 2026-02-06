import { Queue, Worker, type Job } from 'bullmq';
import { bullMQConnection } from '../cache/redis.js';
import { aggregatorService } from '../services/aggregator.service.js';
import { config } from '../config/index.js';

const QUEUE_NAME = 'funding-rates';

// Create queue
export const fundingRatesQueue = new Queue(QUEUE_NAME, {
  connection: bullMQConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Create worker
export const fundingRatesWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log(`[Job ${job.id}] Fetching funding rates...`);
    const startTime = Date.now();

    try {
      const result = await aggregatorService.fetchAllRates();

      const successCount = result.exchanges.filter((e) => !e.error).length;
      const totalRates = result.rates.length;
      const duration = Date.now() - startTime;

      console.log(
        `[Job ${job.id}] Completed in ${duration}ms: ${successCount}/${result.exchanges.length} exchanges, ${totalRates} rates`
      );

      return {
        success: true,
        exchangeCount: successCount,
        rateCount: totalRates,
        duration,
      };
    } catch (err) {
      console.error(`[Job ${job.id}] Failed:`, err);
      throw err;
    }
  },
  {
    connection: bullMQConnection,
    concurrency: 1, // Only one fetch at a time
  }
);

// Worker event handlers
fundingRatesWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

fundingRatesWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

/**
 * Schedule recurring fetch job
 */
export async function startFetchScheduler(): Promise<void> {
  // Clear existing repeating jobs
  const repeatableJobs = await fundingRatesQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await fundingRatesQueue.removeRepeatableByKey(job.key);
  }

  // Add repeating job
  await fundingRatesQueue.add(
    'fetch-all',
    {},
    {
      repeat: {
        every: config.jobs.fetchIntervalMs,
      },
    }
  );

  // Run initial fetch immediately
  await fundingRatesQueue.add('fetch-all-initial', {});

  console.log(
    `Fetch scheduler started: running every ${config.jobs.fetchIntervalMs / 1000}s`
  );
}

/**
 * Stop the scheduler and worker
 */
export async function stopFetchScheduler(): Promise<void> {
  await fundingRatesWorker.close();
  await fundingRatesQueue.close();
  console.log('Fetch scheduler stopped');
}
