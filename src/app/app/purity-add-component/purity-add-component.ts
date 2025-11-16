import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PurityService, Purity, PurityListResponse } from '../../service/purity.service';
import { ItemGroupService, ItemGroup } from '../../service/Item-group-service';

export interface ItemGroupDropdown {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-purity-add-component',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './purity-add-component.html',
  styleUrl: './purity-add-component.scss'
})
export class PurityAddComponent implements OnInit {
  private purityService = inject(PurityService);
  private itemGroupService = inject(ItemGroupService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  purityForm!: FormGroup;
  isLoading = false;
  isLoadingGroups = false;
  isEditMode = false;
  currentPurity?: Purity;
  purityId?: string;
  
  itemGroups: ItemGroupDropdown[] = [];

  // Predefined purity templates
  purityTemplates = {
    GOLD: [
      { name: '24K Gold', percentage: 99.9, karat: 24 },
      { name: '22K Gold', percentage: 91.6, karat: 22 },
      { name: '18K Gold', percentage: 75.0, karat: 18 },
      { name: '14K Gold', percentage: 58.3, karat: 14 },
      { name: '10K Gold', percentage: 41.7, karat: 10 }
    ],
    SILVER: [
      { name: 'Fine Silver', percentage: 99.9, karat: null },
      { name: 'Sterling Silver', percentage: 92.5, karat: null },
      { name: 'Coin Silver', percentage: 90.0, karat: null }
    ],
    PLATINUM: [
      { name: 'Pure Platinum', percentage: 99.5, karat: null },
      { name: 'Platinum 950', percentage: 95.0, karat: null },
      { name: 'Platinum 900', percentage: 90.0, karat: null }
    ]
  };

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
    this.loadItemGroups();
  }

  checkEditMode(): void {
    this.purityId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.purityId;

    if (this.isEditMode && this.purityId) {
      this.loadPurityData(this.purityId);
    } else {
      this.generatePurityCode();
    }
  }

  loadPurityData(id: string): void {
    this.isLoading = true;
    this.purityService.getPurityById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentPurity = response.data;
          this.purityForm.patchValue({
            purityCode: this.currentPurity.purityCode,
            purityName: this.currentPurity.purityName,
            purityPercentage: this.currentPurity.purityPercentage,
            karat: this.currentPurity.karat || '',
            itemGroupId: this.currentPurity.itemGroupId,
            description: this.currentPurity.description || '',
            isActive: this.currentPurity.isActive
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading purity:', error);
        alert('Failed to load purity data. Please try again.');
        this.isLoading = false;
        this.router.navigate(['/purity']);
      }
    });
  }

  loadItemGroups(): void {
    this.isLoadingGroups = true;
    
    this.itemGroupService.getItemGroupsForDropdown().subscribe({
      next: (groups) => {
        this.itemGroups = groups;
        this.isLoadingGroups = false;
      },
      error: (error) => {
        console.error('Error loading item groups:', error);
        alert('Failed to load item groups. Please refresh the page.');
        this.isLoadingGroups = false;
      }
    });
  }

  initializeForm(): void {
    this.purityForm = this.formBuilder.group({
      purityCode: ['', [Validators.required, Validators.minLength(2)]],
      purityName: ['', [Validators.required, Validators.minLength(2)]],
      purityPercentage: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      karat: [''],
      itemGroupId: ['', Validators.required],
      description: [''],
      isActive: [true]
    });

    // Watch for item group changes
    this.purityForm.get('itemGroupId')?.valueChanges.subscribe(groupId => {
      this.onItemGroupChange(groupId);
    });
  }

  generatePurityCode(): void {
    this.purityService.generatePurityCode().subscribe({
      next: (response) => {
        if (response.success) {
          this.purityForm.patchValue({ purityCode: response.data });
        } else {
          // Fallback to timestamp-based code if service fails
          const timestamp = Date.now().toString().slice(-6);
          this.purityForm.patchValue({ purityCode: `PU${timestamp}` });
        }
      },
      error: () => {
        // Fallback to timestamp-based code
        const timestamp = Date.now().toString().slice(-6);
        this.purityForm.patchValue({ purityCode: `PU${timestamp}` });
      }
    });
  }

  getSelectedGroupName(): string {
    const selectedGroupId = this.purityForm.get('itemGroupId')?.value;
    const selectedGroup = this.itemGroups.find(group => group.id === selectedGroupId);
    return selectedGroup ? selectedGroup.name : '';
  }

  onItemGroupChange(groupId: string): void {
    const selectedGroup = this.itemGroups.find(group => group.id === groupId);
    if (selectedGroup && !this.isEditMode) {
      // Clear current values only in add mode
      this.purityForm.patchValue({
        purityName: '',
        purityPercentage: '',
        karat: ''
      });
    }
  }

  applyPurityTemplate(template: any): void {
    this.purityForm.patchValue({
      purityName: template.name,
      purityPercentage: template.percentage,
      karat: template.karat || ''
    });
  }

  getSelectedGroupTemplates(): any[] {
    const selectedGroupId = this.purityForm.get('itemGroupId')?.value;
    const selectedGroup = this.itemGroups.find(group => group.id === selectedGroupId);
    
    if (selectedGroup && this.purityTemplates[selectedGroup.code as keyof typeof this.purityTemplates]) {
      return this.purityTemplates[selectedGroup.code as keyof typeof this.purityTemplates];
    }
    return [];
  }

  onSubmit(): void {
    if (this.purityForm.valid) {
      this.isLoading = true;
      
      const purityData: Purity = {
        purityCode: this.purityForm.value.purityCode,
        purityName: this.purityForm.value.purityName,
        purityPercentage: parseFloat(this.purityForm.value.purityPercentage),
        karat: this.purityForm.value.karat ? parseInt(this.purityForm.value.karat) : undefined,
        itemGroupId: this.purityForm.value.itemGroupId,
        description: this.purityForm.value.description,
        isActive: this.purityForm.value.isActive
      };

      // Add the ID to the data object when updating
      if (this.isEditMode && this.purityId) {
        purityData.id = this.purityId;
      }

      const operation = this.isEditMode && this.purityId
        ? this.purityService.updatePurity(this.purityId, purityData)
        : this.purityService.createPurity(purityData);

      operation.subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Purity ${this.isEditMode ? 'updated' : 'created'} successfully!`);
            this.router.navigate(['/purity']);
          } else {
            alert(`Failed to ${this.isEditMode ? 'update' : 'create'} purity: ${response.message}`);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving purity:', error);
          const errorMessage = error.error?.message || 'An unexpected error occurred';
          alert(`Failed to ${this.isEditMode ? 'update' : 'create'} purity: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.purityForm.controls).forEach(key => {
      const control = this.purityForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      this.router.navigate(['/purity']);
    }
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.purityForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.purityForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
      if (field.errors['max']) return `${fieldName} must be less than or equal to 100`;
    }
    return '';
  }
}