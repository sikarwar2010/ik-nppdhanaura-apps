import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common"

import {
  CurrentUser,
  RequirePermission,
  type AuthUser,
} from "../auth/auth.decorators"
import {
  PenaltyPolicyDto,
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
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.policies.activateRebate(id, user.id)
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
    @CurrentUser() user: AuthUser
  ) {
    const data = await this.policies.activatePenalty(id, user.id)
    return { success: true, data }
  }
}
