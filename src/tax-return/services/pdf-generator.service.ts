import { Injectable, Logger } from '@nestjs/common';
import { TaxReturn } from '../entities/tax-return.entity';
import { TaxType } from '../../tax-calculation/entities/tax-calculation.entity';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generateFIRSCompliantPDF(taxReturn: TaxReturn, user: any, business?: any): Promise<string> {
    this.logger.log(`Generating FIRS-compliant PDF for tax return ${taxReturn.id}`);

    const uploadsDir = path.join(process.cwd(), 'uploads', 'tax-returns');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `tax-return-${taxReturn.taxYear}-${taxReturn.id}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        this.addHeader(doc, taxReturn);
        this.addTaxpayerInfo(doc, user, business);
        this.addIncomeSection(doc, taxReturn);
        this.addDeductionsAndReliefs(doc, taxReturn);
        this.addTaxCalculation(doc, taxReturn);
        this.addSupportingDocuments(doc, taxReturn);
        this.addDeclaration(doc, taxReturn);
        this.addFooter(doc, taxReturn);

        doc.end();

        stream.on('finish', () => {
          this.logger.log(`PDF generated successfully: ${filepath}`);
          resolve(filepath);
        });

        stream.on('error', (error) => {
          this.logger.error(`PDF generation failed: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        this.logger.error(`PDF generation error: ${error.message}`);
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, taxReturn: TaxReturn): void {
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('FEDERAL INLAND REVENUE SERVICE', { align: 'center' })
      .fontSize(16)
      .text('NIGERIA', { align: 'center' })
      .moveDown()
      .fontSize(14)
      .text(
        taxReturn.taxType === TaxType.PIT
          ? 'PERSONAL INCOME TAX RETURN'
          : 'COMPANY INCOME TAX RETURN',
        { align: 'center' }
      )
      .fontSize(12)
      .text(`Tax Year: ${taxReturn.taxYear}`, { align: 'center' })
      .moveDown(2);

    if (taxReturn.firsReferenceNumber) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Reference Number: ${taxReturn.firsReferenceNumber}`, { align: 'right' })
        .moveDown();
    }
  }

  private addTaxpayerInfo(doc: PDFKit.PDFDocument, user: any, business?: any): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TAXPAYER INFORMATION', { underline: true })
      .moveDown(0.5)
      .font('Helvetica')
      .fontSize(10);

    if (business) {
      doc
        .text(`Business Name: ${business.businessName}`)
        .text(`TIN: ${business.tin || 'N/A'}`)
        .text(`RC Number: ${business.rcNumber || 'N/A'}`)
        .text(`Business Type: ${business.businessType || 'N/A'}`)
        .text(`Address: ${business.address || 'N/A'}`)
        .text(`Contact Person: ${user.firstName} ${user.lastName}`)
        .text(`Email: ${user.email}`)
        .text(`Phone: ${user.phoneNumber || 'N/A'}`);
    } else {
      doc
        .text(`Name: ${user.firstName} ${user.lastName}`)
        .text(`TIN: ${user.tin || 'N/A'}`)
        .text(`NIN: ${user.nin || 'N/A'}`)
        .text(`Email: ${user.email}`)
        .text(`Phone: ${user.phoneNumber || 'N/A'}`)
        .text(`Address: ${user.address || 'N/A'}`);
    }

    doc.moveDown(2);
  }

  private addIncomeSection(doc: PDFKit.PDFDocument, taxReturn: TaxReturn): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('INCOME DETAILS', { underline: true })
      .moveDown(0.5)
      .font('Helvetica')
      .fontSize(10);

    doc
      .text(`Total Income: ₦${this.formatCurrency(taxReturn.totalIncome)}`)
      .moveDown(1.5);
  }

  private addDeductionsAndReliefs(doc: PDFKit.PDFDocument, taxReturn: TaxReturn): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DEDUCTIONS AND RELIEFS', { underline: true })
      .moveDown(0.5)
      .font('Helvetica')
      .fontSize(10);

    doc.text(`Total Deductions: ₦${this.formatCurrency(taxReturn.totalDeductions)}`);

    if (taxReturn.calculationBreakdown?.reliefs) {
      const reliefs = taxReturn.calculationBreakdown.reliefs;
      doc.moveDown(0.5).font('Helvetica-Bold').text('Reliefs Claimed:').font('Helvetica');

      Object.entries(reliefs).forEach(([key, value]) => {
        const reliefName = this.formatReliefName(key);
        doc.text(`  ${reliefName}: ₦${this.formatCurrency(Number(value))}`);
      });
    }

    doc.text(`Total Reliefs: ₦${this.formatCurrency(taxReturn.totalReliefs)}`).moveDown(1.5);
  }

  private addTaxCalculation(doc: PDFKit.PDFDocument, taxReturn: TaxReturn): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TAX CALCULATION', { underline: true })
      .moveDown(0.5)
      .font('Helvetica')
      .fontSize(10);

    doc
      .text(`Taxable Income: ₦${this.formatCurrency(taxReturn.taxableIncome)}`)
      .text(`Tax Liability: ₦${this.formatCurrency(taxReturn.taxLiability)}`)
      .text(`Tax Paid: ₦${this.formatCurrency(taxReturn.taxPaid)}`)
      .font('Helvetica-Bold')
      .text(`Tax Due: ₦${this.formatCurrency(taxReturn.taxDue)}`)
      .font('Helvetica')
      .moveDown(1.5);

    if (taxReturn.calculationBreakdown?.exemptionReason) {
      doc
        .font('Helvetica-Bold')
        .text('Exemption Applied:')
        .font('Helvetica')
        .text(taxReturn.calculationBreakdown.exemptionReason)
        .moveDown(1.5);
    }
  }

  private addSupportingDocuments(doc: PDFKit.PDFDocument, taxReturn: TaxReturn): void {
    if (!taxReturn.supportingDocuments) return;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('SUPPORTING DOCUMENTS', { underline: true })
      .moveDown(0.5)
      .font('Helvetica')
      .fontSize(10);

    const docs = taxReturn.supportingDocuments;
    let hasDocuments = false;

    Object.entries(docs).forEach(([category, files]) => {
      if (Array.isArray(files) && files.length > 0) {
        hasDocuments = true;
        const categoryName = this.formatCategoryName(category);
        doc.text(`${categoryName}: ${files.length} document(s)`);
      }
    });

    if (!hasDocuments) {
      doc.text('No supporting documents attached');
    }

    doc.moveDown(1.5);
  }

  private addDeclaration(doc: PDFKit.PDFDocument, taxReturn: TaxReturn): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DECLARATION', { underline: true })
      .moveDown(0.5)
      .font('Helvetica')
      .fontSize(9);

    doc
      .text(
        'I declare that the information provided in this tax return is true, correct, and complete to the best of my knowledge and belief.',
        { align: 'justify' }
      )
      .moveDown(2);

    doc
      .fontSize(10)
      .text('Signature: _______________________     Date: _______________________')
      .moveDown(3);
  }

  private addFooter(doc: PDFKit.PDFDocument, taxReturn: TaxReturn): void {
    const bottomMargin = 50;
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Generated on: ${new Date().toLocaleDateString('en-NG')} | Status: ${taxReturn.status}`,
        50,
        doc.page.height - bottomMargin,
        { align: 'center' }
      );
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatReliefName(key: string): string {
    const reliefNames: { [key: string]: string } = {
      consolidatedRelief: 'Consolidated Relief Allowance',
      rentRelief: 'Rent Relief',
      pensionRelief: 'Pension Contribution Relief',
      healthInsuranceRelief: 'Health Insurance Relief',
      lifeAssuranceRelief: 'Life Assurance Relief',
    };
    return reliefNames[key] || key;
  }

  private formatCategoryName(category: string): string {
    const categoryNames: { [key: string]: string } = {
      rentReceipts: 'Rent Receipts',
      pensionCertificates: 'Pension Certificates',
      healthInsurancePolicies: 'Health Insurance Policies',
      capitalExpenditureInvoices: 'Capital Expenditure Invoices',
      donationReceipts: 'Donation Receipts',
      severanceDocuments: 'Severance Documents',
      incomeStatements: 'Income Statements',
      bankStatements: 'Bank Statements',
    };
    return categoryNames[category] || category;
  }
}

