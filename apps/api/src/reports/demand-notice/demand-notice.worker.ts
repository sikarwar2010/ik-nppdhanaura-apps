import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { Worker } from "bullmq"

import {
  closeRedisConnection,
  createBullMqConnection,
} from "../../common/redis.client"
import { DEMAND_NOTICE_QUEUE } from "./demand-notice.constants"
import { DemandNoticeService } from "./demand-notice.service"

@Injectable()
export class DemandNoticeWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DemandNoticeWorker.name)
  private worker: Worker | null = null
  private connection: ReturnType<typeof createBullMqConnection> | null = null

  constructor(private readonly demandNotices: DemandNoticeService) {}

  onModuleInit() {
    try {
      this.connection = createBullMqConnection()
      this.worker = new Worker(
        DEMAND_NOTICE_QUEUE,
        async (job) => {
          const jobId = job.data.jobId as string
          this.logger.log(`Processing demand notice export ${jobId}`)
          await this.demandNotices.processJob(jobId)
        },
        { connection: this.connection }
      )
      this.worker.on("failed", (job, err) => {
        this.logger.error(
          `Demand notice job ${job?.id} failed: ${err.message}`
        )
      })
    } catch (err) {
      this.logger.warn(
        `Demand notice worker not started: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
  }

  async onModuleDestroy() {
    await this.worker?.close().catch(() => undefined)
    if (!this.connection) return
    const current = this.connection
    this.connection = null
    await closeRedisConnection(current)
  }
}
