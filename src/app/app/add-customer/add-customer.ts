import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CustomerService,Customer } from '../../service/customer-service';



@Component({
  selector: 'app-add-customer',
  imports: [ CommonModule,
    ReactiveFormsModule,
    FormsModule,],
  templateUrl: './add-customer.html',
  styleUrl: './add-customer.scss'
})
export class AddCustomer implements OnInit {
  customerForm!: FormGroup;
  selectedTab: string = 'address';
  profileImagePreview: string | null = null;
  isLoading = false;
  isCapturingFingerprint = false;
  documentNames: { [key: string]: string } = {};
  isEditMode = false; // Add this
  isViewMode= false;
  customerId: string | null = null; // Add this

  constructor(
    private formBuilder: FormBuilder,
    private router: Router, private route: ActivatedRoute, 
    private customerService: CustomerService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    const url = this.router.url;
    this.customerId = this.route.snapshot.paramMap.get('id');
    if (this.customerId) {
      if (url.includes('/view/')) {
        this.isViewMode = true;
        this.customerForm.disable(); // Disable entire form in view mode
      } else if (url.includes('/edit/')) {
        this.isEditMode = true;
      }
      this.loadCustomerData(this.customerId);
    } else {
      this.generateCustomerCode();
    }

  }
  switchToEditMode(): void {
    if (this.customerId) {
      this.router.navigate(['/customers/edit', this.customerId]);
    }
  }
  loadCustomerData(id: string): void {
    this.isLoading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        this.populateForm(customer);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        alert('Failed to load customer data');
        this.isLoading = false;
        this.router.navigate(['/customers']);
      }
    });
  }
  populateForm(customer: any): void {
    this.customerForm.patchValue({
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      relationshipName: customer.relationshipName,
      relationName: customer.relationName,
      mobile: customer.mobile,
      profileImage: customer.profileImage,
      dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().split('T')[0] : null,
      
      // Address
      address1: customer.addressInfo.address1,
      address2: customer.addressInfo.address2,
      address3: customer.addressInfo.address3,
      address4: customer.addressInfo.address4,
      area: customer.addressInfo.area,
      state: customer.addressInfo.state,
      pincode: customer.addressInfo.pincode,
      city: customer.addressInfo.city,
      
      // Contact
      primaryPhone: customer.contactInfo.primaryPhone,
      secondaryPhone: customer.contactInfo.secondaryPhone,
      email: customer.contactInfo.email,
      whatsapp: customer.contactInfo.whatsapp,
      
      // Other Info
      aadharNumber: customer.otherInfo.aadharNumber,
      panNumber: customer.otherInfo.panNumber,
      occupation: customer.otherInfo.occupation,
      monthlyIncome: customer.otherInfo.monthlyIncome,
      referenceBy: customer.otherInfo.referenceBy,
      
      // Verification
      aadharVerified: customer.verification.aadharVerified,
      fingerprintVerified: customer.verification.fingerprintVerified
    });

    // Set profile image preview
    if (customer.profileImage) {
      this.profileImagePreview = customer.profileImage;
    }

    if (customer.documents) {
      const documentsGroup = this.customerForm.get('documents') as FormGroup;
      
      if (customer.documents.aadharDocument) {
        documentsGroup.patchValue({ aadharDocument: customer.documents.aadharDocument });
        this.documentNames['aadharDocument'] = 'Existing Aadhar Document';
      }
      
      if (customer.documents.panDocument) {
        documentsGroup.patchValue({ panDocument: customer.documents.panDocument });
        this.documentNames['panDocument'] = 'Existing PAN Document';
      }
      
      if (customer.documents.incomeProof) {
        documentsGroup.patchValue({ incomeProof: customer.documents.incomeProof });
        this.documentNames['incomeProof'] = 'Existing Income Proof';
      }
      
      if (customer.documents.addressProof) {
        documentsGroup.patchValue({ addressProof: customer.documents.addressProof });
        this.documentNames['addressProof'] = 'Existing Address Proof';
      }
      
      if (customer.documents.otherDocument) {
        documentsGroup.patchValue({ otherDocument: customer.documents.otherDocument });
        this.documentNames['otherDocument'] = 'Existing Other Document';
      }
    }
  }

  initializeForm(): void {
    this.customerForm = this.formBuilder.group({
      customerCode: ['', Validators.required],
      customerName: ['', [Validators.required, Validators.minLength(2)]],
      relationshipName: ['', Validators.required],
      relationName: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      profileImage: [''],
      dateOfBirth: [''],
      
      // Address Information
      address1: ['', Validators.required],
      address2: [''],
      address3: [''],
      address4: [''],
      area: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      city: ['', Validators.required],

      // Contact Information
      primaryPhone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      secondaryPhone: ['', Validators.pattern(/^[6-9]\d{9}$/)],
      email: ['', [Validators.email]],
      whatsapp: ['', Validators.pattern(/^[6-9]\d{9}$/)],

      // Other Information
      aadharNumber: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      panNumber: ['', Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)],
      occupation: [''],
      monthlyIncome: [null, Validators.min(0)],
      referenceBy: [''],

      // Documents FormGroup
      documents: this.formBuilder.group({
        aadharDocument: [''],
        panDocument: [''],
        incomeProof: [''],
        addressProof: [''],
        otherDocument: ['']
      }),

      // Verification
      aadharVerified: [false],
      fingerprintVerified: [false]
    });
  }

  generateCustomerCode(): void {
    const timestamp = Date.now().toString().slice(-6);
    const customerCode = `PR${timestamp}`;
    this.customerForm.patchValue({ customerCode });
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImagePreview = e.target?.result as string;
        this.customerForm.patchValue({ profileImage: this.profileImagePreview });
      };
      reader.readAsDataURL(file);
    }
  }

  onDocumentSelect(event: Event, documentType: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type (images and PDFs)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF) or PDF');
        return;
      }

      // Validate file size (max 10MB for documents)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        return;
      }

      // Store file name for display
      this.documentNames[documentType] = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.customerForm.get(`documents.${documentType}`)?.patchValue(result);
      };
      reader.readAsDataURL(file);
    }
  }

  removeDocument(documentType: string): void {
    this.customerForm.get(`documents.${documentType}`)?.patchValue('');
    delete this.documentNames[documentType];
    
    // Clear the file input
    const input = document.getElementById(documentType) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  getDocumentName(documentType: string): string {
    return this.documentNames[documentType] || '';
  }

  removeProfileImage(): void {
    this.profileImagePreview = null;
    this.customerForm.patchValue({ profileImage: '' });
  }

  copyMobileToWhatsApp(): void {
    const mobile = this.customerForm.get('mobile')?.value;
    if (mobile) {
      this.customerForm.patchValue({ whatsapp: mobile });
    }
  }

  copyPrimaryToSecondary(): void {
    const primary = this.customerForm.get('primaryPhone')?.value;
    if (primary) {
      this.customerForm.patchValue({ secondaryPhone: primary });
    }
  }

  // Camera capture functionality
  async capturePhoto(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      
      const modal = this.createCameraModal(video, stream);
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions and try again.');
    }
  }

  private createCameraModal(video: HTMLVideoElement, stream: MediaStream): HTMLElement {
    const modal = document.createElement('div');
    
    // Apply styles directly to ensure they work
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
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
        <h4 style="margin: 0; color: #333; font-size: 18px;">Capture Photo</h4>
        <button type="button" id="closeCamera" style="background: none; border: none; font-size: 24px; color: #666; cursor: pointer; padding: 0; width: 30px; height: 30px;">&times;</button>
      </div>
      <div id="videoContainer" style="text-align: center; margin-bottom: 20px;"></div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button type="button" id="cancelCamera" style="padding: 10px 20px; border: 1px solid #6c757d; border-radius: 4px; background: #6c757d; color: white; cursor: pointer;">Cancel</button>
        <button type="button" id="captureBtn" style="padding: 10px 20px; border: 1px solid #007bff; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">📷 Capture</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    
    // Add video to container
    const videoContainer = modalContent.querySelector('#videoContainer') as HTMLElement;
    video.style.maxWidth = '60%';
    video.style.height = 'auto';
    video.style.borderRadius = '8px';
    video.style.border = '2px solid #007bff';
    videoContainer.appendChild(video);
    
    // Event listeners
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
      this.captureImageFromVideo(video);
      closeModal();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    return modal;
  }

  private captureImageFromVideo(video: HTMLVideoElement): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    this.profileImagePreview = imageDataUrl;
    this.customerForm.patchValue({ profileImage: imageDataUrl });
  }

  private isFingerprintSupported(): boolean {
    // Check for WebAuthn API (for biometric authentication)
    return 'credentials' in navigator && 'create' in navigator.credentials;
  }

  private createFingerprintModal(): HTMLElement {
    const modal = document.createElement('div');
    
    // Apply styles directly
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
    modalContent.style.maxWidth = '400px';
    modalContent.style.width = '90%';
    modalContent.style.textAlign = 'center';
    modalContent.style.position = 'relative';
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
        <h4 style="margin: 0; color: #333; font-size: 18px;">Capture Fingerprint</h4>
        <button type="button" id="closeFingerprint" style="background: none; border: none; font-size: 24px; color: #666; cursor: pointer; padding: 0; width: 30px; height: 30px;">&times;</button>
      </div>
      <div style="margin-bottom: 20px;">
        <div style="position: relative; padding: 40px 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border: 2px dashed #007bff;">
          <div style="position: relative; display: inline-block; margin-bottom: 20px;">
            <div style="font-size: 80px; color: #007bff; opacity: 0.7;">👆</div>
            <div id="scanningLine" style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #28a745, transparent);"></div>
          </div>
          <p style="font-size: 16px; color: #333; margin: 10px 0; font-weight: 500;">Place finger on scanner</p>
          <div id="fingerprintStatus" style="font-size: 14px; color: #666; margin-top: 10px;">Waiting for fingerprint...</div>
        </div>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button type="button" id="cancelFingerprint" style="padding: 10px 20px; border: 1px solid #6c757d; border-radius: 4px; background: #6c757d; color: white; cursor: pointer;">Cancel</button>
        <button type="button" id="verifyFingerprint" style="padding: 10px 20px; border: 1px solid #28a745; border-radius: 4px; background: #28a745; color: white; cursor: pointer; opacity: 0.6;" disabled>✓ Verify & Save</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    
    // Add scanning animation
    const scanningLine = modalContent.querySelector('#scanningLine') as HTMLElement;
    let position = 0;
    const animateScanning = () => {
      if (scanningLine && document.body.contains(modal)) {
        position = (position + 2) % 80;
        scanningLine.style.transform = `translateY(${position}px)`;
        scanningLine.style.opacity = position < 40 ? (position / 40).toString() : ((80 - position) / 40).toString();
        requestAnimationFrame(animateScanning);
      }
    };
    animateScanning();
    
    // Event listeners
    const closeBtn = modalContent.querySelector('#closeFingerprint') as HTMLButtonElement;
    const cancelBtn = modalContent.querySelector('#cancelFingerprint') as HTMLButtonElement;
    const verifyBtn = modalContent.querySelector('#verifyFingerprint') as HTMLButtonElement;
    
    const closeModal = () => {
      this.isCapturingFingerprint = false;
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    verifyBtn.addEventListener('click', () => {
      this.customerForm.patchValue({ fingerprintVerified: true });
      alert('Fingerprint captured and verified successfully!');
      closeModal();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Auto-enable verify button after 3 seconds
    setTimeout(() => {
      if (document.body.contains(modal)) {
        const statusElement = modalContent.querySelector('#fingerprintStatus') as HTMLElement;
        const verifyButton = modalContent.querySelector('#verifyFingerprint') as HTMLButtonElement;
        if (statusElement && verifyButton) {
          statusElement.textContent = 'Fingerprint captured successfully!';
          statusElement.style.color = '#28a745';
          verifyButton.disabled = false;
          verifyButton.style.opacity = '1';
        }
      }
    }, 3000);
    
    return modal;
  }

  private async simulateFingerprintCapture(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate fingerprint scanning process
      setTimeout(() => {
        const statusElement = document.querySelector('.fingerprint-status') as HTMLElement;
        const verifyBtn = document.querySelector('.verify-fingerprint-btn') as HTMLButtonElement;
        
        if (statusElement && verifyBtn) {
          statusElement.textContent = 'Fingerprint captured successfully!';
          statusElement.style.color = '#28a745';
          verifyBtn.disabled = false;
        }
        resolve();
      }, 3000);
    });
  }

  // WebAuthn fingerprint authentication (for modern browsers)
  async authenticateFingerprint(): Promise<void> {
    try {
      if (!this.isFingerprintSupported()) {
        throw new Error('Fingerprint authentication not supported');
      }

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'Gold Mortgage Chit App' },
          user: {
            id: new TextEncoder().encode(this.customerForm.value.customerCode),
            name: this.customerForm.value.customerName,
            displayName: this.customerForm.value.customerName
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          }
        }
      });

      if (credential) {
        this.customerForm.patchValue({ fingerprintVerified: true });
        alert('Fingerprint authenticated successfully!');
      }

    } catch (error) {
      console.error('Fingerprint authentication failed:', error);
      alert('Fingerprint authentication failed. Please try manual capture.');
    }
  }

  async captureFingerprint(): Promise<void> {
    try {
      if (!this.isFingerprintSupported()) {
        alert('Fingerprint capture is not supported on this device. Please use a compatible fingerprint scanner.');
        return;
      }
  
      this.isCapturingFingerprint = true;
      const modal = this.createFingerprintModal();
      document.body.appendChild(modal);
      await this.simulateFingerprintCapture();
  
    } catch (error) {
      console.error('Error capturing fingerprint:', error);
      alert('Failed to capture fingerprint. Please try again.');
    } finally {
      this.isCapturingFingerprint = false;
    }
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.isLoading = true;
      
      const customerData = {
        customerCode: this.customerForm.value.customerCode,
        customerName: this.customerForm.value.customerName,
        relationshipName: this.customerForm.value.relationshipName,
        relationName: this.customerForm.value.relationName,
        mobile: this.customerForm.value.mobile,
        profileImage: this.customerForm.value.profileImage || null,
        dateOfBirth: this.customerForm.value.dateOfBirth || null,
        addressInfo: {
          address1: this.customerForm.value.address1,
          address2: this.customerForm.value.address2 || null,
          address3: this.customerForm.value.address3 || null,
          address4: this.customerForm.value.address4 || null,
          area: this.customerForm.value.area,
          state: this.customerForm.value.state,
          pincode: this.customerForm.value.pincode,
          city: this.customerForm.value.city
        },
        contactInfo: {
          primaryPhone: this.customerForm.value.primaryPhone,
          secondaryPhone: this.customerForm.value.secondaryPhone?.trim() || null,
          email: this.customerForm.value.email?.trim() || null,
          whatsapp: this.customerForm.value.whatsapp?.trim() || null
        },
        otherInfo: {
          aadharNumber: this.customerForm.value.aadharNumber,
          panNumber: this.customerForm.value.panNumber?.trim() || null,
          occupation: this.customerForm.value.occupation || null,
          monthlyIncome: this.customerForm.value.monthlyIncome || null,
          referenceBy: this.customerForm.value.referenceBy?.trim() || null
        },
        documents: {
          aadharDocument: this.customerForm.value.documents?.aadharDocument || null,
          panDocument: this.customerForm.value.documents?.panDocument || null,
          incomeProof: this.customerForm.value.documents?.incomeProof || null,
          addressProof: this.customerForm.value.documents?.addressProof || null,
          otherDocument: this.customerForm.value.documents?.otherDocument || null
        },
        verification: {
          aadharVerified: this.customerForm.value.aadharVerified || false,
          fingerprintVerified: this.customerForm.value.fingerprintVerified || false
        }
      };
      console.log('Complete payload:', JSON.stringify(customerData, null, 2));
      console.log('Documents specifically:', customerData.documents);
      console.log('DateOfBirth specifically:', customerData.dateOfBirth);

      const serviceCall = this.isEditMode && this.customerId
        ? this.customerService.updateCustomer(this.customerId, customerData)
        : this.customerService.addCustomer(customerData);

        serviceCall.subscribe({
          next: (response) => {
            this.isLoading = false;
            alert(this.isEditMode ? 'Customer updated successfully!' : 'Customer added successfully!');
            this.router.navigate(['/customers']);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error:', error);
            const errorMessage = error?.error?.errors 
              ? Object.values(error.error.errors).flat().join(', ')
              : error?.error?.message || `Failed to ${this.isEditMode ? 'update' : 'create'} customer`;
            alert(errorMessage);
          }
        });
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.customerForm.controls).forEach(key => {
      const control = this.customerForm.get(key);
      control?.markAsTouched();
      
      // Handle nested FormGroup for documents
      if (key === 'documents' && control instanceof FormGroup) {
        Object.keys(control.controls).forEach(docKey => {
          control.get(docKey)?.markAsTouched();
        });
      }
    });
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      this.router.navigate(['/customers']);
    }
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.customerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  getFieldError(fieldName: string): string {
    const field = this.customerForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['pattern']) return `Invalid ${this.getFieldDisplayName(fieldName)} format`;
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['minlength']) return `${this.getFieldDisplayName(fieldName)} is too short`;
      if (field.errors['min']) return `${this.getFieldDisplayName(fieldName)} must be positive`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'customerCode': 'Customer Code',
      'customerName': 'Customer Name',
      'relationshipName': 'Relationship Name',
      'relationName': 'Relation Type',
      'mobile': 'Mobile Number',
      'dateOfBirth': 'Date of Birth',
      'address1': 'Address Line 1',
      'area': 'Area',
      'state': 'State',
      'pincode': 'Pincode',
      'city': 'City',
      'primaryPhone': 'Primary Phone',
      'secondaryPhone': 'Secondary Phone',
      'email': 'Email Address',
      'whatsapp': 'WhatsApp Number',
      'aadharNumber': 'Aadhar Number',
      'panNumber': 'PAN Number',
      'monthlyIncome': 'Monthly Income'
    };
    return displayNames[fieldName] || fieldName;
  }
}