// components/bulk-purity-assignment/bulk-purity-assignment.component.ts
import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurityService, Purity} from '../../service/purity.service';

@Component({
  selector: 'app-bulk-purity-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Assign Purity to {{ selectedItemCount }} Item(s)</h3>
          <button class="close-btn" (click)="onCancel()">
            <i class="fa fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="puritySelect">Select Purity:</label>
            <select 
              id="puritySelect" 
              class="form-control" 
              [(ngModel)]="selectedPurityId"
              [disabled]="isLoading">
              <option value="">-- Select Purity --</option>
              <option *ngFor="let purity of availablePurities" [value]="purity.id">
                {{ purity.purityName }} ({{ purity.purityPercentage }}%{{ purity.karat ? ', ' + purity.karat : '' }})
              </option>
            </select>
          </div>
          
          <div class="warning-message" *ngIf="selectedPurityId">
            <i class="fa fa-exclamation-triangle"></i>
            This will update the purity for all selected items. Items with existing purities will be overwritten.
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onCancel()" [disabled]="isLoading">
            Cancel
          </button>
          <button 
            class="btn btn-primary" 
            (click)="onAssign()" 
            [disabled]="!selectedPurityId || isLoading">
            <i class="fa fa-spinner fa-spin" *ngIf="isLoading"></i>
            <i class="fa fa-gem" *ngIf="!isLoading"></i>
            {{ isLoading ? 'Assigning...' : 'Assign Purity' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e9ecef;

      h3 {
        margin: 0;
        color: #2c3e50;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        padding: 4px;

        &:hover {
          color: #666;
        }
      }
    }

    .modal-body {
      padding: 24px;

      .form-group {
        margin-bottom: 16px;

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #2c3e50;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;

          &:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          &:disabled {
            background: #f8f9fa;
            opacity: 0.7;
          }
        }
      }

      .warning-message {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 12px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;

        i {
          color: #f39c12;
        }
      }
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 20px 24px;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
      border-radius: 0 0 12px 12px;

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &.btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;

          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
        }

        &.btn-secondary {
          background: #6c757d;
          color: white;

          &:hover:not(:disabled) {
            background: #5a6268;
          }
        }
      }
    }
  `]
})
export class BulkPurityAssignmentComponent {
  private purityService = inject(PurityService);

  @Input() isVisible = false;
  @Input() selectedItemCount = 0;
  @Input() selectedItemIds: string[] = [];
  @Output() assign = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  availablePurities: Purity[] = [];
  selectedPurityId = '';
  isLoading = false;

  ngOnInit() {
    this.loadPurities();
  }

  loadPurities() {
    this.purityService.getPurities().subscribe({
      next: (purities:any) => {
        this.availablePurities = purities;
      },
      error: (error:any) => {
        console.error('Error loading purities:', error);
      }
    });
  }

  onAssign() {
    if (this.selectedPurityId) {
      this.assign.emit(this.selectedPurityId);
    }
  }

  onCancel() {
    this.selectedPurityId = '';
    this.cancel.emit();
  }
}