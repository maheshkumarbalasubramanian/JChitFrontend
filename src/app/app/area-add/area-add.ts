import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AreaService, CompanyOption } from '../../service/area-service';

export interface AddAreaRequest {
  areaCode: string;
  areaName: string;
  description?: string;
}

@Component({
  selector: 'app-add-area',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './area-add.html',
  styleUrl: './area-add.scss'
})
export class AddAreaComponent implements OnInit {
  areaForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  areaId: string | null = null;
  companies: CompanyOption[] = [];
  loadingCompanies = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private areaService: AreaService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCompanies();
    this.checkEditMode();
  }

  initializeForm(): void {
    this.areaForm = this.formBuilder.group({
      companyId: ['', [Validators.required]],
      areaCode: ['', [
        Validators.required, 
        Validators.pattern(/^[A-Z]{2}\d{3}$/),
        Validators.minLength(5),
        Validators.maxLength(5)
      ]],
      areaName: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      areaType: ['PRIMARY', [Validators.required]],
      pincode: ['', [
        Validators.pattern(/^\d{6}$/)
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]]
    });

    // Auto-format area code to uppercase
    this.areaForm.get('areaCode')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperValue = value.toUpperCase();
        if (upperValue !== value) {
          this.areaForm.get('areaCode')?.setValue(upperValue, { emitEvent: false });
        }
      }
    });
  }

  loadCompanies(): void {
    this.loadingCompanies = true;
    this.areaService.getCompaniesForDropdown().subscribe({
      next: (companies) => {
        this.companies = companies;
        this.loadingCompanies = false;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        alert('Failed to load companies. Please refresh the page.');
        this.loadingCompanies = false;
      }
    });
  }

  checkEditMode(): void {
    this.areaId = this.route.snapshot.paramMap.get('id');
    if (this.areaId) {
      this.isEditMode = true;
      this.loadAreaData(this.areaId);
    }
  }

  loadAreaData(id: string): void {
    this.isLoading = true;
    this.areaService.getAreaById(id).subscribe({
      next: (area) => {
        this.areaForm.patchValue({
          companyId: area.companyId,
          areaCode: area.areaCode,
          areaName: area.areaName,
          areaType: area.areaType,
          pincode: area.pincode || '',
          description: area.description || ''
        });

        // Disable area code in edit mode
        this.areaForm.get('areaCode')?.disable();

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading area:', error);
        alert('Failed to load area data. Redirecting to list.');
        this.router.navigate(['/viewArea']);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.areaForm.valid) {
      this.isLoading = true;
      
      const areaData = {
        companyId: this.areaForm.value.companyId,
        areaCode: this.areaForm.value.areaCode,
        areaName: this.areaForm.value.areaName,
        areaType: this.areaForm.value.areaType,
        pincode: this.areaForm.value.pincode || null,
        description: this.areaForm.value.description || null
      };

      if (this.isEditMode) {
        // Update area
        this.areaService.updateArea(this.areaId!, areaData).subscribe({
          next: () => {
            console.log('Area updated successfully');
            this.router.navigate(['/viewArea']);
          },
          error: (error) => {
            console.error('Error updating area', error);
            this.isLoading = false;
            alert('Error updating area. Please try again.');
          }
        });
      } else {
        // Create area
        this.areaService.createArea(areaData).subscribe({
          next: (response) => {
            console.log('Area added successfully', response);
            this.router.navigate(['/viewArea']);
          },
          error: (error) => {
            console.error('Error adding area', error);
            this.isLoading = false;
            
            if (error.status === 409) {
              this.areaForm.get('areaCode')?.setErrors({ 'duplicate': true });
            } else {
              alert('Error adding area. Please try again.');
            }
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    if (this.areaForm.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/viewArea']);
      }
    } else {
      this.router.navigate(['/viewArea']);
    }
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.areaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.areaForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'areaCode') {
          return 'Area code must be in format AR001 (2 letters + 3 numbers)';
        }
        if (fieldName === 'pincode') {
          return 'Pincode must be exactly 6 digits';
        }
        return `Invalid ${this.getFieldDisplayName(fieldName)} format`;
      }
      if (field.errors['minlength']) {
        if (fieldName === 'areaCode') {
          return 'Area code must be exactly 5 characters';
        }
        return `${this.getFieldDisplayName(fieldName)} is too short`;
      }
      if (field.errors['maxlength']) {
        if (fieldName === 'areaCode') {
          return 'Area code must be exactly 5 characters';
        }
        if (fieldName === 'description') {
          return 'Description cannot exceed 500 characters';
        }
        return `${this.getFieldDisplayName(fieldName)} is too long`;
      }
      if (field.errors['duplicate']) {
        return 'This area code already exists. Please use a different code.';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'companyId': 'Company',
      'areaCode': 'Area Code',
      'areaName': 'Area Name',
      'areaType': 'Area Type',
      'pincode': 'Pincode',
      'description': 'Description'
    };
    return displayNames[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.areaForm.controls).forEach(key => {
      const control = this.areaForm.get(key);
      control?.markAsTouched();
    });
  }
}