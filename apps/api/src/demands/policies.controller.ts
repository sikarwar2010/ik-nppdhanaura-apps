import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common"

import {
  CurrentUser,
  RequirePermission,
  type AuthUser,
} from "../auth/auth.decorators"
import { PreviewInputError, previewCharges } from "./charge-preview"
import {
  ChargePreviewDto,
  CreateAssessmentYearDto,
  PenaltyPolicyDto,
  PolicyActionDto,
  RebatePolicyDto,
  UpdateAssessmentYearDto,
  UpsertAssessmentYearDto,
} from "./dto/policies.dto"
import { PoliciesService } from "./policies.service"

@Controller("api/v1")
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get("assessment-years")
  @RequirePermission("report:read")
  async listYears() {
    const data = await this.policies.listYears()
    return { success: true, data }
  }

  @Post("assessment-years")
  @RequirePermission("settings:update")
  async createYear(
    @Body() dto: UpsertAssessmentYearDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.policies.upsertYear(dto, user.id)
    return { success: true, data }
  }

  @Patch("assessment-years/:referenceEntryId")
  @RequirePermission("settings:update")
  async updateYear(
    @Param("referenceEntryId") referenceEntryId: string,
    @Body() dto: UpdateAssessmentYearDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.policies.updateYear(referenceEntryId, dto, user.id)
    return { success: true, data }
  }

  @Get("rebate-policies")
  @RequirePermission("report:read")
  async listRebates(@Query("assessmentYearId") assessmentYearId?: string) {
    const data = await this.policies.listRebates(assessmentYearId)
    return { success: true, data }
  }

  @Post("rebate-policies")
  @RequirePermission("settings:update")
  async createRebate(
    @Body() dto: RebatePolicyDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.policies.createRebate(dto, user.id)
    return { success: true, data }
  }

  @Patch("rebate-policies/:id")
  @RequirePermission("settings:update")
  async updateRebate(
    @Param("id") id: string,
    @Body() dto: RebatePolicyDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.policies.updateRebate(id, dto, user.id)
    return { success: true, data }
  }

  @Post("rebate-policies/:id/activate")
  @RequirePermission("settings:update")
  async activateRebate(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body?: PolicyActionDto
  ) {
    const data = await this.policies.activateRebate(id, user.id, body?.reason)
    return { success: true, data }
  }

  @Get("penalty-policies")
  @RequirePermission("report:read")
  async listPenalties(@Query("assessmentYearId") assessmentYearId?: string) {
    const data = await this.policies.listPenalties(assessmentYearId)
    return { success: true, data }
  }

  @Post("penalty-policies")
  @RequirePermission("settings:update")
  async createPenalty(
    @Body() dto: PenaltyPolicyDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.policies.createPenalty(dto, user.id)
    return { success: true, data }
  }

  @Patch("penalty-policies/:id")
  @RequirePermission("settings:update")
  async updatePenalty(
    @Param("id") id: string,
    @Body() dto: PenaltyPolicyDto,
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.policies.updatePenalty(id, dto, user.id)
    return { success: true, data }
  }

  @Post("penalty-policies/:id/activate")
  @RequirePermission("settings:update")
  async activatePenalty(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body?: PolicyActionDto
  ) {
    const data = await this.policies.activatePenalty(id, user.id, body?.reason)
    return { success: true, data }
  }

  @Post("rebate-policies/:id/archive")
  @RequirePermission("settings:update")
  async archiveRebate(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body?: PolicyActionDto
  ) {
    const data = await this.policies.archivePolicy("rebate", id, user.id, body?.reason)
    return { success: true, data }
  }

  @Post("penalty-policies/:id/archive")
  @RequirePermission("settings:update")
  async archivePenalty(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body?: PolicyActionDto
  ) {
    const data = await this.policies.archivePolicy("penalty", id, user.id, body?.reason)
    return { success: true, data }
  }

  /** Rule preview: same engine as demand publication; nothing is saved. */
  @Post("tax-admin/preview")
  @RequirePermission("report:read")
  preview(@Body() dto: ChargePreviewDto) {
    try {
      const data = previewCharges(
        {
          kind: dto.kind,
          taxCategory: dto.taxCategory,
          type: dto.type,
          rate: dto.rate,
          fixedAmount: dto.fixedAmount,
          maxAmount: dto.maxAmount,
          includeArrears: dto.includeArrears,
          includePenalty: dto.includePenalty,
          applyAfterRebate: dto.applyAfterRebate,
          trigger: dto.trigger,
          dueDate: dto.dueDate,
          graceDays: dto.graceDays,
        },
        {
          propertyTax: dto.sample.propertyTax ?? "0",
          waterTax: dto.sample.waterTax ?? "0",
          drainageTax: dto.sample.drainageTax ?? "0",
          previousPropertyTax: dto.sample.previousPropertyTax ?? "0",
          previousWaterTax: dto.sample.previousWaterTax ?? "0",
          previousDrainageTax: dto.sample.previousDrainageTax ?? "0",
          alreadyPaid: dto.sample.alreadyPaid ?? "0",
          asOf: dto.sample.asOf,
        }
      )
      return { success: true, data }
    } catch (error) {
      if (error instanceof PreviewInputError) {
        throw new BadRequestException({ code: error.code, message: error.message })
      }
      throw error
    }
  }

  @Post("assessment-years/new")
  @RequirePermission("settings:update")
  async createNewYear(@Body() dto: CreateAssessmentYearDto, @CurrentUser() user: AuthUser) {
    const data = await this.policies.createYear(dto, user.id)
    return { success: true, data }
  }
}
