import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { Worker } from "bullmq"

import {
  closeRedisConnection,
  createBullMqConnection,
} from "../common/redis.client"
import { ImportsService } from "./imports.service"

@Injectable()
export class ImportWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImportWorker.name)
  private worker: Worker | null = null
  private connection: ReturnType<typeof createBullMqConnection> | null = null

  constructor(private readonly importsService: ImportsService) {}

  onModuleInit() {
    try {
      this.connection = createBullMqConnection()
      this.worker = new Worker(
        "survey-import",
        async (job) => {
          const jobId = job.data.jobId as string
          this.logger.log(`Processing import ${jobId}`)
          await this.importsService.processJob(jobId)
        },
        { connection: this.connection }
      )
      this.worker.on("failed", (job, err) => {
        this.logger.error(`Import job ${job?.id} failed: ${err.message}`)
      })
    } catch (err) {
      this.logger.warn(
        `Import worker not started: ${
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
