import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ItemGroupService, AreaOption } from '../../service/Item-group-service';


@Component({
  selector: 'app-item-group-add-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-group-add-component.html',
  styleUrl: './item-group-add-component.scss'
})
export class ItemGroupAddComponent implements OnInit {
  itemGroupForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  itemGroupId: string | null = null;
  areas: AreaOption[] = [];
  loadingAreas = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private itemGroupService: ItemGroupService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAreas();
    this.checkEditMode();
  }

  initializeForm(): void {
    this.itemGroupForm = this.formBuilder.group({
      areaId: ['', [Validators.required]],
      groupCode: [{ value: '', disabled: true }, [Validators.required]],
      groupName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      groupNameTamil: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  loadAreas(): void {
    this.loadingAreas = true;
    this.itemGroupService.getAreasForDropdown().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.loadingAreas = false;
      },
      error: (error) => {
        console.error('Error loading areas:', error);
        alert('Failed to load areas. Please refresh the page.');
        this.loadingAreas = false;
      }
    });
  }

  checkEditMode(): void {
    this.itemGroupId = this.route.snapshot.paramMap.get('id');
    
    if (this.itemGroupId) {
      this.isEditMode = true;
      this.loadItemGroupData(this.itemGroupId);
    } else {
      this.loadNextGroupCode();
    }
  }

  loadNextGroupCode(): void {
    this.itemGroupService.getNextGroupCode().subscribe({
      next: (response) => {
        this.itemGroupForm.patchValue({
          groupCode: response.code
        });
      },
      error: (error) => {
        console.error('Error loading next group code:', error);
        // Generate fallback code
        const timestamp = Date.now().toString().slice(-4);
        this.itemGroupForm.patchValue({
          groupCode: `IG${timestamp}`
        });
      }
    });
  }

  loadItemGroupData(id: string): void {
    this.isLoading = true;
    this.itemGroupService.getItemGroupById(id).subscribe({
      next: (group) => {
        this.itemGroupForm.patchValue({
          areaId: group.areaId,
          groupCode: group.groupCode,
          groupName: group.groupName,
          groupNameTamil: group.groupNameTamil || '',
          description: group.description || '',
          isActive: group.isActive
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading item group:', error);
        alert('Failed to load item group data. Redirecting to list.');
        this.router.navigate(['/itemgroups']);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.itemGroupForm.valid) {
      this.isLoading = true;
      
      const groupData = {
        areaId: this.itemGroupForm.value.areaId,
        groupCode: this.itemGroupForm.get('groupCode')?.value,
        groupName: this.itemGroupForm.value.groupName,
        groupNameTamil: this.itemGroupForm.value.groupNameTamil || null,
        description: this.itemGroupForm.value.description || null,
        isActive: this.itemGroupForm.value.isActive
      };

      if (this.isEditMode) {
        // Update item group
        this.itemGroupService.updateItemGroup(this.itemGroupId!, groupData).subscribe({
          next: () => {
            console.log('Item group updated successfully');
            this.router.navigate(['/itemgroups']);
          },
          error: (error) => {
            console.error('Error updating item group', error);
            this.isLoading = false;
            alert('Error updating item group. Please try again.');
          }
        });
      } else {
        // Create item group
        this.itemGroupService.createItemGroup(groupData).subscribe({
          next: (response) => {
            console.log('Item group added successfully', response);
            this.router.navigate(['/itemgroups']);
          },
          error: (error) => {
            console.error('Error adding item group', error);
            this.isLoading = false;
            
            if (error.status === 409) {
              this.itemGroupForm.get('groupCode')?.setErrors({ 'duplicate': true });
            } else {
              alert('Error adding item group. Please try again.');
            }
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    if (this.itemGroupForm.dirty) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/itemgroups']);
      }
    } else {
      this.router.navigate(['/itemgroups']);
    }
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.itemGroupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.itemGroupForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} is too short`;
      }
      if (field.errors['maxlength']) {
        if (fieldName === 'description') {
          return 'Description cannot exceed 500 characters';
        }
        return `${this.getFieldDisplayName(fieldName)} is too long`;
      }
      if (field.errors['duplicate']) {
        return 'This group code already exists. Please use a different code.';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'areaId': 'Area',
      'groupCode': 'Group Code',
      'groupName': 'Group Name',
      'groupNameTamil': 'Group Name (Tamil)',
      'description': 'Description'
    };
    return displayNames[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.itemGroupForm.controls).forEach(key => {
      const control = this.itemGroupForm.get(key);
      control?.markAsTouched();
    });
  }
} 