import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { TaxReturnService } from "../services/tax-return.service";
import { PdfGeneratorService } from "../services/pdf-generator.service";
import { TaxReturn } from "../entities/tax-return.entity";
import { TaxType } from "../../tax-calculation/entities/tax-calculation.entity";
import { User } from "../../users/entities/user.entity";
import * as fs from "fs";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("Tax Returns")
@Controller("tax-returns")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TaxReturnController extends BaseController {
  constructor(
    private readonly taxReturnService: TaxReturnService,
    private readonly pdfGeneratorService: PdfGeneratorService
  ) {
    super();
  }

  @Post("generate")
  @ApiOperation({
    summary: "Generate a new tax return",
    description:
      "Generates a FIRS-compliant tax return by aggregating all income records, deductions, reliefs, and supporting documents " +
      "for a specific tax year. Automatically calculates total income, taxable income, tax liability, and identifies missing " +
      "documentation. Returns a draft tax return that can be reviewed, updated, and submitted to FIRS. Supports all tax types: " +
      "PIT (Personal Income Tax), CIT (Company Income Tax), CGT (Capital Gains Tax), and VAT.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        taxYear: {
          type: "number",
          description: "Tax year for the return",
          example: 2026,
        },
        taxType: {
          type: "string",
          enum: ["PIT", "CIT", "CGT", "VAT"],
          description: "Type of tax return to generate",
          example: "PIT",
        },
        businessId: {
          type: "string",
          description: "Business ID for CIT returns (optional for PIT)",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
      required: ["taxYear", "taxType"],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      "Tax return generated successfully with calculation breakdown and documentation status",
    type: TaxReturn,
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid tax year, tax type, or missing required business ID for CIT",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "No income records found for the specified tax year",
  })
  async generateTaxReturn(
    @CurrentUser() user: User,
    @Body() body: { taxYear: number; taxType: TaxType; businessId?: string }
  ): Promise<TaxReturn> {
    return await this.taxReturnService.generateTaxReturn(
      user.id,
      body.taxYear,
      body.taxType,
      body.businessId
    );
  }

  @Get()
  @ApiOperation({
    summary: "Get all tax returns for current user",
    description:
      "Retrieves all tax returns (draft and filed) for the authenticated user across all tax years. " +
      "Returns returns sorted by tax year (most recent first) with complete calculation details, " +
      "filing status, FIRS reference numbers (if submitted), and documentation completeness status. " +
      "Useful for viewing tax filing history and tracking submission status.",
  })
  @ApiResponse({
    status: 200,
    description: "List of tax returns retrieved successfully",
    type: [TaxReturn],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  async getUserTaxReturns(@CurrentUser() user: User): Promise<TaxReturn[]> {
    return await this.taxReturnService.getUserTaxReturns(user.id);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a specific tax return by ID",
    description:
      "Retrieves detailed information for a specific tax return including all income sources, " +
      "deductions, reliefs, tax calculations, supporting documents, and filing status. " +
      "Shows complete breakdown of total income, taxable income, tax liability, and any credits applied. " +
      "Includes FIRS reference number if the return has been submitted.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the tax return",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Tax return details retrieved successfully",
    type: TaxReturn,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Tax return not found",
  })
  async getTaxReturn(@Param("id") id: string): Promise<TaxReturn> {
    return await this.taxReturnService.getTaxReturn(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a draft tax return",
    description:
      "Updates tax return details for draft returns only. Submitted/filed returns cannot be modified. " +
      "Allows updating calculation details, adding/removing income sources, adjusting deductions and reliefs, " +
      "and modifying metadata. After updates, the return must be re-validated before submission. " +
      "Common use case: correcting errors or adding missing information before filing with FIRS.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the tax return",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        totalIncome: {
          type: "number",
          description: "Updated total income amount",
          example: 5000000,
        },
        taxableIncome: {
          type: "number",
          description: "Updated taxable income after deductions",
          example: 4200000,
        },
        taxLiability: {
          type: "number",
          description: "Updated tax liability",
          example: 630000,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Tax return updated successfully",
    type: TaxReturn,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid update data or attempting to update a filed return",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Tax return not found",
  })
  @ApiResponse({
    status: 409,
    description:
      "Cannot update a return that has already been submitted to FIRS",
  })
  async updateTaxReturn(
    @Param("id") id: string,
    @Body() updates: Partial<TaxReturn>
  ): Promise<TaxReturn> {
    return await this.taxReturnService.updateTaxReturn(id, updates);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a draft tax return",
    description:
      "Permanently deletes a draft tax return. Only draft returns can be deleted - submitted/filed returns " +
      "cannot be deleted to maintain audit trail and compliance with FIRS regulations. " +
      "Use this to remove incorrect or duplicate draft returns before filing. " +
      "Warning: This action cannot be undone.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the tax return to delete",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Tax return deleted successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Tax return deleted successfully",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Tax return not found",
  })
  @ApiResponse({
    status: 409,
    description:
      "Cannot delete a return that has already been submitted to FIRS",
  })
  async deleteTaxReturn(@Param("id") id: string): Promise<{ message: string }> {
    await this.taxReturnService.deleteTaxReturn(id);
    return { message: "Tax return deleted successfully" };
  }

  @Post(":id/submit")
  @ApiOperation({
    summary: "Submit a tax return to FIRS",
    description:
      "Submits a tax return to the Federal Inland Revenue Service (FIRS) for processing. " +
      "Validates that all required documentation is complete before submission. Once submitted, " +
      "the return status changes to 'filed' and a FIRS reference number is generated in the format " +
      "FIRS-{YEAR}-{TYPE}-{RANDOM} (e.g., FIRS-2026-PIT-A1B2C3D4). " +
      "Submitted returns cannot be edited or deleted to maintain audit trail compliance. " +
      "Ensure all information is accurate and all supporting documents are uploaded before submission.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the tax return to submit",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Tax return submitted successfully with FIRS reference number",
    type: TaxReturn,
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        taxYear: 2026,
        taxType: "PIT",
        status: "filed",
        firsReferenceNumber: "FIRS-2026-PIT-A1B2C3D4",
        totalIncome: 5000000,
        taxableIncome: 4200000,
        taxLiability: 630000,
        submittedAt: "2026-04-15T10:30:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Tax return has missing documentation or validation errors - check validation endpoint first",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Tax return not found",
  })
  @ApiResponse({
    status: 409,
    description: "Tax return already submitted - cannot submit twice",
  })
  async submitTaxReturn(@Param("id") id: string): Promise<TaxReturn> {
    return await this.taxReturnService.submitTaxReturn(id);
  }

  @Get(":id/pdf")
  @ApiOperation({
    summary: "Generate FIRS-compliant PDF",
    description:
      "Generates and downloads a FIRS-compliant PDF of the tax return in the official format required for filing. " +
      "The PDF includes all tax calculations, deductions, reliefs, supporting document references, and taxpayer information. " +
      "This PDF can be printed and submitted physically to FIRS offices or uploaded to the FIRS e-filing portal. " +
      "The generated PDF is stored on the server and the URL is saved to the tax return record for future access. " +
      "PDF filename format: tax-return-{YEAR}-{ID}.pdf",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the tax return",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "PDF generated and downloaded successfully",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
          description: "FIRS-compliant tax return PDF file",
        },
      },
    },
    headers: {
      "Content-Type": {
        description: "application/pdf",
        schema: { type: "string" },
      },
      "Content-Disposition": {
        description: "attachment; filename=tax-return-2026-{id}.pdf",
        schema: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Tax return not found",
  })
  @ApiResponse({
    status: 500,
    description: "PDF generation failed - check server logs for details",
  })
  async generatePDF(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Res() res: Response
  ): Promise<void> {
    const taxReturn = await this.taxReturnService.getTaxReturn(id);
    const business = taxReturn.business;

    const pdfPath = await this.pdfGeneratorService.generateFIRSCompliantPDF(
      taxReturn,
      user,
      business
    );

    taxReturn.generatedPdfUrl = pdfPath;
    await this.taxReturnService.updateTaxReturn(id, {
      generatedPdfUrl: pdfPath,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tax-return-${taxReturn.taxYear}-${taxReturn.id}.pdf`
    );

    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  }

  @Get(":id/validate")
  @ApiOperation({
    summary: "Validate tax return documentation",
    description:
      "Validates that all required supporting documents are uploaded and verified for the tax return. " +
      "Checks for rent receipts (if rent relief claimed), pension certificates (if pension deduction claimed), " +
      "health insurance policies, capital expenditure invoices, donation receipts, severance agreements, " +
      "and other required documents based on the deductions and reliefs claimed. " +
      "Returns a detailed validation report with missing documents and specific errors. " +
      "Run this endpoint before submitting to FIRS to ensure compliance.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the tax return to validate",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Validation completed with detailed results",
    schema: {
      type: "object",
      properties: {
        isComplete: {
          type: "boolean",
          example: false,
          description:
            "Whether all required documentation is present and valid",
        },
        missingDocuments: {
          type: "array",
          items: { type: "string" },
          example: ["rent_receipt", "pension_certificate"],
          description:
            "List of missing document types required for claimed deductions",
        },
        errors: {
          type: "array",
          items: { type: "string" },
          example: [
            "Landlord TIN required for rent relief claim of ₦500,000",
            "Pension provider certificate must be verified before submission",
            "Health insurance policy expired - upload current policy",
          ],
          description: "List of specific validation errors that must be fixed",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Tax return not found",
  })
  async validateTaxReturn(@Param("id") id: string): Promise<{
    isComplete: boolean;
    missingDocuments: string[];
    errors: string[];
  }> {
    const taxReturn = await this.taxReturnService.getTaxReturn(id);
    return await this.taxReturnService.validateDocumentation(taxReturn);
  }
}
