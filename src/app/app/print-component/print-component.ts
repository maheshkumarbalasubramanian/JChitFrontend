import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { GoldLoanService, GoldLoan } from '../../service/loan-service';

@Component({
  selector: 'app-print-component',
  imports: [CommonModule],
  templateUrl: './print-component.html',
  styleUrl: './print-component.scss'
})
export class PrintComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private goldLoanService = inject(GoldLoanService);
  private sanitizer = inject(DomSanitizer);

  loan: any = null;
  customerName = '';
  customerAddress = '';
  customerMobile = '';
  schemeName = '';
  customerImageUrl: SafeUrl | null = null;
  firstItemImage: SafeUrl | null = null;
  companySignature = true;

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadLoanForPrint(params['id']);
      }
    });
  }

  private loadLoanForPrint(id: string) {
    this.goldLoanService.getGoldLoanById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loan = response.data;
          
          // Load customer history for additional details
          this.goldLoanService.getCustomerLoanHistory(this.loan.customerId).subscribe({
            next: (custResponse) => {
              if (custResponse.success) {
                this.customerName = custResponse.data.customerName;
                this.customerAddress = custResponse.data.address || '';
                this.customerMobile = custResponse.data.mobile || '';
                
                if (custResponse.data.profileImage) {
                  this.customerImageUrl = this.sanitizer.bypassSecurityTrustUrl(
                    this.cleanDataUrl(custResponse.data.profileImage)
                  );
                }
              }
            }
          });

          // Load scheme name
          this.goldLoanService.getSchemeDetails(this.loan.schemeId).subscribe({
            next: (schemeResponse) => {
              if (schemeResponse.success) {
                this.schemeName = schemeResponse.data.schemeName;
              }
            }
          });

          // Get first item image
          if (this.loan.pledgedItems && this.loan.pledgedItems.length > 0) {
            const firstItem = this.loan.pledgedItems[0];
            if (firstItem.images) {
              try {
                const images = JSON.parse(firstItem.images);
                if (images.length > 0) {
                  this.firstItemImage = this.sanitizer.bypassSecurityTrustUrl(images[0]);
                }
              } catch (e) {
                console.error('Error parsing item images:', e);
              }
            }
          }

          // Auto print after data loads
          setTimeout(() => {
            // Uncomment this if you want automatic printing
            // this.printReceipt();
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Error loading loan:', error);
        alert('Failed to load loan data for printing');
      }
    });
  }

  private cleanDataUrl(s: string | null | undefined): string {
    if (!s) return '';
    s = s.trim();
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
    s = s.replace(/\s+/g, '');
    if (!s.startsWith('data:image')) s = 'data:image/jpeg;base64,' + s;
    return s;
  }

  getLoanAmountInWords(): string {
    // Simple implementation - you can enhance this
    const amount = this.loan?.loanAmount || 0;
    if (amount === 10000) return 'Ten Thousand Only.';
    // Add more conversions as needed
    return `${amount} Only.`;
  }

  printReceipt() {
    window.print();
  }

  goBack() {
    window.history.back();
  }
}
