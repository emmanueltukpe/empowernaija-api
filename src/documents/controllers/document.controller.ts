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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { User, UserRole } from "../../users/entities/user.entity";
import { DocumentService } from "../services/document.service";
import { StorageService } from "../services/storage.service";
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  VerifyDocumentDto,
} from "../dto/upload-document.dto";
import {
  Document,
  DocumentType,
  DocumentStatus,
} from "../entities/document.entity";
import { BaseController } from "../../common/controllers";
import { CurrentUser } from "../../common/decorators";

@ApiTags("Documents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("documents")
export class DocumentController extends BaseController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly storageService: StorageService
  ) {
    super();
  }

  @Post("upload")
  @ApiOperation({
    summary: "Upload a tax-related document",
    description:
      "Upload supporting documents for tax calculations and returns. Supports 15 document types including " +
      "rent receipts, pension certificates, health insurance policies, capital expenditure invoices, donation receipts, " +
      "severance agreements, NGO exemption certificates, and more. Files are validated for size (max 10MB) and type " +
      "(PDF, images, Word docs). Metadata can include landlord details, provider information, amounts, and dates.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Document file (PDF, JPG, PNG, DOCX - max 10MB)",
        },
        documentType: {
          type: "string",
          enum: Object.values(DocumentType),
          description:
            "Type of document (rent_receipt, pension_certificate, health_insurance_policy, etc.)",
          example: "rent_receipt",
        },
        taxYear: {
          type: "number",
          description: "Tax year this document applies to",
          example: 2026,
        },
        businessId: {
          type: "string",
          description: "Business ID if document is business-related (optional)",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
        description: {
          type: "string",
          description: "Additional description or notes about the document",
          example: "Annual rent receipt for 2026",
        },
        metadata: {
          type: "object",
          description:
            "Document-specific metadata (landlord details, amounts, dates, etc.)",
          example: {
            landlordName: "John Doe",
            landlordTIN: "12345678-0001",
            amount: 1200000,
          },
        },
      },
      required: ["file", "documentType", "taxYear"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Document uploaded and validated successfully",
    type: Document,
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid file (wrong type, too large) or missing required fields",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: User
  ): Promise<Document> {
    const userId = user.id;

    // Validate file
    this.documentService.validateFile(file);

    // Upload file to storage
    const fileUrl = await this.storageService.uploadFile(
      file,
      userId,
      dto.documentType
    );

    // Create document record
    return this.documentService.createDocument(userId, fileUrl, file, dto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all documents for the current user",
    description:
      "Retrieves all documents uploaded by the authenticated user. Can be filtered by tax year and document type. " +
      "Returns documents with their verification status, metadata, and file URLs.",
  })
  @ApiQuery({
    name: "taxYear",
    required: false,
    description: "Filter by tax year",
    example: 2026,
  })
  @ApiQuery({
    name: "documentType",
    required: false,
    enum: DocumentType,
    description: "Filter by document type",
    example: "rent_receipt",
  })
  @ApiResponse({
    status: 200,
    description: "Documents retrieved successfully",
    type: [Document],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  async getUserDocuments(
    @CurrentUser() user: User,
    @Query("taxYear") taxYear?: number,
    @Query("documentType") documentType?: DocumentType
  ): Promise<Document[]> {
    const userId = user.id;
    return this.documentService.getUserDocuments(userId, taxYear, documentType);
  }

  @Get("business/:businessId")
  @ApiOperation({
    summary: "Get all documents for a business",
    description:
      "Retrieves all documents associated with a specific business. Can be filtered by tax year and document type. " +
      "Useful for viewing business-related documents like capital expenditure invoices, donation receipts, etc.",
  })
  @ApiParam({
    name: "businessId",
    description: "UUID of the business",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiQuery({
    name: "taxYear",
    required: false,
    description: "Filter by tax year",
    example: 2026,
  })
  @ApiQuery({
    name: "documentType",
    required: false,
    enum: DocumentType,
    description: "Filter by document type",
    example: "capital_expenditure_invoice",
  })
  @ApiResponse({
    status: 200,
    description: "Business documents retrieved successfully",
    type: [Document],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Business not found",
  })
  async getBusinessDocuments(
    @Param("businessId") businessId: string,
    @Query("taxYear") taxYear?: number,
    @Query("documentType") documentType?: DocumentType
  ): Promise<Document[]> {
    return this.documentService.getBusinessDocuments(
      businessId,
      taxYear,
      documentType
    );
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a document by ID",
    description:
      "Retrieves detailed information for a specific document including file URL, metadata, " +
      "verification status, and upload timestamp. Returns the document only if it belongs to the authenticated user. " +
      "Useful for viewing document details before using it in tax calculations or returns.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the document",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Document retrieved successfully",
    type: Document,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Document not found or does not belong to the user",
  })
  async getDocument(
    @Param("id") id: string,
    @CurrentUser() user: User
  ): Promise<Document> {
    const userId = user.id;
    return this.documentService.getDocumentById(id, userId);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update document metadata",
    description:
      "Updates metadata for an existing document without changing the file itself. " +
      "Can update landlord details, provider information, amounts, dates, and other metadata fields. " +
      "Useful for correcting errors in metadata after upload. Cannot update verified documents - " +
      "contact admin to reject verification first if changes are needed.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the document to update",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({
    type: UpdateDocumentDto,
    description: "Updated metadata fields",
    examples: {
      rentReceipt: {
        value: {
          metadata: {
            landlordName: "John Doe",
            landlordTin: "12345678-9012",
            landlordAddress: "123 Main St, Lagos",
            rentAmount: 600000,
            rentPeriod: "2026-01-01 to 2026-12-31",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Document metadata updated successfully",
    type: Document,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid metadata or attempting to update verified document",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Document not found or does not belong to the user",
  })
  async updateDocument(
    @Param("id") id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: User
  ): Promise<Document> {
    const userId = user.id;
    return this.documentService.updateDocument(id, userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a document",
    description:
      "Permanently deletes a document and its associated file from storage. " +
      "Cannot delete documents that are referenced in submitted tax returns to maintain audit trail. " +
      "Cannot delete verified documents - contact admin to reject verification first. " +
      "Warning: This action cannot be undone and the file will be permanently removed from storage.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the document to delete",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 204,
    description: "Document deleted successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 404,
    description: "Document not found or does not belong to the user",
  })
  @ApiResponse({
    status: 409,
    description:
      "Cannot delete document - referenced in submitted tax return or already verified",
  })
  async deleteDocument(
    @Param("id") id: string,
    @CurrentUser() user: User
  ): Promise<void> {
    const userId = user.id;
    await this.documentService.deleteDocument(id, userId);
  }

  @Post(":id/verify")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Verify or reject a document (Admin only)",
    description:
      "Admin endpoint to verify or reject uploaded documents. Verification confirms that the document " +
      "is authentic, complete, and meets FIRS requirements. Verified documents can be used in tax return submissions. " +
      "Rejected documents must be re-uploaded by the user with corrections. " +
      "Status transitions: pending → verified OR pending → rejected. " +
      "Verification notes are required when rejecting to explain the reason.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the document to verify",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({
    type: VerifyDocumentDto,
    description: "Verification decision and notes",
    examples: {
      approve: {
        value: {
          status: "verified",
          verificationNotes: "Document is authentic and complete",
        },
      },
      reject: {
        value: {
          status: "rejected",
          verificationNotes:
            "Landlord TIN is invalid - please provide correct TIN",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Document verification status updated successfully",
    type: Document,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid status or missing verification notes for rejection",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - admin role required",
  })
  @ApiResponse({
    status: 404,
    description: "Document not found",
  })
  async verifyDocument(
    @Param("id") id: string,
    @Body() dto: VerifyDocumentDto,
    @CurrentUser() user: User
  ): Promise<Document> {
    const adminUserId = user.id;
    return this.documentService.verifyDocument(id, adminUserId, dto);
  }

  @Get("status/:status")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get documents by status (Admin only)",
    description:
      "Admin endpoint to retrieve all documents with a specific verification status. " +
      "Useful for admin dashboard to view pending documents requiring verification, " +
      "or to audit verified/rejected documents. Returns documents from all users. " +
      "Status values: pending, verified, rejected.",
  })
  @ApiParam({
    name: "status",
    description: "Document verification status",
    enum: ["pending", "verified", "rejected"],
    example: "pending",
  })
  @ApiResponse({
    status: 200,
    description: "Documents retrieved successfully",
    type: [Document],
  })
  @ApiResponse({
    status: 400,
    description: "Invalid status value",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT token required",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - admin role required",
  })
  async getDocumentsByStatus(
    @Param("status") status: DocumentStatus
  ): Promise<Document[]> {
    return this.documentService.getDocumentsByStatus(status);
  }
}
