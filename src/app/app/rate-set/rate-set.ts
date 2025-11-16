import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AreaService, AreaDropdown } from '../../service/area-service';
import { RateSetService, AddRateSetRequest, RateSet } from '../../service/rate-set.service';

@Component({
  selector: 'app-add-rateset',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rate-set.html',
  styleUrl: './rate-set.scss'
})
export class AddRateSetComponent implements OnInit {
  private areaService = inject(AreaService);
  private rateSetService = inject(RateSetService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  rateSetForm!: FormGroup;
  isLoading = false;
  isLoadingAreas = false;
  isEditMode = false;
  rateSetId?: string;
  currentRateSet?: RateSet;
  areas: AreaDropdown[] = [];

  ngOnInit(): void {
    this.checkEditMode();
    this.loadAreas();
    this.initializeForm();
  }

  checkEditMode(): void {
    this.rateSetId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.rateSetId;

    if (this.isEditMode && this.rateSetId) {
      this.loadRateSetData(this.rateSetId);
    }
  }

  loadRateSetData(id: string): void {
    this.isLoading = true;
    this.rateSetService.getRateSetById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentRateSet = response.data;
          this.patchFormValues(this.currentRateSet);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading rate set:', error);
        alert('Failed to load rate set data. Please try again.');
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      }
    });
  }

  patchFormValues(rateSet: RateSet): void {
    const effectiveDate = rateSet.effectiveDate 
      ? new Date(rateSet.effectiveDate).toISOString().split('T')[0]
      : '';

    this.rateSetForm.patchValue({
      areaId: rateSet.areaId,
      effectiveDate: effectiveDate,
      goldRatePerGram: rateSet.goldRatePerGram,
      goldPurityRatePerGram: rateSet.goldPurityRatePerGram,
      silverRatePerGram: rateSet.silverRatePerGram,
      silverPurityRatePerGram: rateSet.silverPurityRatePerGram,
      notes: rateSet.notes || ''
    });
  }

  initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.rateSetForm = this.formBuilder.group({
      areaId: ['', Validators.required],
      effectiveDate: [today, Validators.required],
      goldRatePerGram: ['', [Validators.required, Validators.min(0.01)]],
      goldPurityRatePerGram: ['', [Validators.required, Validators.min(0.01)]],
      silverRatePerGram: ['', [Validators.required, Validators.min(0.01)]],
      silverPurityRatePerGram: ['', [Validators.required, Validators.min(0.01)]],
      notes: ['', Validators.maxLength(500)]
    });
  }

  // Add this new method to get minimum date (today)
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadAreas(): void {
    this.isLoadingAreas = true;
    
    // TODO: Replace with actual company ID from logged-in user
    // For now, hardcoding a company ID - update this GUID to match a company in your database
    const TEMP_COMPANY_ID = '7017c5c5-4a3f-43fd-8bec-c4da82d48047'; // Replace with actual company GUID
    
    this.areaService.getAreasByCompany(TEMP_COMPANY_ID).subscribe({
      next: (areas) => {
        // Map full Area objects to AreaDropdown format
        this.areas = areas.map(area => ({
          id: area.id,
          areaCode: area.areaCode,
          areaName: area.areaName
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

  onSubmit(): void {
    if (this.rateSetForm.valid) {
      this.isLoading = true;
      
      const rateSetData: any = {
        areaId: this.rateSetForm.value.areaId,
        effectiveDate: this.rateSetForm.value.effectiveDate,
        goldRatePerGram: parseFloat(this.rateSetForm.value.goldRatePerGram),
        goldPurityRatePerGram: parseFloat(this.rateSetForm.value.goldPurityRatePerGram),
        silverRatePerGram: parseFloat(this.rateSetForm.value.silverRatePerGram),
        silverPurityRatePerGram: parseFloat(this.rateSetForm.value.silverPurityRatePerGram),
        notes: this.rateSetForm.value.notes
      };

      // Add ID when updating
      if (this.isEditMode && this.rateSetId) {
        rateSetData.id = this.rateSetId;
      }

      const operation = this.isEditMode && this.rateSetId
        ? this.rateSetService.updateRateSet(this.rateSetId, rateSetData)
        : this.rateSetService.createRateSet(rateSetData);

      operation.subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Rate set ${this.isEditMode ? 'updated' : 'created'} successfully!`);
            this.router.navigate(['/dashboard']);
          } else {
            alert(`Failed to ${this.isEditMode ? 'update' : 'create'} rate set: ${response.message}`);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving rate set:', error);
          let errorMessage = 'An unexpected error occurred';
          
          if (error.status === 409) {
            errorMessage = 'Rate set for this area and date already exists. Please choose a different date.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          alert(`Failed to ${this.isEditMode ? 'update' : 'create'} rate set: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    if (this.rateSetForm.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.rateSetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.rateSetForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['min']) {
        if (fieldName.includes('Rate')) {
          return 'Rate must be greater than 0';
        }
        return `${this.getFieldDisplayName(fieldName)} must be positive`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'areaId': 'Area',
      'effectiveDate': 'Effective Date',
      'goldRatePerGram': 'Gold Rate/Gram',
      'goldPurityRatePerGram': 'Gold Purity Rate/Gram',
      'silverRatePerGram': 'Silver Rate/Gram',
      'silverPurityRatePerGram': 'Silver Purity Rate/Gram',
      'notes': 'Notes'
    };
    return displayNames[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.rateSetForm.controls).forEach(key => {
      const control = this.rateSetForm.get(key);
      control?.markAsTouched();
    });
  }
}