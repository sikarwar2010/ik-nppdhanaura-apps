import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { Worker } from "bullmq"
import IORedis from "ioredis"

import { DEMAND_NOTICE_QUEUE } from "./demand-notice.constants"
import { DemandNoticeService } from "./demand-notice.service"

@Injectable()
export class DemandNoticeWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DemandNoticeWorker.name)
  private worker: Worker | null = null

  constructor(private readonly demandNotices: DemandNoticeService) {}

  onModuleInit() {
    try {
      const connection = new IORedis(
        process.env.REDIS_URL ?? "redis://localhost:6379",
        { maxRetriesPerRequest: null }
      )
      this.worker = new Worker(
        DEMAND_NOTICE_QUEUE,
        async (job) => {
          const jobId = job.data.jobId as string
          this.logger.log(`Processing demand notice export ${jobId}`)
          await this.demandNotices.processJob(jobId)
        },
        { connection }
      )
      this.worker.on("failed", (job, err) => {
        this.logger.error(
          `Demand notice job ${job?.id} failed: ${err.message}`
        )
      })
    } catch (err) {
      this.logger.warn(`Demand notice worker not started: ${String(err)}`)
    }
  }

  async onModuleDestroy() {
    await this.worker?.close()
  }
}
