import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ItemTypeService, ItemType } from '../../service/item-type.service';
import { ItemGroupService } from '../../service/Item-group-service';

export interface ItemGroup {
  id: string;
  groupCode: string;
  groupName: string;
  isActive: boolean;
}

@Component({
  selector: 'app-add-item-type-component',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './add-item-type-component.html',
  styleUrl: './add-item-type-component.scss'
})
export class AddItemTypeComponent implements OnInit {
  itemForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  currentItemType?: ItemType;
  itemTypeId?: string;
  
  itemGroups: ItemGroup[] = [];

  // Common item templates based on groups
  itemTemplates = {
    GOLD: [
      'Gold Bangles', 'Gold Chain', 'Gold Ring', 'Gold Earrings', 'Gold Necklace', 
      'Gold Pendant', 'Gold Bracelet', 'Gold Anklet', 'Gold Coin', 'Gold Bar'
    ],
    SILVER: [
      'Silver Bangles', 'Silver Chain', 'Silver Ring', 'Silver Earrings', 'Silver Necklace',
      'Silver Pendant', 'Silver Bracelet', 'Silver Anklet', 'Silver Coin', 'Silver Utensils'
    ],
    PLATINUM: [
      'Platinum Ring', 'Platinum Chain', 'Platinum Earrings', 'Platinum Pendant', 
      'Platinum Bracelet', 'Platinum Necklace'
    ]
  };

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private itemTypeService: ItemTypeService,
    private itemGroupService: ItemGroupService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadItemGroups();
    
    // Check if we're in edit mode by looking for an ID in the route
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.itemTypeId = id;
        this.isEditMode = true;
        this.loadItemTypeData(id); // Pass the local variable directly
      } else {
        this.generateItemCode();
      }
    });
  }

  initializeForm(): void {
    this.itemForm = this.formBuilder.group({
      itemCode: ['', [Validators.required, Validators.minLength(2)]],
      itemName: ['', [Validators.required, Validators.minLength(2)]],
      itemNameTamil: [''],
      itemGroupId: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  loadItemGroups(): void {
    const filter = {
      status: 'active' as const
    };
    
    this.itemGroupService.getItemGroups(filter).subscribe({
      next: (groups) => {
        this.itemGroups = groups.map(group => ({
          id: group.id,
          groupCode: group.groupCode,
          groupName: group.groupName,
          isActive: group.isActive
        }));
      },
      error: (error) => {
        console.error('Error loading item groups:', error);
        alert('Failed to load item groups. Please try again.');
      }
    });
  }

  loadItemTypeData(id: string): void {
    this.isLoading = true;
    
    this.itemTypeService.getItemTypeById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentItemType = response.data;
          
          // Pre-fill the form with existing data
          this.itemForm.patchValue({
            itemCode: response.data.itemCode,
            itemName: response.data.itemName,
            itemNameTamil: response.data.itemNameTamil || '',
            itemGroupId: response.data.itemGroupId,
            description: response.data.description || '',
            isActive: response.data.isActive
          });
          
          // Make item code readonly in edit mode
          this.itemForm.get('itemCode')?.disable();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading item type:', error);
        alert('Failed to load item type data. Redirecting to list...');
        this.router.navigate(['/itemtypes']);
        this.isLoading = false;
      }
    });
  }

  generateItemCode(): void {
    this.itemTypeService.generateItemCode().subscribe({
      next: (response) => {
        if (response.success) {
          this.itemForm.patchValue({ itemCode: response.data });
        }
      },
      error: (error) => {
        console.error('Error generating item code:', error);
        // Fallback to client-side generation
        const timestamp = Date.now().toString().slice(-6);
        const itemCode = `ITM${timestamp}`;
        this.itemForm.patchValue({ itemCode });
      }
    });
  }

  getSelectedItemGroupName(): string {
    const selectedGroupId = this.itemForm.get('itemGroupId')?.value;
    const selectedGroup = this.itemGroups.find(group => group.id === selectedGroupId);
    return selectedGroup ? selectedGroup.groupName : '';
  }

  getSelectedGroupTemplates(): string[] {
    const selectedGroupId = this.itemForm.get('itemGroupId')?.value;
    const selectedGroup = this.itemGroups.find(group => group.id === selectedGroupId);
    
    if (selectedGroup && this.itemTemplates[selectedGroup.groupCode as keyof typeof this.itemTemplates]) {
      return this.itemTemplates[selectedGroup.groupCode as keyof typeof this.itemTemplates];
    }
    return [];
  }

  applyItemTemplate(templateName: string): void {
    this.itemForm.patchValue({
      itemName: templateName
    });
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.isLoading = true;
      
      // Get the item code value (whether enabled or disabled)
      const itemCode = this.itemForm.get('itemCode')?.value || this.currentItemType?.itemCode;
      
      const itemTypeData: ItemType = {
        itemCode: itemCode!,
        itemName: this.itemForm.value.itemName,
        itemNameTamil: this.itemForm.value.itemNameTamil,
        itemGroupId: this.itemForm.value.itemGroupId,
        description: this.itemForm.value.description,
        isActive: this.itemForm.value.isActive
      };

      if (this.isEditMode && this.itemTypeId) {
        // Update existing item type - include ID in the data
        itemTypeData.id = this.itemTypeId;
        this.itemTypeService.updateItemType(this.itemTypeId, itemTypeData).subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success) {
              alert('Item type updated successfully!');
              this.router.navigate(['/itemtypes']);
            } else {
              alert(response.message || 'Failed to update item type');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating item type:', error);
            alert(error.error?.message || 'An error occurred while updating the item type');
          }
        });
      } else {
        // Create new item type
        this.itemTypeService.createItemType(itemTypeData).subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success) {
              alert('Item type added successfully!');
              this.router.navigate(['/itemtypes']);
            } else {
              alert(response.message || 'Failed to add item type');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating item type:', error);
            alert(error.error?.message || 'An error occurred while creating the item type');
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.itemForm.controls).forEach(key => {
      const control = this.itemForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      this.router.navigate(['/itemtypes']);
    }
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.itemForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.itemForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
    }
    return '';
  }

  // Navigation helpers
  goToItemGroups(): void {
    this.router.navigate(['/itemgroups']);
  }

  goToPurities(): void {
    // Removed - no longer needed
  }
}