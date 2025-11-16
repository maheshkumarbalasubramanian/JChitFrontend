import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReceiptService } from '../../service/Receipt-service';

@Component({
  selector: 'app-print-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-receipt-component.html',
  styleUrl: './print-receipt-component.scss'
})
export class PrintReceiptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private receiptService = inject(ReceiptService);

  receipt: any = null;
  isLoading: boolean = true;
  currentDate: string = ''; 
  companyInfo = {
    name: 'Sri Ganapathi & GST',
    address: 'Singarachar Street, Gutti, Ananthapur',
    phone: '8523420394',
    mobile: '9346182314',
    license: 'LIC/AP/14-0234-0235-039'
  };

  ngOnInit(): void {
    this.currentDate = this.formatDate(new Date().toISOString());
    const receiptId = this.route.snapshot.paramMap.get('id');
    if (receiptId) {
      this.loadReceiptForPrint(receiptId);
    } else {
      this.router.navigate(['/receipt']);
    }
  }

  loadReceiptForPrint(receiptId: string): void {
    this.receiptService.getReceiptById(receiptId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.receipt = response.data;
          this.isLoading = false;
          // Auto print after loading
          setTimeout(() => {
            window.print();
          }, 500);
        } else {
          alert('Failed to load receipt');
          this.router.navigate(['/receipt/view']);
        }
      },
      error: (error) => {
        console.error('Error loading receipt:', error);
        alert('Failed to load receipt for printing');
        this.router.navigate(['/receipt/view']);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  convertToWords(amount: number): string {
    // Implement number to words conversion
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (amount === 0) return 'Zero Rupees Only';

    let num = Math.floor(amount);
    let words = '';

    if (num >= 10000000) {
      words += this.convertToWords(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      words += this.convertToWords(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      words += this.convertToWords(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    if (num >= 100) {
      words += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      words += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num >= 10) {
      words += teens[num - 10] + ' ';
      return words + 'Rupees Only';
    }
    if (num > 0) {
      words += ones[num] + ' ';
    }

    return words + 'Rupees Only';
  }

  closePrint(): void {
    window.close();
  }
}