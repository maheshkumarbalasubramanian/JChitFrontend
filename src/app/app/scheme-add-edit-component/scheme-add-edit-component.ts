import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AreaService } from '../../service/area-service';
import { ItemGroupService } from '../../service/Item-group-service';
import { SchemeService,Scheme } from '../../service/scheme.service';

interface AreaDropdown {
  id: string;
  areaCode: string;
  areaName: string;
}

interface ItemGroupDropdown {
  id: string;
  groupCode: string;
  groupName: string;
}

@Component({
  selector: 'app-scheme-add-edit-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './scheme-add-edit-component.html',
  styleUrl: './scheme-add-edit-component.scss'
})
export class SchemeAddEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private areaService = inject(AreaService);
  private itemGroupService = inject(ItemGroupService);
  private schemeService = inject(SchemeService);

  schemeForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isLoadingAreas = false;
  isLoadingItemGroups = false;
  schemeId?: string;
  areas: AreaDropdown[] = [];
  itemGroups: ItemGroupDropdown[] = [];

  // Hardcoded company ID - replace when you have authentication
  private readonly TEMP_COMPANY_ID = '7017c5c5-4a3f-43fd-8bec-c4da82d48047';

  ngOnInit() {
    this.initializeForm();
    this.loadAreas();
    this.checkEditMode();
    this.setupAreaChangeListener();
  }

  private setupAreaChangeListener() {
    this.schemeForm.get('areaId')?.valueChanges.subscribe(areaId => {
      if (areaId) {
        this.loadItemGroupsByArea(areaId);
      } else {
        this.itemGroups = [];
        this.schemeForm.patchValue({ itemGroupId: '' });
      }
    });
  }

  private loadAreas() {
    this.isLoadingAreas = true;
    this.areaService.getAreasByCompany(this.TEMP_COMPANY_ID).subscribe({
      next: (areas) => {
        this.areas = areas.map(a => ({
          id: a.id,
          areaCode: a.areaCode,
          areaName: a.areaName
        }));
        this.isLoadingAreas = false;
      },
      error: (error) => {
        console.error('Error loading areas:', error);
        alert('Failed to load areas. Please refresh the page.');
        this.isLoadingAreas = false;
      }
    });
  }

  private loadItemGroupsByArea(areaId: string) {
    this.isLoadingItemGroups = true;
    this.itemGroupService.getItemGroupsByArea(areaId).subscribe({
      next: (response) => {
        this.itemGroups = response.map(g => ({
          id: g.id,
          groupCode: g.groupCode,
          groupName: g.groupName
        }));
        this.isLoadingItemGroups = false;
      },
      error: (error) => {
        console.error('Error loading item groups:', error);
        this.itemGroups = [];
        this.isLoadingItemGroups = false;
      }
    });
  }

  private initializeForm() {
    this.schemeForm = this.fb.group({
      // Basic Information
      schemeCode: [{value: '', disabled: true}, Validators.required],
      schemeName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      areaId: ['', Validators.required],
      itemGroupId: ['', Validators.required],
      isStdRoi: [false],
      calculationBased: ['Monthly', Validators.required],

      // Calculation Method
      calculationMethod: ['', Validators.required],
      roi: [0, [Validators.required, Validators.min(0.1), Validators.max(100)]],
      customizedStyle: ['VelBankers'],

      // Compound Interest Fields
      compoundingFrequency: ['Monthly'],
      penaltyRate: [0, [Validators.min(0), Validators.max(50)]],
      penaltyGraceDays: [0, [Validators.min(0), Validators.max(30)]],

      // EMI Fields
      emiTenure: [12, [Validators.min(1), Validators.max(120)]],

      // Processing Fee
      processingFeeSlab: [false],
      processingFeePercent: [0.1, [Validators.min(0), Validators.max(10)]],

      // Grace Period & Calculation Days
      minCalcDays: [15, [Validators.min(1), Validators.max(365)]],
      graceDays: [0, [Validators.min(0), Validators.max(30)]],
      advanceMonth: [1, [Validators.min(0), Validators.max(12)]],

      // Loan Value Limits
      minMarketValue: [0, [Validators.min(0)]],
      maxMarketValue: [100000, [Validators.min(0)]],
      minLoanValue: [1000, [Validators.min(0)]],
      maxLoanValue: [50000, [Validators.min(0)]],

      // Additional Configuration
      reductionPercent: [0, [Validators.min(0), Validators.max(100)]],
      validityInMonths: [12, [Validators.min(1), Validators.max(60)]],
      interestPercentAfterValidity: [0, [Validators.min(0), Validators.max(100)]],

      // Status
      isActive: [true]
    });

    this.addCustomValidators();
  }

  private addCustomValidators() {
    this.schemeForm.get('maxMarketValue')?.valueChanges.subscribe(() => {
      this.validateMinMaxValues('minMarketValue', 'maxMarketValue');
    });

    this.schemeForm.get('minMarketValue')?.valueChanges.subscribe(() => {
      this.validateMinMaxValues('minMarketValue', 'maxMarketValue');
    });

    this.schemeForm.get('maxLoanValue')?.valueChanges.subscribe(() => {
      this.validateMinMaxValues('minLoanValue', 'maxLoanValue');
    });

    this.schemeForm.get('minLoanValue')?.valueChanges.subscribe(() => {
      this.validateMinMaxValues('minLoanValue', 'maxLoanValue');
    });
  }

  private validateMinMaxValues(minField: string, maxField: string) {
    const minValue = this.schemeForm.get(minField)?.value;
    const maxValue = this.schemeForm.get(maxField)?.value;

    if (minValue && maxValue && minValue >= maxValue) {
      this.schemeForm.get(maxField)?.setErrors({ minGreaterThanMax: true });
    } else {
      const maxControl = this.schemeForm.get(maxField);
      if (maxControl?.errors?.['minGreaterThanMax']) {
        delete maxControl.errors['minGreaterThanMax'];
        if (Object.keys(maxControl.errors).length === 0) {
          maxControl.setErrors(null);
        }
      }
    }
  }

  private checkEditMode() {
    this.schemeId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.schemeId;

    if (this.isEditMode && this.schemeId) {
      this.loadSchemeData(this.schemeId);
    } else {
      this.generateSchemeCode();
    }
  }

  private generateSchemeCode() {
    this.schemeService.generateSchemeCode().subscribe({
      next: (response) => {
        if (response.success) {
          this.schemeForm.patchValue({ schemeCode: response.data });
        } else {
          const timestamp = Date.now().toString().slice(-6);
          this.schemeForm.patchValue({ schemeCode: `SCH${timestamp}` });
        }
      },
      error: () => {
        const timestamp = Date.now().toString().slice(-6);
        this.schemeForm.patchValue({ schemeCode: `SCH${timestamp}` });
      }
    });
  }

  private loadSchemeData(id: string) {
    this.isLoading = true;
    this.schemeService.getSchemeById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const scheme = response.data;
          this.schemeForm.patchValue({
            schemeCode: scheme.schemeCode,
            schemeName: scheme.schemeName,
            areaId: scheme.areaId,
            itemGroupId: scheme.itemGroupId,
            roi: scheme.roi,
            calculationMethod: scheme.calculationMethod,
            isStdRoi: scheme.isStdRoi,
            calculationBased: scheme.calculationBased,
            customizedStyle: scheme.customizedStyle,
            processingFeeSlab: scheme.processingFeeSlab,
            minCalcDays: scheme.minCalcDays,
            graceDays: scheme.graceDays,
            advanceMonth: scheme.advanceMonth,
            processingFeePercent: scheme.processingFeePercent,
            minMarketValue: scheme.minMarketValue,
            maxMarketValue: scheme.maxMarketValue,
            minLoanValue: scheme.minLoanValue,
            maxLoanValue: scheme.maxLoanValue,
            penaltyRate: scheme.penaltyRate || 0,
            penaltyGraceDays: scheme.penaltyGraceDays || 0,
            compoundingFrequency: scheme.compoundingFrequency || 'Monthly',
            emiTenure: scheme.emiTenure || 12,
            reductionPercent: scheme.reductionPercent,
            validityInMonths: scheme.validityInMonths,
            interestPercentAfterValidity: scheme.interestPercentAfterValidity,
            isActive: scheme.isActive
          });
          
          // Load item groups for the selected area
          if (scheme.areaId) {
            this.loadItemGroupsByArea(scheme.areaId);
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading scheme:', error);
        alert('Failed to load scheme data. Please try again.');
        this.isLoading = false;
        this.router.navigate(['/schemes']);
      }
    });
  }

  onCalculationMethodChange() {
    const method = this.schemeForm.get('calculationMethod')?.value;
    
    this.schemeForm.patchValue({
      penaltyRate: 0,
      penaltyGraceDays: 0,
      compoundingFrequency: 'Monthly',
      emiTenure: 12,
      customizedStyle: 'VelBankers'
    });

    this.schemeForm.get('penaltyRate')?.clearValidators();
    this.schemeForm.get('penaltyGraceDays')?.clearValidators();
    this.schemeForm.get('emiTenure')?.clearValidators();

    if (method === 'Compound') {
      this.schemeForm.get('penaltyRate')?.setValidators([Validators.min(0), Validators.max(50)]);
      this.schemeForm.get('penaltyGraceDays')?.setValidators([Validators.min(0), Validators.max(30)]);
    } else if (method === 'Emi') {
      this.schemeForm.get('emiTenure')?.setValidators([Validators.required, Validators.min(1), Validators.max(120)]);
    }

    this.schemeForm.get('penaltyRate')?.updateValueAndValidity();
    this.schemeForm.get('penaltyGraceDays')?.updateValueAndValidity();
    this.schemeForm.get('emiTenure')?.updateValueAndValidity();
  }

  showCustomizedStyle(): boolean {
    return this.schemeForm.get('calculationMethod')?.value === 'Customized';
  }

  isCompoundInterest(): boolean {
    return this.schemeForm.get('calculationMethod')?.value === 'Compound';
  }

  isEmiMethod(): boolean {
    return this.schemeForm.get('calculationMethod')?.value === 'Emi';
  }

  onSubmit() {
    if (this.schemeForm.valid) {
      this.isLoading = true;
      
      const formValue = this.schemeForm.getRawValue();
      
      // Ensure boolean fields are actual booleans, not strings
      const schemeData: Scheme = {
        ...formValue,
        schemeCode: this.schemeForm.get('schemeCode')?.value,
        // Convert to boolean explicitly
        processingFeeSlab: formValue.processingFeeSlab === true || formValue.processingFeeSlab === 'true',
        isStdRoi: formValue.isStdRoi === true || formValue.isStdRoi === 'true',
        isActive: formValue.isActive === true || formValue.isActive === 'true'
      };
  
      if (this.isEditMode && this.schemeId) {
        schemeData.id = this.schemeId;
      }
  
      const operation = this.isEditMode && this.schemeId
        ? this.schemeService.updateScheme(this.schemeId, schemeData)
        : this.schemeService.createScheme(schemeData);
  
      operation.subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Scheme ${this.isEditMode ? 'updated' : 'created'} successfully!`);
            this.router.navigate(['/schemes']);
          } else {
            alert(`Failed to ${this.isEditMode ? 'update' : 'create'} scheme: ${response.message}`);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving scheme:', error);
          const errorMessage = error.error?.message || 'An unexpected error occurred';
          alert(`Failed to ${this.isEditMode ? 'update' : 'create'} scheme: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
      this.scrollToFirstError();
    }
  }

  onCancel() {
    if (this.schemeForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/schemes']);
      }
    } else {
      this.router.navigate(['/schemes']);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.schemeForm.controls).forEach(key => {
      const control = this.schemeForm.get(key);
      control?.markAsTouched();
    });
  }

  private scrollToFirstError() {
    const firstErrorElement = document.querySelector('.is-invalid');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.schemeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.schemeForm.get(fieldName);
    if (field && field.errors) {
      const fieldDisplayName = this.getFieldDisplayName(fieldName);
      
      if (field.errors['required']) {
        return `${fieldDisplayName} is required`;
      }
      if (field.errors['min']) {
        return `${fieldDisplayName} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${fieldDisplayName} cannot exceed ${field.errors['max'].max}`;
      }
      if (field.errors['minlength']) {
        return `${fieldDisplayName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${fieldDisplayName} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['minGreaterThanMax']) {
        return `Maximum value must be greater than minimum value`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'schemeCode': 'Scheme Code',
      'schemeName': 'Scheme Name',
      'areaId': 'Area',
      'itemGroupId': 'Item Group',
      'roi': 'ROI',
      'calculationMethod': 'Calculation Method',
      'calculationBased': 'Calculation Based',
      'customizedStyle': 'Customized Style',
      'processingFeePercent': 'Processing Fee Percentage',
      'minCalcDays': 'Minimum Calculation Days',
      'graceDays': 'Grace Days',
      'advanceMonth': 'Advance Month',
      'minMarketValue': 'Minimum Market Value',
      'maxMarketValue': 'Maximum Market Value',
      'minLoanValue': 'Minimum Loan Value',
      'maxLoanValue': 'Maximum Loan Value',
      'penaltyRate': 'Penalty Rate',
      'penaltyGraceDays': 'Penalty Grace Days',
      'emiTenure': 'EMI Tenure',
      'reductionPercent': 'Reduction Percentage',
      'validityInMonths': 'Validity in Months',
      'interestPercentAfterValidity': 'Interest Percent After Validity'
    };
    return displayNames[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
}