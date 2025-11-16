
import { ReceiptService, Receipt, InterestCalculation, ReceiptPaymentMode } from '../../service/Receipt-service';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GoldLoanService } from '../../service/loan-service';
// Add these imports at the top of your ReceiptComponent
import { ActivatedRoute, Router } from '@angular/router';
interface LoanData {
  id: string;
  loanNo: string;
  customerName: string;
  customerCode: string;
  customerPhoto: string;
  relation: string;
  address: string;
  city: string;
  phone: string;
  nominee: string;
  loanStatus: string;
  loanDate: string;
  itemGroup: string;
  scheme: string;
  schemeName: string;
  principal: number;
  maturityDate: string;
  location: string;
  loanAge: string;
  weights: string;
  lastReceipt: string;
  items: string;
  interest: number;
  netPayable: number;
  itemPhotos: string[];
}

interface InterestStatement {
  fromDate: string;
  toDate: string;
  duration: string;
  intAccrued: number;
  totAccrued: number;
  intPaid: number;
  principalPaid: number;
  addedPrincipal: number;
  adjPrincipal: number;
  newPrincipal: number;
  isPaid?: boolean;
}

interface PaymentMode {
  mode: string;
  amount: number;
  reference: string;
}

@Component({
  selector: 'app-receipt-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receipt-component.html',
  styleUrl: './receipt-component.scss'
})
export class ReceiptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  // Add these new properties
  isEditMode: boolean = false;
  receiptId: string = '';
  
  private receiptService = inject(ReceiptService);
  private goldLoanService = inject(GoldLoanService);

  redemptionNumber: string = '';
  redemptionDate: string = '';
  tillDate: string = '';
  selectedLoanNo: string = '';
  
  loanData: LoanData | null = null;
  interestStatements: InterestStatement[] = [];
  
  // Payment calculation fields
  calculatedInterest: number = 0;
  collectionAmount: number = 0;
  otherCredits: number = 0;
  otherDebits: number = 0;
  defaultAmount: number = 0;
  addLess: number = 0;
  netPayable: number = 0;
  
  // After collection calculation
  interestPaid: number = 0;
  principalPaid: number = 0;
  balanceInterest: number = 0;
  balancePrincipal: number = 0;
  
  paymentType: string = 'interest';
  remarks: string = '';
  
  isLoading: boolean = false;
  selectedLoanId: string = '';
  outstandingPrincipal: number = 0;
  outstandingInterest: number = 0;
  originalPrincipal: number = 0;
  
  // Payment modes
  paymentModes: PaymentMode[] = [
    { mode: 'Cash', amount: 0, reference: '' }
  ];
  showPaymentModes: boolean = false;
  
  // Image gallery
  currentImageIndex: number = 0;
  schemeData: any = null;

  ngOnInit(): void {
    // Set default dates
    const today = new Date();
    this.redemptionDate = this.formatDate(today);
    this.tillDate = this.formatDate(today);
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.receiptId = params['id'];
        this.loadReceiptForEdit(this.receiptId);
      } else {
        this.isEditMode = false;
        this.generateRedemptionNumber();
      }
    });
    
  }
  loadReceiptForEdit(receiptId: string): void {
    this.isLoading = true;
    
    this.receiptService.getReceiptById(receiptId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const receipt = response.data;
          
          // Populate form with receipt data
          this.redemptionNumber = receipt.receiptNumber;
          this.redemptionDate = this.formatDate(new Date(receipt.receiptDate));
          this.tillDate = this.formatDate(new Date(receipt.tillDate));
          this.selectedLoanNo = receipt.loanNumber;
          this.selectedLoanId = receipt.goldLoanId;
          
          // Load loan data
          this.loadLoanData(receipt.loanNumber);
          
          // Set payment details
          this.calculatedInterest = receipt.calculatedInterest;
          this.collectionAmount = receipt.netPayable;
          this.otherCredits = receipt.otherCredits;
          this.otherDebits = receipt.otherDebits;
          this.defaultAmount = receipt.defaultAmount;
          this.addLess = receipt.addLess;
          this.remarks = receipt.remarks || '';
          
          // Set payment type
          this.paymentType = receipt.paymentType;
          
          // Set payment modes if available
          if (receipt.paymentModes && receipt.paymentModes.length > 0) {
            this.paymentModes = receipt.paymentModes.map((pm: any) => ({
              mode: pm.paymentMode,
              amount: pm.amount,
              reference: pm.referenceNumber || ''
            }));
          }
          
          // Set calculated values
          this.interestPaid = receipt.interestAmount;
          this.principalPaid = receipt.principalAmount;
          this.outstandingPrincipal = receipt.outstandingPrincipal;
          this.outstandingInterest = receipt.outstandingInterest;
          this.balancePrincipal = receipt.outstandingPrincipal;
          this.balanceInterest = receipt.outstandingInterest;
          
          this.isLoading = false;
        } else {
          alert('Receipt not found');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading receipt:', error);
        alert('Failed to load receipt for editing');
        this.isLoading = false;
      }
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateRedemptionNumber(): void {
    this.receiptService.generateReceiptNumber().subscribe({
      next: (response) => {
        if (response.success) {
          this.redemptionNumber = response.data;
        }
      },
      error: (error) => {
        console.error('Error generating receipt number:', error);
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        this.redemptionNumber = `RED${randomNum}`;
      }
    });
  }

  onLoanSelect(): void {
    if (this.selectedLoanNo) {
      this.loadLoanData(this.selectedLoanNo);
    }
  }

  loadLoanData(loanNo: string): void {
    this.isLoading = true;
    
    this.goldLoanService.getGoldLoans(1, 100, loanNo).subscribe({
      next: (response) => {
        if (response.success && response.data.loans.length > 0) {
          const loan = response.data.loans[0];
          this.selectedLoanId = loan.id;
          
          this.goldLoanService.getGoldLoanById(loan.id).subscribe({
            next: (loanResponse) => {
              if (loanResponse.success) {
                this.mapLoanToDisplay(loanResponse.data);
                this.loadSchemeDetails(loanResponse.data.schemeId);
                this.calculateInterestForLoan();
              }
            },
            error: (error) => {
              console.error('Error loading loan details:', error);
              alert('Failed to load loan details');
              this.isLoading = false;
            }
          });
        } else {
          alert('Loan not found');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error searching loan:', error);
        alert('Failed to search loan');
        this.isLoading = false;
      }
    });
  }

  private loadSchemeDetails(schemeId: string): void {
    this.goldLoanService.getSchemeDetails(schemeId).subscribe({
      next: (response) => {
        if (response.success) {
          this.schemeData = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading scheme:', error);
      }
    });
  }

  private mapLoanToDisplay(loan: any): void {
    this.goldLoanService.getCustomerLoanHistory(loan.customerId).subscribe({
      next: (response) => {
        if (response.success) {
          const customer = response.data;
          
          // Get scheme name from loan response
          const schemeName = loan.schemeName || this.schemeData?.schemeName || '';
          
          this.loanData = {
            id: loan.id,
            loanNo: loan.loanNumber,
            customerName: customer.customerName,
            customerCode: customer.customerCode,
            customerPhoto: customer.profileImage || 'assets/customer-photo.jpg',
            relation: customer.relationName || '',
            address: customer.address || '',
            city: '',
            phone: customer.mobile || '',
            nominee: '',
            loanStatus: loan.status,
            loanDate: new Date(loan.loanDate).toLocaleDateString('en-GB'),
            itemGroup: loan.itemGroupName || '',
            scheme: schemeName,
            schemeName: schemeName,
            principal: loan.loanAmount, // Original loan amount
            maturityDate: new Date(loan.maturityDate).toLocaleDateString('en-GB'),
            location: loan.areaName || '',
            loanAge: this.calculateLoanAge(loan.loanDate),
            weights: `GW: ${loan.totalGrossWeight} NW: ${loan.totalNetWeight}`,
            lastReceipt: '',
            items: loan.pledgedItems?.map((item: any) => item.itemName).join(', ') || '',
            interest: 0,
            netPayable: 0,
            itemPhotos: this.getAllItemImages(loan.pledgedItems)
          };
          
          // Don't set outstandingPrincipal here - it will be set from interest calculation
          // which gets it from the last receipt
        }
      }
    });
  }

  private calculateLoanAge(loanDate: string): string {
    const start = new Date(loanDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    return `${months} Months and ${days} days`;
  }

  private getAllItemImages(items: any[]): string[] {
    const allImages: string[] = [];
    
    if (items && items.length > 0) {
      items.forEach(item => {
        if (item.images) {
          try {
            const images = JSON.parse(item.images);
            allImages.push(...images);
          } catch (e) {
            console.error('Error parsing item images:', e);
          }
        }
      });
    }
    
    return allImages.length > 0 ? allImages : ['assets/item-photo.jpg'];
  }

  // Image navigation
  nextImage(): void {
    if (this.loanData && this.loanData.itemPhotos.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.loanData.itemPhotos.length;
    }
  }

  previousImage(): void {
    if (this.loanData && this.loanData.itemPhotos.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.loanData.itemPhotos.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  getCurrentImage(): string {
    return this.loanData?.itemPhotos[this.currentImageIndex] || 'assets/item-photo.jpg';
  }

  calculateInterestForLoan(): void {
    if (!this.selectedLoanId) return;
    
    this.receiptService.calculateInterest(this.selectedLoanId, this.tillDate).subscribe({
      next: (response) => {
        if (response.success) {
          const calculation = response.data;
          
          console.log('Interest Calculation Debug:', {
            schemeData: this.schemeData,
            calculationMethod: this.schemeData?.calculationMethod,
            roi: this.schemeData?.roi,
            daysCalculated: calculation.daysCalculated,
            effectiveDays: calculation.effectiveDays,
            minCalcDays: calculation.minCalcDays,
            outstandingPrincipal: calculation.outstandingPrincipal,
            interestAmount: calculation.interestAmount
          });
          
          // Check if interest is already paid
          if (calculation.interestAmount === 0 && calculation.daysCalculated === 0) {
            alert('Interest is already paid up to this date. Please select a future date to calculate new interest.');
          }
          
          // Apply minimum calculation days if exists
          let finalInterest = calculation.interestAmount;
          if (this.schemeData && this.schemeData.minCalcDays) {
            const actualDays = calculation.daysCalculated;
            if (actualDays < this.schemeData.minCalcDays && actualDays > 0) {
              // Calculate interest for minimum days
              const months = this.schemeData.minCalcDays / 30.0;
              const minDaysInterest = (calculation.outstandingPrincipal * this.schemeData.roi * months) / 100;
              finalInterest = Math.max(calculation.interestAmount, minDaysInterest);
              console.log('Applied min days:', { minDaysInterest, finalInterest });
            }
          }
          
          this.calculatedInterest = finalInterest;
          this.outstandingPrincipal = calculation.outstandingPrincipal;
          this.outstandingInterest = finalInterest;
          
          this.interestStatements = calculation.interestStatements.map((stmt: any) => ({
            fromDate: stmt.fromDate,
            toDate: stmt.toDate,
            duration: stmt.duration,
            intAccrued: stmt.intAccrued,
            totAccrued: stmt.totAccrued,
            intPaid: stmt.intPaid,
            principalPaid: stmt.principalPaid,
            addedPrincipal: stmt.addedPrincipal,
            adjPrincipal: stmt.adjPrincipal,
            newPrincipal: stmt.newPrincipal,
            isPaid: stmt.isPaid || false
          }));
          
          if (this.loanData) {
            this.loanData.interest = this.calculatedInterest;
            this.loanData.netPayable = this.outstandingPrincipal + this.calculatedInterest;
          }
          
          this.calculateNetPayable();
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error calculating interest:', error);
        alert('Failed to calculate interest');
        this.isLoading = false;
      }
    });
  }

  onTillDateChange(): void {
    if (this.selectedLoanId) {
      this.calculateInterestForLoan();
    }
  }

  calculateNetPayable(): void {
    if (!this.loanData) return;

    let totalDue = 0;
    
    if (this.paymentType === 'interest') {
      totalDue = this.calculatedInterest;
    } else if (this.paymentType === 'full') {
      totalDue = this.outstandingPrincipal + this.calculatedInterest;
    }

    totalDue = totalDue - this.otherCredits + this.otherDebits + this.defaultAmount + this.addLess;
    this.netPayable = totalDue;
    
    // If collection amount is not set, default to net payable
    if (this.collectionAmount === 0) {
      this.collectionAmount = this.netPayable;
      this.updatePaymentModeTotal();
    }
    
    this.calculatePaymentDistribution();
  }

  onCollectionAmountChange(): void {
    this.calculatePaymentDistribution();
    this.updatePaymentModeTotal();
  }

  calculatePaymentDistribution(): void {
    let remainingAmount = this.collectionAmount;
    
    // First pay interest
    if (remainingAmount >= this.outstandingInterest) {
      this.interestPaid = this.outstandingInterest;
      remainingAmount -= this.outstandingInterest;
      this.balanceInterest = 0;
    } else {
      this.interestPaid = remainingAmount;
      this.balanceInterest = this.outstandingInterest - remainingAmount;
      remainingAmount = 0;
    }
    
    // Then pay principal
    if (remainingAmount > 0) {
      if (remainingAmount >= this.outstandingPrincipal) {
        this.principalPaid = this.outstandingPrincipal;
        this.balancePrincipal = 0;
      } else {
        this.principalPaid = remainingAmount;
        this.balancePrincipal = this.outstandingPrincipal - remainingAmount;
      }
    } else {
      this.principalPaid = 0;
      this.balancePrincipal = this.outstandingPrincipal;
    }
  }

  onPaymentTypeChange(): void {
    this.calculateNetPayable();
  }

  // Payment Mode Management
  togglePaymentModes(): void {
    this.showPaymentModes = !this.showPaymentModes;
  }

  addPaymentMode(): void {
    this.paymentModes.push({ mode: 'Cash', amount: 0, reference: '' });
  }

  removePaymentMode(index: number): void {
    if (this.paymentModes.length > 1) {
      this.paymentModes.splice(index, 1);
      this.updatePaymentModeTotal();
    }
  }

  onPaymentModeAmountChange(): void {
    this.updatePaymentModeTotal();
  }

  updatePaymentModeTotal(): void {
    const total = this.getPaymentModesTotal();
    
    // If there's only one payment mode, auto-fill with collection amount
    if (this.paymentModes.length === 1 && this.collectionAmount > 0) {
      this.paymentModes[0].amount = this.collectionAmount;
    }
    
    // Validate total matches collection amount
    if (Math.abs(total - this.collectionAmount) > 0.01 && total > 0) {
      console.warn('Payment mode total does not match collection amount');
    }
  }

  getPaymentModesTotal(): number {
    return this.paymentModes.reduce((sum, pm) => sum + (pm.amount || 0), 0);
  }

  clearLoan(): void {
    this.selectedLoanNo = '';
    this.selectedLoanId = '';
    this.loanData = null;
    this.interestStatements = [];
    this.currentImageIndex = 0;
    this.resetForm();
  }

  resetForm(): void {
    this.calculatedInterest = 0;
    this.collectionAmount = 0;
    this.otherCredits = 0;
    this.otherDebits = 0;
    this.defaultAmount = 0;
    this.addLess = 0;
    this.netPayable = 0;
    this.interestPaid = 0;
    this.principalPaid = 0;
    this.balanceInterest = 0;
    this.balancePrincipal = 0;
    this.remarks = '';
    this.outstandingPrincipal = 0;
    this.outstandingInterest = 0;
    this.paymentModes = [{ mode: 'Cash', amount: 0, reference: '' }];
  }

  saveRedemption(): void {
    if (!this.loanData) {
      alert('Please select a loan first');
      return;
    }

    // Validate payment modes total
    const paymentTotal = this.paymentModes.reduce((sum, pm) => sum + (pm.amount || 0), 0);
    if (Math.abs(paymentTotal - this.collectionAmount) > 0.01) {
      alert('Payment mode amounts must equal collection amount');
      return;
    }

    this.isLoading = true;

    // Create receipt date with current time to ensure proper ordering
    const receiptDateTime = new Date(this.redemptionDate);
    receiptDateTime.setHours(new Date().getHours());
    receiptDateTime.setMinutes(new Date().getMinutes());
    receiptDateTime.setSeconds(new Date().getSeconds());

    // Map interest statements and update the last one with actual payments
    const mappedStatements = this.interestStatements.map((stmt, index) => {
      const isLastStatement = index === this.interestStatements.length - 1;
      
      return {
        goldLoanId: this.selectedLoanId,
        fromDate: new Date(stmt.fromDate.split('/').reverse().join('-')),
        toDate: new Date(stmt.toDate.split('/').reverse().join('-')),
        durationDays: parseInt(stmt.duration.split(' ')[0]),
        interestAccrued: stmt.intAccrued,
        totalAccrued: stmt.totAccrued,
        // Only the last statement gets the actual payments
        interestPaid: isLastStatement ? this.interestPaid : 0,
        principalPaid: isLastStatement ? this.principalPaid : 0,
        addedPrincipal: stmt.addedPrincipal,
        adjustedPrincipal: stmt.adjPrincipal,
        // Update the new principal to reflect the balance after payment
        newPrincipal: isLastStatement ? this.balancePrincipal : stmt.newPrincipal,
        openingPrincipal: this.outstandingPrincipal,
        closingPrincipal: isLastStatement ? this.balancePrincipal : stmt.newPrincipal
      };
    });

    const receipt: Receipt = {
      receiptNumber: this.redemptionNumber,
      receiptDate: receiptDateTime,
      tillDate: new Date(this.tillDate),
      goldLoanId: this.selectedLoanId,
      customerId: '',
      loanNumber: this.selectedLoanNo,
      customerCode: this.loanData.customerCode,
      paymentType: this.determinePaymentType(),
      principalAmount: this.principalPaid,
      interestAmount: this.interestPaid,
      otherCredits: this.otherCredits,
      otherDebits: this.otherDebits,
      defaultAmount: this.defaultAmount,
      addLess: this.addLess,
      netPayable: this.collectionAmount,
      calculatedInterest: this.calculatedInterest,
      outstandingPrincipal: this.balancePrincipal,
      outstandingInterest: 0,
      remarks: this.remarks,
      interestStatements: mappedStatements,
      paymentModes: this.paymentModes.map(pm => ({
        paymentMode: pm.mode,
        amount: pm.amount,
        referenceNumber: pm.reference
      }))
    };

    // If in edit mode, add the receipt ID
    if (this.isEditMode && this.receiptId) {
      receipt.id = this.receiptId;
    }

    this.goldLoanService.getGoldLoanById(this.selectedLoanId).subscribe({
      next: (loanResponse) => {
        if (loanResponse.success) {
          receipt.customerId = loanResponse.data.customerId;
          
          if (this.isEditMode) {
            // Update existing receipt
            this.updateReceipt(receipt);
          } else {
            // Create new receipt
            this.createNewReceipt(receipt);
          }
        }
      }
    });
  }

  private createNewReceipt(receipt: Receipt): void {
    this.receiptService.createReceipt(receipt).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Receipt saved successfully!');
          this.router.navigate(['/receipt']);
        } else {
          alert(`Failed to save receipt: ${response.message}`);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving receipt:', error);
        alert('Failed to save receipt');
        this.isLoading = false;
      }
    });
  }
  private determinePaymentType(): string {
    if (this.principalPaid > 0 && this.balancePrincipal === 0 && this.balanceInterest === 0) {
      return 'full';
    } else if (this.principalPaid > 0) {
      return 'partial';
    } else {
      return 'interest';
    }
  }
  private updateReceipt(receipt: Receipt): void {
    // For now, we'll show a message that edit is not yet implemented
    // You'll need to add an update endpoint in your API
    alert('Receipt update functionality - API endpoint needed');
    this.isLoading = false;
    
    // When you add the update API endpoint, uncomment this:
    /*
    this.receiptService.updateReceipt(this.receiptId, receipt).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Receipt updated successfully!');
          this.router.navigate(['/receipt']);
        } else {
          alert(`Failed to update receipt: ${response.message}`);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating receipt:', error);
        alert('Failed to update receipt');
        this.isLoading = false;
      }
    });
    */
  }
  deleteRedemption(): void {
    const confirmMessage = this.isEditMode 
      ? 'Are you sure you want to cancel this receipt?' 
      : 'Are you sure you want to clear this form?';
      
    if (confirm(confirmMessage)) {
      if (this.isEditMode && this.receiptId) {
        // Cancel the receipt via API
        this.receiptService.deleteReceipt(this.receiptId).subscribe({
          next: (response) => {
            if (response.success) {
              alert('Receipt cancelled successfully');
              this.router.navigate(['/receipt']);
            } else {
              alert(`Failed to cancel receipt: ${response.message}`);
            }
          },
          error: (error) => {
            console.error('Error cancelling receipt:', error);
            alert('Failed to cancel receipt');
          }
        });
      } else {
        // Just clear the form
        this.clearLoan();
        this.resetForm();
        this.generateRedemptionNumber();
        alert('Form cleared');
      }
    }
  }
}