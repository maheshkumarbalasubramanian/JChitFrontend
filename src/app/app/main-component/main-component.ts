import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AreaService } from '../../service/area-service';
import { RateSetService } from '../../service/rate-set.service';

// Keep existing interfaces
interface MenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  route?: string;
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
}

interface DashboardStats {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  bgColor: string;
  iconColor: string;
}

interface RecentLoan {
  customer: string;
  amount: string;
  item: string;
  date: string;
  areaId: string;
}

interface PendingAction {
  action: string;
  count: number;
  color: string;
  bg: string;
  areaId: string;
}

interface Area {
  id: string;
  areaCode: string;
  areaName: string;
}

interface RateInfo {
  goldRate: number;
  goldPurityRate: number;
  silverRate: number;
  silverPurityRate: number;
  effectiveDate: string;
  areaId: string;
}

@Component({
  selector: 'app-main-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './main-component.html',
  styleUrl: './main-component.scss'
})
export class MainComponent implements OnInit {
  private router = inject(Router);
  private areaService = inject(AreaService);
  private rateSetService = inject(RateSetService);

  title = 'jewelry-management-system';
  
  activeMenu: string = 'Dashboard';
  expandedMenus: { [key: string]: boolean } = {};
  sidebarOpen: boolean = true;
  showProfileDropdown: boolean = false;
  searchTerm: string = '';
  
  // Area filtering
  selectedAreaId: string = 'all';
  areas: Area[] = [];
  currentRates: RateInfo | null = null;
  isLoadingRates = false;

  // Hardcoded company ID - replace when you have authentication
  private readonly TEMP_COMPANY_ID = '295f4eb8-7d9a-4bf7-86e2-7b0c9f1b70ad'; // Replace with your company GUID

  ngOnInit(): void {
    this.loadAreas();
    this.loadDashboardData();
  }

  menuItems: MenuItem[] = [
    {
      id: 'Dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      color: 'text-blue-600',
      route: '/dashboard'
    },
    {
      id: 'Loans',
      label: 'Loan/Pledges',
      icon: 'attach_money',
      color: 'text-green-600',
      submenu: [
        { id: 'Loans', label: 'Loans', icon: 'credit_card', route: '/loans' },
        { id: 'Receipts', label: 'Receipts', icon: 'receipt', route: '/receipts' },
        { id: 'Redemptions', label: 'Redemptions', icon: 'refresh', route: '/redemptions' },
        { id: 'Auctions', label: 'Auctions', icon: 'gavel', route: '/auctions' },
        { id: 'ReLoan', label: 'ReLoan', icon: 'repeat', route: '/reloan' }
      ]
    },
    {
      id: 'Masters',
      label: 'Masters',
      icon: 'inventory_2',
      color: 'text-purple-600',
      submenu: [
        { id: 'ItemGroups', label: 'Item Groups', icon: 'category', route: '/item-groups' },
        { id: 'Items', label: 'Items', icon: 'diamond', route: '/itemtypes' },
        { id: 'Customers', label: 'Customers', icon: 'people', route: '/customers' },
        { id: 'Suppliers', label: 'Suppliers', icon: 'local_shipping', route: '/suppliers' },
        { id: 'Purity', label: 'Purity', icon: 'star', route: '/purity' },
        { id: 'Schemes', label: 'Schemes', icon: 'event', route: '/schemes' },
        { id: 'Areas', label: 'Areas', icon: 'place', route: '/areas' },
        { id: 'RateSets', label: 'Rate Sets', icon: 'trending_up', route: '/ratesets' }
      ]
    },
    {
      id: 'Repledge',
      label: 'Repledge',
      icon: 'repeat',
      color: 'text-orange-600',
      submenu: [
        { id: 'RPPayments', label: 'RP Payments', icon: 'payment', route: '/rp-payments' },
        { id: 'RPClosures', label: 'RP Closures', icon: 'close', route: '/rp-closures' },
        { id: 'OpeningRepledge', label: 'Opening Repledge', icon: 'launch', route: '/opening-repledge' },
        { id: 'OpeningRepayments', label: 'Opening Repayments', icon: 'receipt_long', route: '/opening-repayments' },
        { id: 'SupplierHistory', label: 'Supplier History', icon: 'history', route: '/supplier-history' }
      ]
    },
    {
      id: 'Reports',
      label: 'Reports',
      icon: 'assessment',
      color: 'text-indigo-600',
      submenu: [
        { id: 'DayHistory', label: 'Day History', icon: 'today', route: '/day-history' },
        { id: 'LoanSummary', label: 'Loan Summary', icon: 'bar_chart', route: '/loan-summary' },
        { id: 'CustomerHistory', label: 'Customer History', icon: 'person_search', route: '/customer-history' },
        { id: 'LoanHistory', label: 'Loan History', icon: 'history', route: '/loan-history' },
        { id: 'AuctionHistory', label: 'Auction History', icon: 'gavel', route: '/auction-history' },
        { id: 'PendingReport', label: 'Pending Report', icon: 'pending_actions', route: '/pending-report' }
      ]
    },
    {
      id: 'Settings',
      label: 'Settings',
      icon: 'settings',
      color: 'text-gray-600',
      submenu: [
        { id: 'Users', label: 'Users', icon: 'group', route: '/users' },
        { id: 'Roles', label: 'Roles', icon: 'security', route: '/roles' }
      ]
    }
  ];

  // Mock data for stats, loans, and actions (keep as is for now)
  allDashboardStats: { [areaId: string]: DashboardStats[] } = {
    'all': [
      {
        title: 'Total Loans',
        value: '₹24,50,000',
        change: '+12% from last month',
        changeType: 'positive',
        icon: 'attach_money',
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600'
      },
      {
        title: 'Active Customers',
        value: '1,248',
        change: '+8% from last month',
        changeType: 'positive',
        icon: 'people',
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600'
      },
      {
        title: 'Gold in Pledge',
        value: '842.5kg',
        change: '+5% from last month',
        changeType: 'positive',
        icon: 'diamond',
        bgColor: 'bg-purple-100',
        iconColor: 'text-purple-600'
      },
      {
        title: 'Pending Actions',
        value: '28',
        change: 'Requires attention',
        changeType: 'negative',
        icon: 'schedule',
        bgColor: 'bg-orange-100',
        iconColor: 'text-orange-600'
      }
    ]
  };

  allRecentLoans: { [areaId: string]: RecentLoan[] } = {
    'all': [
      { customer: 'Rajesh Kumar', amount: '₹50,000', item: 'Gold Necklace', date: '2025-01-22', areaId: '1' },
      { customer: 'Priya Sharma', amount: '₹75,000', item: 'Gold Bangles', date: '2025-01-21', areaId: '2' },
      { customer: 'Amit Patel', amount: '₹1,25,000', item: 'Diamond Ring', date: '2025-01-20', areaId: '1' }
    ]
  };

  allPendingActions: { [areaId: string]: PendingAction[] } = {
    'all': [
      { action: 'Loan Maturity Due', count: 12, color: 'text-red-600', bg: 'bg-red-100', areaId: 'all' },
      { action: 'Auction Items', count: 8, color: 'text-orange-600', bg: 'bg-orange-100', areaId: 'all' },
      { action: 'Customer Verification', count: 5, color: 'text-yellow-600', bg: 'bg-yellow-100', areaId: 'all' },
      { action: 'Repledge Approvals', count: 3, color: 'text-blue-600', bg: 'bg-blue-100', areaId: 'all' }
    ]
  };

  // Computed properties
  get dashboardStats(): DashboardStats[] {
    return this.allDashboardStats[this.selectedAreaId] || this.allDashboardStats['all'];
  }

  get recentLoans(): RecentLoan[] {
    if (this.selectedAreaId === 'all') {
      return this.allRecentLoans['all'];
    }
    return this.allRecentLoans[this.selectedAreaId] || [];
  }

  get pendingActions(): PendingAction[] {
    return this.allPendingActions[this.selectedAreaId] || this.allPendingActions['all'];
  }

  loadAreas(): void {
    this.areaService.getAreasByCompany(this.TEMP_COMPANY_ID).subscribe({
      next: (areas) => {
        this.areas = areas.map(area => ({
          id: area.id,
          areaCode: area.areaCode,
          areaName: area.areaName
        }));
        
        // Set first area as default if available
        if (this.areas.length > 0) {
          this.selectedAreaId = this.areas[0].id;
          this.updateCurrentRates();
        }
      },
      error: (error) => {
        console.error('Error loading areas:', error);
        // Keep mock data as fallback
        this.areas = [
          { id: '1', areaCode: 'AR001', areaName: 'Jubilee Hills' },
          { id: '2', areaCode: 'AR002', areaName: 'Banjara Hills' }
        ];
      }
    });
  }

  loadDashboardData(): void {
    this.updateCurrentRates();
  }

  onAreaChange(): void {
    this.updateCurrentRates();
    console.log('Area changed to:', this.selectedAreaId);
  }

  updateCurrentRates(): void {
    if (this.selectedAreaId === 'all' || !this.selectedAreaId) {
      this.currentRates = null;
      return;
    }

    this.isLoadingRates = true;
    this.rateSetService.getCurrentRateSetByArea(this.selectedAreaId).subscribe({
      next: (response) => {
        if (response.success) {
          const rateData = response.data;
          this.currentRates = {
            goldRate: rateData.goldRatePerGram,
            goldPurityRate: rateData.goldPurityRatePerGram,
            silverRate: rateData.silverRatePerGram,
            silverPurityRate: rateData.silverPurityRatePerGram,
            effectiveDate: new Date(rateData.effectiveDate).toLocaleDateString('en-IN'),
            areaId: rateData.areaId
          };
        } else {
          this.currentRates = null;
        }
        this.isLoadingRates = false;
      },
      error: (error) => {
        console.error('Error loading current rates:', error);
        this.currentRates = null;
        this.isLoadingRates = false;
      }
    });
  }

  getSelectedAreaName(): string {
    if (this.selectedAreaId === 'all') {
      return 'All Areas';
    }
    const area = this.areas.find(a => a.id === this.selectedAreaId);
    return area ? `${area.areaCode} - ${area.areaName}` : 'Unknown Area';
  }

  navigateToRateSets(): void {
    this.router.navigate(['/ratesets']);
  }

  navigateToAddRateSet(): void {
    this.router.navigate(['/rateSet/add']);
  }

  toggleSubmenu(menuId: string): void {
    this.expandedMenus[menuId] = !this.expandedMenus[menuId];
  }

  handleMenuClick(menuId: string, parentId?: string): void {
    if (parentId) {
      this.activeMenu = `${parentId}-${menuId}`;
      const parentItem = this.menuItems.find(item => item.id === parentId);
      const subItem = parentItem?.submenu?.find(sub => sub.id === menuId);
      if (subItem?.route) {
        this.router.navigate([subItem.route]);
      }
    } else {
      this.activeMenu = menuId;
      const menuItem = this.menuItems.find(item => item.id === menuId);
      
      if (menuItem?.route) {
        this.router.navigate([menuItem.route]);
      } else if (menuItem?.submenu) {
        this.toggleSubmenu(menuId);
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  isMenuActive(menuId: string, parentId?: string): boolean {
    if (parentId) {
      return this.activeMenu === `${parentId}-${menuId}`;
    }
    return this.activeMenu === menuId || this.activeMenu.startsWith(menuId + '-');
  }

  isSubmenuExpanded(menuId: string): boolean {
    return this.expandedMenus[menuId] || false;
  }

  getPageTitle(): string {
    if (this.activeMenu.includes('-')) {
      return this.activeMenu.split('-')[1];
    }
    return this.activeMenu;
  }

  onSearch(): void {
    console.log('Searching for:', this.searchTerm);
  }

  onProfile(): void {
    console.log('Profile clicked');
    this.router.navigate(['/profile']);
    this.showProfileDropdown = false;
  }

  onChangePassword(): void {
    console.log('Change password clicked');
    this.router.navigate(['/change-password']);
    this.showProfileDropdown = false;
  }

  onLogout(): void {
    console.log('Logout clicked');
    this.router.navigate(['/login']);
    this.showProfileDropdown = false;
  }

  onAddNew(): void {
    const currentSection = this.getPageTitle();
    console.log(`Add new ${currentSection} clicked`);
  }

  isDashboardRoute(): boolean {
    return this.router.url === '/dashboard' || this.router.url === '/';
  }
}