import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { JewelFaultService, JewelFault } from '../../service/jewel-fault.service';
import { ItemGroupService, ItemGroup } from '../../service/Item-group-service';

@Component({
  selector: 'app-jewel-fault-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './jewel-fault-component.html',
  styleUrl: './jewel-fault-component.scss'
})
export class JewelFaultComponent implements OnInit {
  faultForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  faultId?: string;
  currentFault?: JewelFault;
  itemGroups: ItemGroup[] = [];

  faultTypes = [
    { value: 'PHYSICAL', label: 'Physical Damage' },
    { value: 'QUALITY', label: 'Quality Issue' },
    { value: 'STRUCTURAL', label: 'Structural Damage' },
    { value: 'AESTHETIC', label: 'Aesthetic Issue' }
  ];

  severityLevels = [
    { value: 'LOW', label: 'Low', description: 'Minor cosmetic issues' },
    { value: 'MEDIUM', label: 'Medium', description: 'Noticeable defects' },
    { value: 'HIGH', label: 'High', description: 'Significant damage' },
    { value: 'CRITICAL', label: 'Critical', description: 'Major structural issues' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jewelFaultService: JewelFaultService,
    private itemGroupService: ItemGroupService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadItemGroups();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.faultId = id;
        this.isEditMode = true;
        this.loadFaultData(id);
      } else {
        this.generateFaultCode();
      }
    });
  }

  initializeForm(): void {
    this.faultForm = this.formBuilder.group({
      faultCode: ['', [
        Validators.required, 
        Validators.pattern(/^JF\d{3}$/),
        Validators.minLength(5),
        Validators.maxLength(5)
      ]],
      faultName: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      faultType: ['', Validators.required],
      description: ['', [
        Validators.maxLength(200)
      ]],
      severity: ['', Validators.required],
      affectsValuation: [false],
      valuationImpactPercentage: [{ value: 0, disabled: true }, [
        Validators.min(0),
        Validators.max(100)
      ]],
      itemGroupId: ['', Validators.required],
      isActive: [true]
    });

    // Auto-format fault code to uppercase
    this.faultForm.get('faultCode')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperValue = value.toUpperCase();
        if (upperValue !== value) {
          this.faultForm.get('faultCode')?.setValue(upperValue, { emitEvent: false });
        }
      }
    });

    // Enable/disable valuation impact percentage based on checkbox
    this.faultForm.get('affectsValuation')?.valueChanges.subscribe(affects => {
      const impactControl = this.faultForm.get('valuationImpactPercentage');
      if (affects) {
        impactControl?.enable();
        impactControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      } else {
        impactControl?.disable();
        impactControl?.setValue(0);
        impactControl?.setValidators([Validators.min(0), Validators.max(100)]);
      }
      impactControl?.updateValueAndValidity();
    });
  }

  loadItemGroups(): void {
    const filter = {
      status: 'active' as const
    };
    
    this.itemGroupService.getItemGroups(filter).subscribe({
      next: (groups:any) => {
        this.itemGroups = groups;
      },
      error: (error:any) => {
        console.error('Error loading item groups:', error);
        alert('Failed to load item groups. Please try again.');
      }
    });
  }

  loadFaultData(id: string): void {
    this.isLoading = true;
    
    this.jewelFaultService.getJewelFaultById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentFault = response.data;
          
          // Pre-fill the form with existing data
          this.faultForm.patchValue({
            faultCode: response.data.faultCode,
            faultName: response.data.faultName,
            faultType: response.data.faultType,
            description: response.data.description || '',
            severity: response.data.severity,
            affectsValuation: response.data.affectsValuation,
            valuationImpactPercentage: response.data.valuationImpactPercentage || 0,
            itemGroupId: response.data.itemGroupId,
            isActive: response.data.isActive
          });
          
          // Make fault code readonly in edit mode
          this.faultForm.get('faultCode')?.disable();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading jewel fault:', error);
        alert('Failed to load jewel fault data. Redirecting to list...');
        this.router.navigate(['/jewelfault']);
        this.isLoading = false;
      }
    });
  }

  generateFaultCode(): void {
    this.jewelFaultService.generateFaultCode().subscribe({
      next: (response) => {
        if (response.success) {
          this.faultForm.patchValue({ faultCode: response.data });
        }
      },
      error: (error) => {
        console.error('Error generating fault code:', error);
        // Fallback to default
        this.faultForm.patchValue({ faultCode: 'JF001' });
      }
    });
  }

  onSubmit(): void {
    if (this.faultForm.valid) {
      this.isLoading = true;
      
      // Get the fault code value (whether enabled or disabled)
      const faultCode = this.faultForm.get('faultCode')?.value || this.currentFault?.faultCode;
      
      const faultData: JewelFault = {
        faultCode: faultCode!,
        faultName: this.faultForm.value.faultName,
        faultType: this.faultForm.value.faultType,
        description: this.faultForm.value.description,
        severity: this.faultForm.value.severity,
        affectsValuation: this.faultForm.value.affectsValuation,
        valuationImpactPercentage: this.faultForm.value.affectsValuation 
          ? this.faultForm.value.valuationImpactPercentage 
          : undefined, // Changed from 0 to undefined
        itemGroupId: this.faultForm.value.itemGroupId,
        isActive: this.faultForm.value.isActive
      };

      if (this.isEditMode && this.faultId) {
        // Update existing jewel fault
        faultData.id = this.faultId;
        this.jewelFaultService.updateJewelFault(this.faultId, faultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success) {
              alert('Jewel fault updated successfully!');
              this.router.navigate(['/jewelfault']);
            } else {
              alert(response.message || 'Failed to update jewel fault');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating jewel fault:', error);
            alert(error.error?.message || 'An error occurred while updating the jewel fault');
          }
        });
      } else {
        // Create new jewel fault
        this.jewelFaultService.createJewelFault(faultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success) {
              alert('Jewel fault added successfully!');
              this.router.navigate(['/jewelfault']);
            } else {
              alert(response.message || 'Failed to add jewel fault');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating jewel fault:', error);
            alert(error.error?.message || 'An error occurred while creating the jewel fault');
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    if (this.faultForm.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/jewelfault']);
      }
    } else {
      this.router.navigate(['/jewelfault']);
    }
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.faultForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.faultForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'faultCode') {
          return 'Fault code must be in format JF001 (JF + 3 numbers)';
        }
        return `Invalid ${this.getFieldDisplayName(fieldName)} format`;
      }
      if (field.errors['minlength']) {
        if (fieldName === 'faultCode') {
          return 'Fault code must be exactly 5 characters';
        }
        return `${this.getFieldDisplayName(fieldName)} is too short`;
      }
      if (field.errors['maxlength']) {
        if (fieldName === 'faultCode') {
          return 'Fault code must be exactly 5 characters';
        }
        if (fieldName === 'description') {
          return 'Description cannot exceed 200 characters';
        }
        return `${this.getFieldDisplayName(fieldName)} is too long`;
      }
      if (field.errors['min']) {
        return 'Value must be at least 0';
      }
      if (field.errors['max']) {
        return 'Value cannot exceed 100';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'faultCode': 'Fault Code',
      'faultName': 'Fault Name',
      'faultType': 'Fault Type',
      'description': 'Description',
      'severity': 'Severity Level',
      'valuationImpactPercentage': 'Impact Percentage',
      'itemGroupId': 'Item Group'
    };
    return displayNames[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.faultForm.controls).forEach(key => {
      const control = this.faultForm.get(key);
      control?.markAsTouched();
    });
  }

  getSeverityDescription(severity: string): string {
    const level = this.severityLevels.find(s => s.value === severity);
    return level ? level.description : '';
  }
}