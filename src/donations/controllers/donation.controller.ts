import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DonationService } from '../services/donation.service';
import { CreateCorporateDonationDto, UpdateCorporateDonationDto } from '../dto/corporate-donation.dto';
import { CorporateDonation } from '../entities/corporate-donation.entity';

@ApiTags('donations')
@Controller('donations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  @ApiOperation({
    summary: 'Record corporate donation',
    description: 'Record a donation and calculate 10% tax deduction',
  })
  @ApiResponse({
    status: 201,
    description: 'Donation recorded successfully',
    type: CorporateDonation,
  })
  async recordDonation(@Body() dto: CreateCorporateDonationDto): Promise<CorporateDonation> {
    return await this.donationService.recordDonation(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get donation details',
    description: 'Retrieve details of a specific donation',
  })
  @ApiParam({ name: 'id', description: 'Donation ID' })
  @ApiResponse({
    status: 200,
    description: 'Donation details',
    type: CorporateDonation,
  })
  async getDonation(@Param('id') id: string): Promise<CorporateDonation> {
    return await this.donationService.getDonation(id);
  }

  @Get('business/:businessId')
  @ApiOperation({
    summary: 'Get all donations for a business',
    description: 'Retrieve all donations for a specific business',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiQuery({ name: 'taxYear', description: 'Filter by tax year', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of donations',
    type: [CorporateDonation],
  })
  async getBusinessDonations(
    @Param('businessId') businessId: string,
    @Query('taxYear') taxYear?: number,
  ): Promise<CorporateDonation[]> {
    return await this.donationService.getBusinessDonations(businessId, taxYear ? Number(taxYear) : undefined);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update donation',
    description: 'Update donation details (only if no deductions claimed)',
  })
  @ApiParam({ name: 'id', description: 'Donation ID' })
  @ApiResponse({
    status: 200,
    description: 'Donation updated successfully',
    type: CorporateDonation,
  })
  async updateDonation(
    @Param('id') id: string,
    @Body() dto: UpdateCorporateDonationDto,
  ): Promise<CorporateDonation> {
    return await this.donationService.updateDonation(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete donation',
    description: 'Delete a donation (only if no deductions claimed)',
  })
  @ApiParam({ name: 'id', description: 'Donation ID' })
  @ApiResponse({
    status: 200,
    description: 'Donation deleted successfully',
  })
  async deleteDonation(@Param('id') id: string): Promise<{ message: string }> {
    await this.donationService.deleteDonation(id);
    return { message: 'Donation deleted successfully' };
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve donation (Admin only)',
    description: 'Approve a donation for tax deduction',
  })
  @ApiParam({ name: 'id', description: 'Donation ID' })
  @ApiResponse({
    status: 200,
    description: 'Donation approved successfully',
    type: CorporateDonation,
  })
  async approveDonation(@Param('id') id: string): Promise<CorporateDonation> {
    return await this.donationService.approveDonation(id);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject donation (Admin only)',
    description: 'Reject a donation with reason',
  })
  @ApiParam({ name: 'id', description: 'Donation ID' })
  @ApiResponse({
    status: 200,
    description: 'Donation rejected successfully',
    type: CorporateDonation,
  })
  async rejectDonation(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<CorporateDonation> {
    return await this.donationService.rejectDonation(id, body.reason);
  }

  @Get('business/:businessId/deduction')
  @ApiOperation({
    summary: 'Calculate total donation deduction',
    description: 'Calculate 10% deduction for all approved donations in a tax year',
  })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiQuery({ name: 'taxYear', description: 'Tax year', required: true })
  @ApiResponse({
    status: 200,
    description: 'Deduction calculation',
  })
  async calculateDeduction(
    @Param('businessId') businessId: string,
    @Query('taxYear') taxYear: number,
  ): Promise<{
    totalDonations: number;
    totalDeduction: number;
    donations: CorporateDonation[];
  }> {
    return await this.donationService.calculate10PercentDeduction(businessId, Number(taxYear));
  }
}

