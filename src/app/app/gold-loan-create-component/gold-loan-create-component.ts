import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { 
  GoldLoanService, 
  Customer, 
  Area, 
  ItemGroup, 
  Scheme, 
  ItemType, 
  CustomerLoanHistory,
  GoldLoan,
  PledgedItem
} from '../../service/loan-service';
import { RateSet } from '../../service/rate-set.service';
import { Purity } from '../../service/loan-service';
import { JewelFault } from '../../service/jewel-fault.service';

@Component({
  selector: 'app-gold-loan-create-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gold-loan-create-component.html',
  styleUrl: './gold-loan-create-component.scss'
})
export class GoldLoanCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private goldLoanService = inject(GoldLoanService);

  profileImageUrl!: SafeUrl; 
  loanForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  loanId?: string;
  profileImagePreview: string | null = null;
  // Data arrays
  areas: Area[] = [];
  customers: Customer[] = [];
  itemGroups: ItemGroup[] = [];
  schemes: Scheme[] = [];
  itemTypes: ItemType[] = [];
  purities: Purity[] = [];
  faults: JewelFault[] = [];
  goldRates: RateSet = {
    areaId: '',
    effectiveDate: '',
    goldRatePerGram: 0,
    goldPurityRatePerGram: 0,
    silverRatePerGram: 0,
    silverPurityRatePerGram: 0,
    isActive: false
  };
  
  // Filtered arrays
  filteredCustomers: Customer[] = [];
  filteredItems: ItemType[][] = [];
  
  // UI state
  showCustomerDropdown = false;
  showItemDropdown: boolean[] = [];
  showActions = false;

  // Customer history and image
  selectedCustomerHistory: CustomerLoanHistory | null = null;
  selectedScheme: Scheme | null = null;
  customerImage: string = '';

  // Calculated values
  totalQty = 0;
  totalGrossWeight = 0;
  totalStoneWeight = 0;
  totalNetWeight = 0;
  totalCalculatedValue = 0;
  totalMaximumValue = 0;
  maxLoanAmount = 0;
  loanAmount = 0;
  interestAmount = 0;
  advanceInterestAmount = 0;
  processingFeeAmount = 0;
  netPayable = 0;

  ngOnInit() {
    this.initializeForm();
    this.loadAreas();
    this.checkEditMode();
    
    // Initialize arrays for the first item row
    this.filteredItems = [[]];
    this.showItemDropdown = [false];
  }

  private initializeForm() {
    this.loanForm = this.fb.group({
      series: ['GOLD SERIES', Validators.required],
      loanNumber: [''],
      refNumber: [''],
      loanDate: [new Date().toISOString().split('T')[0], Validators.required],
      maturityDate: [''],  // Will be calculated
      areaId: ['', Validators.required],
      customerId: ['', Validators.required],
      customerSearch: ['', Validators.required],
      customerImage: [''],
      schemeId: ['', Validators.required],
      itemGroupId: ['', Validators.required],
      interestRate: [0, [Validators.required, Validators.min(0.1)]],
      advanceMonths: [1, [Validators.min(0), Validators.max(12)]],
      dueMonths: [12, [Validators.required, Validators.min(1), Validators.max(60)]],
      processingFeePercent: [0.1, [Validators.min(0)]],
      manualLoanAmount: [0, [Validators.min(0)]],
      remarks: [''],
      pledgedItems: this.fb.array([this.createItemGroup()])
    });
  
    // Set initial maturity date
    this.updateMaturityDate();
  
    // Watch for loan date changes
    this.loanForm.get('loanDate')?.valueChanges.subscribe(() => {
      this.updateMaturityDate();
    });
  
    // Watch for due months changes
    this.loanForm.get('dueMonths')?.valueChanges.subscribe(() => {
      this.updateMaturityDate();
    });
  
    // Watch for form changes
    this.loanForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  
    // Watch for manual loan amount changes
    this.loanForm.get('manualLoanAmount')?.valueChanges.subscribe((value) => {
      this.onManualLoanAmountChange(value);
    });
  }

  get pledgedItemsArray() {
    return this.loanForm.get('pledgedItems') as FormArray;
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      itemTypeId: ['', Validators.required],
      itemName: ['', Validators.required],
      purityId: ['', Validators.required],
      goldRate: [0, [Validators.required, Validators.min(0.01)]],
      qty: [1, [Validators.required, Validators.min(1)]],
      grossWeight: [0, [Validators.required, Validators.min(0.01)]],
      stoneWeight: [0, [Validators.min(0)]],
      netWeight: [0, [Validators.required, Validators.min(0.01)]],
      calculatedValue: [0],
      maximumValue: [0, [Validators.required, Validators.min(1)]],
      remarks: [''],
      images: [''],
      jewelFault: [''],
      huid: [''],
      hallmarkPurity: [''],
      hallmarkGrossWeight: [0],
      hallmarkNetWeight: [0]
    });
  }

  private loadAreas() {
    this.goldLoanService.getActiveAreas().subscribe({
      next: (response) => {
        if (response.success) {
          this.areas = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading areas:', error);
        alert('Failed to load areas. Please refresh the page.');
      }
    });
  }
  constructor(private sanitizer: DomSanitizer) {}
  private cleanDataUrl(s: string | null | undefined): string {
    if (!s) return '';
    s = s.trim();
  
    // drop accidental surrounding quotes from JSON/DB
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  
    // remove newlines/spaces/tabs that break base64
    s = s.replace(/\s+/g, '');
  
    // ensure the data URL prefix exists (if your API sometimes sends raw base64)
    if (!s.startsWith('data:image')) s = 'data:image/jpeg;base64,' + s;
  
    return s;
  }
  onAreaChange() {
    const areaId = this.loanForm.get('areaId')?.value;
    if (areaId) {
      this.loanForm.get('customerSearch')?.enable();
      this.loadCustomersByArea(areaId);
      this.loadItemGroupsByArea(areaId);
      this.getCurrentRateSetByArea(areaId);
      
      // Reset dependent fields
      this.loanForm.patchValue({
        customerId: '',
        customerSearch: '',
        customerImage: '',
        itemGroupId: '',
        schemeId: ''
      });
      this.selectedCustomerHistory = null;
      this.customerImage = '';
      this.itemGroups = [];
      this.schemes = [];
    }
  }

  private loadCustomersByArea(areaId: string) {
    this.goldLoanService.getCustomersByArea(areaId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log("Customer data retrieved:", response.data);
          this.customers = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  private loadItemGroupsByArea(areaId: string) {
    this.goldLoanService.getItemGroupsByArea(areaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.itemGroups = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading item groups:', error);
      }
    });
  }

  searchCustomers(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (searchTerm.length > 0 && this.customers.length > 0) {
      this.filteredCustomers = this.customers.filter(customer => {
        const name = customer.customerName?.toLowerCase() || '';
        const code = customer.customerCode?.toLowerCase() || '';
        const mobile = customer.mobile || '';
        
        return name.includes(searchTerm) || 
               code.includes(searchTerm) || 
               mobile.includes(searchTerm);
      });
      
      this.showCustomerDropdown = this.filteredCustomers.length > 0;
    } else {
      this.filteredCustomers = [];
      this.showCustomerDropdown = false;
      this.selectedCustomerHistory = null;
    }
  }

  toggleCustomerDropdown() {
    this.showCustomerDropdown = !this.showCustomerDropdown;
    
    if (this.showCustomerDropdown && this.filteredCustomers.length === 0) {
      this.filteredCustomers = this.customers.slice(0, 10);
    }
  }



  private loadCustomerHistory(customerId: string) {
    this.goldLoanService.getCustomerLoanHistory(customerId).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedCustomerHistory = response.data;
          const cleaned = this.cleanDataUrl(this.selectedCustomerHistory.profileImage);
          this.profileImageUrl = this.sanitizer.bypassSecurityTrustUrl(cleaned);

        }
      },
      error: (error) => {
        console.error('Error loading customer history:', error);
      }
    });
  }


  //newly added
  selectCustomer(customer: Customer) {
    this.loanForm.patchValue({
      customerId: customer.id,
      customerSearch: customer.customerName
    });
    this.showCustomerDropdown = false;
    this.loadCustomerHistory(customer.id);
    
    // Load customer image if exists
    if (customer.customerImage) {
      this.customerImage = customer.customerImage;
      this.loanForm.patchValue({ customerImage: customer.customerImage });
    }
  }
  
  private loadCustomerImage(customerId: string) {
    this.goldLoanService.getCustomerImage(customerId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customerImage = response.data;
          this.loanForm.patchValue({ customerImage: response.data });
        }
      },
      error: (error) => {
        console.error('Error loading customer image:', error);
        // Don't show error to user, just means no image exists
      }
    });
  }
  
  // Update the onCustomerImageSelected to handle both file input and camera

  async captureCustomerImage() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Use front camera for customer photo
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      
      // Pass type as 'customer'
      const modal = this.createCameraModal(video, stream, 'customer');
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions and try again.');
    }
  }
  
  browseCustomerImage() {
    const input = document.getElementById('customerImageBrowse') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }
  
  removeCustomerImage() {
    if (confirm('Are you sure you want to remove the customer photo?')) {
      this.customerImage = '';
      this.loanForm.patchValue({ customerImage: '' });
    }
  }
  
  // Add methods for item images
  async captureItemImage(index: number) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' // Use back camera for item photos
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      
      // Pass index and type to modal
      const modal = this.createCameraModal(video, stream, 'item', index);
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions and try again.');
    }
  }
  private createCameraModal(
    video: HTMLVideoElement, 
    stream: MediaStream, 
    captureType: 'customer' | 'item' = 'customer',
    itemIndex?: number
  ): HTMLElement {
    const modal = document.createElement('div');
    
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '99999';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '20px';
    modalContent.style.maxWidth = '600px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.position = 'relative';
    
    const title = captureType === 'customer' 
      ? 'Capture Customer Photo' 
      : `Capture Item ${(itemIndex || 0) + 1} Photo`;
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
        <h4 style="margin: 0; color: #333; font-size: 18px;">${title}</h4>
        <button type="button" id="closeCamera" style="background: none; border: none; font-size: 24px; color: #666; cursor: pointer; padding: 0; width: 30px; height: 30px;">&times;</button>
      </div>
      <div id="videoContainer" style="text-align: center; margin-bottom: 20px;"></div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button type="button" id="cancelCamera" style="padding: 10px 20px; border: 1px solid #6c757d; border-radius: 4px; background: #6c757d; color: white; cursor: pointer;">Cancel</button>
        <button type="button" id="captureBtn" style="padding: 10px 20px; border: 1px solid #007bff; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">📷 Capture</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    
    const videoContainer = modalContent.querySelector('#videoContainer') as HTMLElement;
    video.style.maxWidth = '60%';
    video.style.height = 'auto';
    video.style.borderRadius = '8px';
    video.style.border = '2px solid #007bff';
    videoContainer.appendChild(video);
    
    const closeBtn = modalContent.querySelector('#closeCamera') as HTMLButtonElement;
    const cancelBtn = modalContent.querySelector('#cancelCamera') as HTMLButtonElement;
    const captureBtn = modalContent.querySelector('#captureBtn') as HTMLButtonElement;
    
    const closeModal = () => {
      stream.getTracks().forEach(track => track.stop());
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    captureBtn.addEventListener('click', () => {
      this.captureImageFromVideo(video, captureType, itemIndex);
      closeModal();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    return modal;
  }
  private captureImageFromVideo(
    video: HTMLVideoElement, 
    captureType: 'customer' | 'item' = 'customer',
    itemIndex?: number
  ): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    if (captureType === 'customer') {
      // Update customer image
      this.customerImage = imageDataUrl;
      this.loanForm.patchValue({ customerImage: imageDataUrl });
    } else if (captureType === 'item' && itemIndex !== undefined) {
      // Update item image
      const itemGroup = this.pledgedItemsArray.at(itemIndex);
      const currentImages = itemGroup.get('images')?.value || '';
      const imagesArray = currentImages ? JSON.parse(currentImages) : [];
      
      imagesArray.push(imageDataUrl);
      itemGroup.patchValue({ images: JSON.stringify(imagesArray) });
    }
  }
  
  browseItemImage(index: number) {
    const input = document.getElementById(`itemImageBrowse_${index}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }
  //end

  onCustomerImageSelected(event: any) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should not exceed 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      this.customerImage = reader.result as string;
      this.loanForm.patchValue({ customerImage: this.customerImage });
    };
    
    reader.onerror = () => {
      alert('Error reading image file');
    };
    
    reader.readAsDataURL(file);
    
    event.target.value = '';
  }



  onItemGroupChange() {
    const itemGroupId = this.loanForm.get('itemGroupId')?.value;
    if (itemGroupId) {
      this.loadSchemesByItemGroup(itemGroupId);
      this.loadItemTypesByItemGroup(itemGroupId);
      this.loadGoldRatesByItemGroup(itemGroupId);
      this.loadFaultByItemGroup(itemGroupId);
      // Reset dependent fields
      this.loanForm.patchValue({ schemeId: '' });
      this.pledgedItemsArray.clear();
      this.addItem();
    }
  }

  private loadSchemesByItemGroup(itemGroupId: string) {
    this.goldLoanService.getSchemesByItemGroup(itemGroupId).subscribe({
      next: (response) => {
        if (response.success) {
          this.schemes = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading schemes:', error);
      }
    });
  }

  private loadItemTypesByItemGroup(itemGroupId: string) {
    this.goldLoanService.getItemTypesByItemGroup(itemGroupId).subscribe({
      next: (response) => {
        if (response.success) {
          this.itemTypes = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading item types:', error);
      }
    });
  }

  private loadGoldRatesByItemGroup(itemGroupId: string) {
    this.goldLoanService.getPuritiesByItemGroup(itemGroupId).subscribe({
      next: (response) => {
        if (response.success) {
          this.purities = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading purities:', error);
      }
    });
  }

  private loadFaultByItemGroup(itemGroupId: string) {
    this.goldLoanService.getJewelFaultByItemGroup(itemGroupId).subscribe({
      next: (response) => {
        if (response.success) {
          this.faults = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading faults:', error);
      }
    });
  }

  private getCurrentRateSetByArea(areaId: string) {
    this.goldLoanService.getCurrentRateSetByArea(areaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.goldRates = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading gold rates:', error);
        alert('Error loading gold rates, please set gold rates for the selected Area');
      }
    });
  }

  onSchemeChange(preserveDueMonths: boolean = false) {
    const schemeId = this.loanForm.get('schemeId')?.value;
    if (schemeId) {
      this.goldLoanService.getSchemeDetails(schemeId).subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedScheme = response.data;
            
            // Prepare the values to patch
            const valuesToPatch: any = {
              interestRate: this.selectedScheme.roi,
              advanceMonths: this.selectedScheme.advanceMonth,
              processingFeePercent: this.selectedScheme.processingFeePercent
            };
            
            // Only set dueMonths if not preserving (i.e., in create mode or user changed scheme)
            if (!preserveDueMonths) {
              valuesToPatch.dueMonths = this.selectedScheme.validityInMonths;
            }
            
            this.loanForm.patchValue(valuesToPatch);
            this.updateMaturityDate();
            this.calculateLoanAmounts();
          }
        },
        error: (error) => {
          console.error('Error loading scheme details:', error);
        }
      });
    }
  }
  private updateMaturityDate() {
    const loanDate = this.loanForm.get('loanDate')?.value;
    const dueMonths = this.loanForm.get('dueMonths')?.value;
    
    if (loanDate && dueMonths) {
      const maturityDate = this.calculateMaturityDate(loanDate, dueMonths);
      this.loanForm.patchValue({ maturityDate }, { emitEvent: false });
    }
  }

  searchItems(event: any, index: number) {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm.length > 0) {
      const filtered = this.itemTypes.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm)
      ).slice(0, 5);
      
      if (!this.filteredItems[index]) {
        this.filteredItems[index] = [];
      }
      this.filteredItems[index] = filtered;
      this.showItemDropdown[index] = true;
    } else {
      this.showItemDropdown[index] = false;
    }
  }

  selectItem(item: ItemType, index: number) {
    const itemGroup = this.pledgedItemsArray.at(index);
    itemGroup.patchValue({
      itemName: item.itemName,
      itemTypeId: item.id
    });
    this.showItemDropdown[index] = false;
  }

  onItemTypeChange(index: number) {
    const itemGroup = this.pledgedItemsArray.at(index);
    const itemTypeId = itemGroup.get('itemTypeId')?.value;
    
    const selectedItem = this.itemTypes.find(it => it.id === itemTypeId);
    if (selectedItem) {
      itemGroup.patchValue({ itemName: selectedItem.itemName });
    }
  }

  onPurityChange(index: number) {
    this.onWeightChange(index);
  }

  onWeightChange(index: number) {
    const itemGroup = this.pledgedItemsArray.at(index);
    const purityId = itemGroup.get('purityId')?.value;
    const grossWeight = itemGroup.get('grossWeight')?.value || 0;
    const stoneWeight = itemGroup.get('stoneWeight')?.value || 0;
    
    const reductionPercent = this.selectedScheme?.reductionPercent || 0;
    const selPurity = this.purities.find(purity => purity.id === purityId)?.purityPercentage;
    const redPercent = reductionPercent + (100 - (selPurity ? selPurity : 0));
    
    // Net weight = Gross weight - Stone weight - Reduction
    const weightAfterStone = grossWeight - stoneWeight;
    const netWeight = weightAfterStone * (1 - redPercent / 100);
    
    itemGroup.patchValue({ netWeight: netWeight });
    itemGroup.patchValue({ goldRate: this.goldRates.goldPurityRatePerGram });
    this.calculateItemValue(index);
  }

  calculateItemValue(index: number) {
    const itemGroup = this.pledgedItemsArray.at(index);
    const goldRate = itemGroup.get('goldRate')?.value || 0;
    const netWeight = itemGroup.get('netWeight')?.value || 0;
    const qty = itemGroup.get('qty')?.value || 1;
    
    const calculatedValue = goldRate * netWeight * qty;
    itemGroup.patchValue({ 
      calculatedValue: calculatedValue,
      maximumValue: calculatedValue
    });
  }

  addItem() {
    this.pledgedItemsArray.push(this.createItemGroup());
    this.showItemDropdown.push(false);
    this.filteredItems.push([]);
  }

  removeItem(index: number) {
    this.pledgedItemsArray.removeAt(index);
    this.showItemDropdown.splice(index, 1);
    this.filteredItems.splice(index, 1);
    this.calculateTotals();
  }

  calculateTotals() {
    this.totalQty = 0;
    this.totalGrossWeight = 0;
    this.totalStoneWeight = 0;
    this.totalNetWeight = 0;
    this.totalCalculatedValue = 0;
    this.totalMaximumValue = 0;

    this.pledgedItemsArray.controls.forEach(control => {
      this.totalQty += control.get('qty')?.value || 0;
      this.totalGrossWeight += control.get('grossWeight')?.value || 0;
      this.totalStoneWeight += control.get('stoneWeight')?.value || 0;
      this.totalNetWeight += control.get('netWeight')?.value || 0;
      this.totalCalculatedValue += control.get('calculatedValue')?.value || 0;
      this.totalMaximumValue += control.get('maximumValue')?.value || 0;
    });

    this.calculateLoanAmounts();
  }

  calculateLoanAmounts() {
    if (!this.selectedScheme || this.totalMaximumValue === 0) return;

    const request = {
      maximumValue: this.totalMaximumValue,
      roi: this.selectedScheme.roi,
      calculationMethod: this.selectedScheme.calculationMethod,
      dueMonths: this.selectedScheme.validityInMonths || 12,
      advanceMonths: this.loanForm.get('advanceMonths')?.value || 0,
      processingFeePercent: this.selectedScheme.processingFeePercent
    };

    this.goldLoanService.calculateLoan(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.maxLoanAmount = response.data.loanAmount;
          
          // If manual loan amount is not set or is 0, use calculated amount
          const manualAmount = this.loanForm.get('manualLoanAmount')?.value || 0;
          if (manualAmount === 0 || manualAmount > this.maxLoanAmount) {
            this.loanForm.patchValue({ manualLoanAmount: this.maxLoanAmount }, { emitEvent: false });
            this.loanAmount = this.maxLoanAmount;
          } else {
            this.loanAmount = manualAmount;
          }
          
          this.recalculateInterestAndFees();
        }
      },
      error: (error) => {
        console.error('Error calculating loan:', error);
      }
    });
  }

  onManualLoanAmountChange(value: number) {
    if (value > this.maxLoanAmount) {
      alert(`Loan amount cannot exceed maximum loan amount of ₹${this.maxLoanAmount}`);
      this.loanForm.patchValue({ manualLoanAmount: this.maxLoanAmount }, { emitEvent: false });
      this.loanAmount = this.maxLoanAmount;
    } else {
      this.loanAmount = value || 0;
    }
    
    this.recalculateInterestAndFees();
  }

  recalculateInterestAndFees() {
    if (!this.selectedScheme || this.loanAmount === 0) return;

    const request = {
      loanAmount: this.loanAmount,
      roi: this.selectedScheme.roi,
      calculationMethod: this.selectedScheme.calculationMethod,
      dueMonths: this.loanForm.get('dueMonths')?.value || 12,
      advanceMonths: this.loanForm.get('advanceMonths')?.value || 0,
      processingFeePercent: this.selectedScheme.processingFeePercent
    };

    this.goldLoanService.calculateInterestAndFees(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.interestAmount = response.data.interestAmount;
          this.advanceInterestAmount = response.data.advanceInterestAmount;
          this.processingFeeAmount = response.data.processingFeeAmount;
          this.netPayable = response.data.netPayable;
        }
      },
      error: (error) => {
        console.error('Error calculating interest and fees:', error);
      }
    });
  }

  onFileSelected(event: any, index: number) {
    const files = Array.from(event.target.files) as File[];
    const itemGroup = this.pledgedItemsArray.at(index);
    
    if (files.length === 0) return;
    
    const currentImages = itemGroup.get('images')?.value || '';
    const imagesArray = currentImages ? JSON.parse(currentImages) : [];
    
    let processedCount = 0;
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        imagesArray.push(reader.result as string);
        processedCount++;
        
        if (processedCount === files.length) {
          itemGroup.patchValue({ images: JSON.stringify(imagesArray) });
        }
      };
      
      reader.onerror = () => {
        alert(`Error reading ${file.name}`);
      };
      
      reader.readAsDataURL(file);
    });
    
    event.target.value = '';
  }

  removeImage(index: number, imageIndex: number) {
    const itemGroup = this.pledgedItemsArray.at(index);
    const currentImages = itemGroup.get('images')?.value || '';
    
    if (!currentImages) return;
    
    const imagesArray = JSON.parse(currentImages);
    imagesArray.splice(imageIndex, 1);
    itemGroup.patchValue({ images: JSON.stringify(imagesArray) });
  }

  private checkEditMode() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.loanId = params['id'];
        if (this.loanId) {
          this.loadLoanData(this.loanId);
        }
      } else {
        this.generateLoanNumber();
      }
    });
  }

  private generateLoanNumber() {
    this.goldLoanService.generateLoanNumber().subscribe({
      next: (response) => {
        if (response.success) {
          this.loanForm.patchValue({ loanNumber: response.data });
        }
      },
      error: (error) => {
        console.error('Error generating loan number:', error);
      }
    });
  }

  private loadLoanData(id: string) {
    this.isLoading = true;
    this.goldLoanService.getGoldLoanById(id).subscribe({
      next: (response) => {
        console.log('Load Loan Response:', response);
        
        if (response.success) {
          const loan = response.data;
          
          // First load the area to enable dependent dropdowns
          if (loan.areaId) {
            this.loanForm.patchValue({ areaId: loan.areaId });
            this.loadCustomersByArea(loan.areaId);
            this.loadItemGroupsByArea(loan.areaId);
            this.getCurrentRateSetByArea(loan.areaId);
          }
          
          // Then load item group to get schemes and item types
          if (loan.itemGroupId) {
            setTimeout(() => {
              this.loanForm.patchValue({ itemGroupId: loan.itemGroupId });
              this.loadSchemesByItemGroup(loan.itemGroupId);
              this.loadItemTypesByItemGroup(loan.itemGroupId);
              this.loadGoldRatesByItemGroup(loan.itemGroupId);
              this.loadFaultByItemGroup(loan.itemGroupId);
            }, 300);
          }
          
          // Load scheme details
          if (loan.schemeId) {
            setTimeout(() => {
              this.loanForm.patchValue({ schemeId: loan.schemeId }, { emitEvent: false });
              this.onSchemeChange(true); // Pass true to preserve dueMonths from database
            }, 600);
          }
          
          // Format dates properly
          const loanDate = loan.loanDate ? new Date(loan.loanDate).toISOString().split('T')[0] : '';
          const maturityDate = loan.maturityDate ? new Date(loan.maturityDate).toISOString().split('T')[0] : '';
          
          // Patch form values
          this.loanForm.patchValue({
            id:loan.id,
            series: loan.series || 'GOLD SERIES',
            loanNumber: loan.loanNumber || '',
            refNumber: loan.refNumber || '',
            loanDate: loanDate,
            maturityDate: maturityDate,
            customerId: loan.customerId || '',
            customerSearch: loan.customer?.customerName||'',  // Will be set after loading customer
            customerImage: loan.customerImage || '',
            interestRate: loan.interestRate || 0,
            advanceMonths: loan.advanceMonths || 0,
            dueMonths: loan.dueMonths || 12,
            processingFeePercent: loan.processingFeePercent || 0,
            manualLoanAmount: loan.loanAmount || 0,
            remarks: loan.remarks || ''
          }, { emitEvent: false });
  
          // Load customer image and history
          if (loan.customerId) {
            this.loadCustomerHistory(loan.customerId);
          }
          
          if (loan.customerImage) {
            this.customerImage = loan.customerImage;
          }
  
          // Clear existing items and load pledged items
          this.pledgedItemsArray.clear();
          this.filteredItems = [];
          this.showItemDropdown = [];
          
          if (loan.pledgedItems && loan.pledgedItems.length > 0) {
            loan.pledgedItems.forEach((item: any, index: number) => {
              const itemGroup = this.createItemGroup();
              
              // Patch item values
              itemGroup.patchValue({
                itemTypeId: item.itemTypeId || '',
                itemName: item.itemName || '',
                purityId: item.purityId || '',
                goldRate: item.goldRate || 0,
                qty: item.qty || 1,
                grossWeight: item.grossWeight || 0,
                stoneWeight: item.stoneWeight || 0,
                netWeight: item.netWeight || 0,
                calculatedValue: item.calculatedValue || 0,
                maximumValue: item.maximumValue || 0,
                remarks: item.remarks || '',
                images: item.images || '',
                jewelFault: item.jewelFault || '',
                huid: item.huid || '',
                hallmarkPurity: item.hallmarkPurity || '',
                hallmarkGrossWeight: item.hallmarkGrossWeight || 0,
                hallmarkNetWeight: item.hallmarkNetWeight || 0
              }, { emitEvent: false });
              
              this.pledgedItemsArray.push(itemGroup);
              this.filteredItems.push([]);
              this.showItemDropdown.push(false);
            });
          } else {
            // Add one empty item if no items exist
            this.addItem();
          }
          
          // Calculate totals after loading
          setTimeout(() => {
            this.calculateTotals();
          }, 1000);
          
          console.log('Loan loaded successfully:', loan);
        } else {
          alert('Failed to load loan: ' + response.message);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading loan:', error);
        
        // Better error messages
        let errorMessage = 'Failed to load loan data.';
        if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.status === 404) {
          errorMessage = 'Loan not found.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        alert(errorMessage);
        this.isLoading = false;
        this.router.navigate(['/viewloan']);
      }
    });
  }

  onSubmit() {
    if (this.loanForm.valid) {
      this.isLoading = true;

      const loanData: GoldLoan = {
        ...this.loanForm.value,
        id:this.loanId,
        loanDate: new Date(this.loanForm.value.loanDate),
        maturityDate: new Date(this.loanForm.value.maturityDate),
        loanAmount: this.loanAmount,
        interestAmount: this.interestAmount,
        advanceInterestAmount: this.advanceInterestAmount,
        processingFeeAmount: this.processingFeeAmount,
        netPayable: this.netPayable,
        totalQty: this.totalQty,
        totalGrossWeight: this.totalGrossWeight,
        totalStoneWeight: this.totalStoneWeight,
        totalNetWeight: this.totalNetWeight,
        totalCalculatedValue: this.totalCalculatedValue,
        totalMaximumValue: this.totalMaximumValue,
        status: 'Open',
        customerImage:this.customerImage
      };

      console.log('Submitting loan data:', loanData);

      const operation = this.isEditMode && this.loanId
        ? this.goldLoanService.updateGoldLoan(this.loanId, loanData)
        : this.goldLoanService.createGoldLoan(loanData);

      operation.subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Loan ${this.isEditMode ? 'updated' : 'created'} successfully!`);
            this.router.navigate(['/viewloan']);
          } else {
            alert(`Failed to ${this.isEditMode ? 'update' : 'create'} loan: ${response.message}`);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving loan:', error);
          alert(`Failed to ${this.isEditMode ? 'update' : 'create'} loan.`);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
      alert('Please fill all required fields');
    }
  }

  onCancel() {
    if (this.loanForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/viewloan']);
      }
    } else {
      this.router.navigate(['/viewloan']);
    }
  }

  deleteLoan() {
    if (!this.loanId) return;
    
    if (confirm('Are you sure you want to delete this loan?')) {
      this.goldLoanService.deleteGoldLoan(this.loanId).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Loan deleted successfully!');
            this.router.navigate(['/viewloan']);
          }
        },
        error: (error) => {
          console.error('Error deleting loan:', error);
          alert('Failed to delete loan.');
        }
      });
    }
  }

  goBack() {
    window.history.back();
  }

  private markFormGroupTouched() {
    Object.keys(this.loanForm.controls).forEach(key => {
      const control = this.loanForm.get(key);
      control?.markAsTouched();
    });
  }

  private calculateMaturityDate(loanDate?: string, dueMonths?: number): string {
    const date = loanDate ? new Date(loanDate) : new Date();
    const months = dueMonths || 12;
    
    // Add the due months to the loan date
    date.setMonth(date.getMonth() + months);
    
    return date.toISOString().split('T')[0];
  }

  getImageArray(images: string): string[] {
    if (!images) return [];
    try {
      return JSON.parse(images);
    } catch (error) {
      console.error('Error parsing images:', error);
      return [];
    }
  }
}