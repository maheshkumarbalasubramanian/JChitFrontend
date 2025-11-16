import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CompanyService } from '../../service/company-service';

export interface AddCompanyRequest {
  companyCode: string;
  companyName: string;
  description?: string;
  logo?: File;
}

@Component({
  selector: 'app-company-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-add-component.html',
  styleUrl: './company-add-component.scss'
})
export class CompanyAddComponent implements OnInit {
  companyForm!: FormGroup;
  isLoading = false;
  logoFile: File | null = null;
  logoPreview: string | null = null;
  isEditMode = false;
  companyId: string | null = null;
  existingLogoUrl: string | null = null;
  removeLogo = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  checkEditMode(): void {
    this.companyId = this.route.snapshot.paramMap.get('id');
    if (this.companyId) {
      this.isEditMode = true;
      this.loadCompanyData(this.companyId);
    }
  }

  loadCompanyData(id: string): void {
    this.isLoading = true;
    this.companyService.getCompanyById(id).subscribe({
      next: (company:any) => {
        this.companyForm.patchValue({
          companyCode: company.companyCode,
          companyName: company.companyName,
          description: company.description || ''
        });

        // Disable company code in edit mode
        this.companyForm.get('companyCode')?.disable();

        // Load existing logo if available
        if (company.logoUrl) {
          this.existingLogoUrl = this.companyService.getLogoUrl(company.id);
          this.logoPreview = this.existingLogoUrl;
        }

        this.isLoading = false;
      },
      error: (error:any) => {
        console.error('Error loading company:', error);
        alert('Failed to load company data. Redirecting to list.');
        this.router.navigate(['/viewCompany']);
        this.isLoading = false;
      }
    });
  }

  initializeForm(): void {
    this.companyForm = this.formBuilder.group({
      companyCode: ['', [
        Validators.required, 
        Validators.pattern(/^[A-Z]{2}\d{3}$/),
        Validators.minLength(5),
        Validators.maxLength(5)
      ]],
      companyName: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      description: ['', [
        Validators.maxLength(200)
      ]],
      logo: [null]
    });

    // Auto-format company code to uppercase
    this.companyForm.get('companyCode')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperValue = value.toUpperCase();
        if (upperValue !== value) {
          this.companyForm.get('companyCode')?.setValue(upperValue, { emitEvent: false });
        }
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo size should not exceed 2MB');
        return;
      }
      
      this.logoFile = file;
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      
      this.companyForm.patchValue({ logo: file });
    }
  }

  removeLogos(): void {
    this.logoFile = null;
    this.logoPreview = null;
    this.existingLogoUrl = null;
    this.removeLogo = true;
    this.companyForm.patchValue({ logo: null });
    
    // Reset file input
    const fileInput = document.getElementById('logoInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.companyForm.valid) {
      this.isLoading = true;
      
      const formData = new FormData();
      
      if (this.isEditMode) {
        // Edit mode - only send fields that can be updated
        formData.append('companyName', this.companyForm.value.companyName);
        
        if (this.companyForm.value.description) {
          formData.append('description', this.companyForm.value.description);
        }
        
        if (this.removeLogo) {
          formData.append('removeLogo', 'true');
        }
        
        if (this.logoFile) {
          formData.append('logo', this.logoFile, this.logoFile.name);
        }

        formData.append('isActive', 'true'); // Default to active

        // Update company
        this.companyService.updateCompany(this.companyId!, formData).subscribe({
          next: () => {
            console.log('Company updated successfully');
            this.router.navigate(['/viewCompany']);
          },
          error: (error:any) => {
            console.error('Error updating company', error);
            this.isLoading = false;
            alert('Error updating company. Please try again.');
          }
        });
      } else {
        // Create mode
        formData.append('companyCode', this.companyForm.value.companyCode);
        formData.append('companyName', this.companyForm.value.companyName);
        
        if (this.companyForm.value.description) {
          formData.append('description', this.companyForm.value.description);
        }
        
        if (this.logoFile) {
          formData.append('logo', this.logoFile, this.logoFile.name);
        }

        // Create company
        this.companyService.createCompany(formData).subscribe({
          next: (response:any) => {
            console.log('Company added successfully', response);
            this.router.navigate(['/viewCompany']);
          },
          error: (error:any) => {
            console.error('Error adding company', error);
            this.isLoading = false;
            
            if (error.status === 409) {
              this.companyForm.get('companyCode')?.setErrors({ 'duplicate': true });
            } else {
              alert('Error adding company. Please try again.');
            }
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    if (this.companyForm.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/viewCompany']);
      }
    } else {
      this.router.navigate(['/viewCompany']);
    }
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.companyForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'companyCode') {
          return 'Company code must be in format CO001 (2 letters + 3 numbers)';
        }
        return `Invalid ${this.getFieldDisplayName(fieldName)} format`;
      }
      if (field.errors['minlength']) {
        if (fieldName === 'companyCode') {
          return 'Company code must be exactly 5 characters';
        }
        return `${this.getFieldDisplayName(fieldName)} is too short`;
      }
      if (field.errors['maxlength']) {
        if (fieldName === 'companyCode') {
          return 'Company code must be exactly 5 characters';
        }
        if (fieldName === 'description') {
          return 'Description cannot exceed 200 characters';
        }
        return `${this.getFieldDisplayName(fieldName)} is too long`;
      }
      if (field.errors['duplicate']) {
        return 'This company code already exists. Please use a different code.';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'companyCode': 'Company Code',
      'companyName': 'Company Name',
      'description': 'Description'
    };
    return displayNames[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.companyForm.controls).forEach(key => {
      const control = this.companyForm.get(key);
      control?.markAsTouched();
    });
  }
}