import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export interface Item {
  id?: string;
  itemCode: string;
  itemName: string;
  itemNameTamil?: string;
  itemGroupId: string;
  itemGroupName?: string;
  purityId?: string;
  purityName?: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItemGroup {
  id: string;
  groupCode: string;
  groupName: string;
  isActive: boolean;
}

export interface Purity {
  id: string;
  purityCode: string;
  purityName: string;
  purityPercentage: number;
  karat?: number;
  itemGroupId: string;
  isActive: boolean;
}

@Component({
  selector: 'app-item-add-component',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './item-add-component.html',
  styleUrl: './item-add-component.scss'
})
export class ItemAddComponent implements OnInit {
  itemForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  currentItem?: Item;
  
  // Mock data - replace with actual service calls
  itemGroups: ItemGroup[] = [
    { id: '1', groupCode: 'GOLD', groupName: 'Gold', isActive: true },
    { id: '2', groupCode: 'SILVER', groupName: 'Silver', isActive: true },
    { id: '3', groupCode: 'PLATINUM', groupName: 'Platinum', isActive: true }
  ];

  allPurities: Purity[] = [
    // Gold purities
    { id: '1', purityCode: 'AU24K', purityName: '24K Gold', purityPercentage: 99.9, karat: 24, itemGroupId: '1', isActive: true },
    { id: '2', purityCode: 'AU22K', purityName: '22K Gold', purityPercentage: 91.6, karat: 22, itemGroupId: '1', isActive: true },
    { id: '3', purityCode: 'AU18K', purityName: '18K Gold', purityPercentage: 75.0, karat: 18, itemGroupId: '1', isActive: true },
    // Silver purities
    { id: '4', purityCode: 'AG999', purityName: 'Fine Silver', purityPercentage: 99.9, itemGroupId: '2', isActive: true },
    { id: '5', purityCode: 'AG925', purityName: 'Sterling Silver', purityPercentage: 92.5, itemGroupId: '2', isActive: true },
    // Platinum purities
    { id: '6', purityCode: 'PT950', purityName: 'Platinum 950', purityPercentage: 95.0, itemGroupId: '3', isActive: true }
  ];

  filteredPurities: Purity[] = [];

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.generateItemCode();
  }

  initializeForm(): void {
    this.itemForm = this.formBuilder.group({
      itemCode: ['', [Validators.required, Validators.minLength(2)]],
      itemName: ['', [Validators.required, Validators.minLength(2)]],
      itemNameTamil: [''],
      itemGroupId: ['', Validators.required],
      purityId: [''],
      description: [''],
      isActive: [true]
    });

    // Watch for item group changes to filter purities
    this.itemForm.get('itemGroupId')?.valueChanges.subscribe(groupId => {
      this.onItemGroupChange(groupId);
    });
  }

  generateItemCode(): void {
    const timestamp = Date.now().toString().slice(-4);
    const itemCode = `ITM${timestamp}`;
    this.itemForm.patchValue({ itemCode });
  }
  getSelectedItemGroupName(): string {
    const selectedGroupId = this.itemForm.get('itemGroupId')?.value;
    const selectedGroup = this.itemGroups.find(group => group.id === selectedGroupId);
    return selectedGroup ? selectedGroup.groupName : '';
  }
  onItemGroupChange(groupId: string): void {
    // Filter purities based on selected item group
    this.filteredPurities = this.allPurities.filter(purity => 
      purity.itemGroupId === groupId && purity.isActive
    );
    
    // Clear purity selection when group changes
    this.itemForm.patchValue({ purityId: '' });
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
      
      const selectedGroup = this.itemGroups.find(group => group.id === this.itemForm.value.itemGroupId);
      const selectedPurity = this.filteredPurities.find(purity => purity.id === this.itemForm.value.purityId);
      
      const itemData: Item = {
        itemCode: this.itemForm.value.itemCode,
        itemName: this.itemForm.value.itemName,
        itemNameTamil: this.itemForm.value.itemNameTamil,
        itemGroupId: this.itemForm.value.itemGroupId,
        itemGroupName: selectedGroup?.groupName,
        purityId: this.itemForm.value.purityId || null,
        purityName: selectedPurity?.purityName,
        description: this.itemForm.value.description,
        isActive: this.itemForm.value.isActive,
        createdAt: new Date()
      };

      console.log('Item Data:', itemData);
      
      // Here you would typically call your service to save the item
      // this.itemService.addItem(itemData).subscribe(...)

      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        alert('Item added successfully!');
        this.router.navigate(['/itemtypes']);
      }, 1000);
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
    this.router.navigate(['/item-groups']);
  }

  goToPurities(): void {
    this.router.navigate(['/purities']);
  }
}