import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router,NavigationEnd  } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

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
}

interface PendingAction {
  action: string;
  count: number;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App  implements OnInit  {
  title = 'jewelry-management-system';
  isPrintRoute = false; 
  activeMenu: string = 'Dashboard';
  expandedMenus: { [key: string]: boolean } = {};
  sidebarOpen: boolean = true;
  showProfileDropdown: boolean = false;
  searchTerm: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Listen to route changes to detect print routes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Check if current route is a print route
        this.isPrintRoute = event.url.includes('/printreceipt/') || 
                           event.url.includes('/printloan/');
      });
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
        { id: 'Loans', label: 'Loans', icon: 'credit_card', route: '/viewloan' },
        { id: 'Receipts', label: 'Receipts', icon: 'receipt', route: '/receipt' },
        // { id: 'Redemptions', label: 'Redemptions', icon: 'refresh', route: '/redemptions' },
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
        { id: 'ItemGroups', label: 'Item Groups', icon: 'category', route: '/itemgroups' },
        { id: 'Items', label: 'Item Type', icon: 'diamond', route: '/itemtypes' },
        { id: 'Customers', label: 'Customers', icon: 'people', route: '/customers' },
        { id: 'JewelFault', label: 'JewelFault', icon: 'local_shipping', route: '/jewelfault' },
        { id: 'Purity', label: 'Purity', icon: 'star', route: '/purity' },
        { id: 'Schemes', label: 'Schemes', icon: 'event', route: '/schemes' },
        { id: 'Locations', label: 'Area', icon: 'place', route: '/viewArea' },
        { id: 'Company', label: 'Company', icon: 'place', route: '/viewCompany' }
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

  dashboardStats: DashboardStats[] = [
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
  ];

  recentLoans: RecentLoan[] = [
    { customer: 'Rajesh Kumar', amount: '₹50,000', item: 'Gold Necklace', date: '2025-01-22' },
    { customer: 'Priya Sharma', amount: '₹75,000', item: 'Gold Bangles', date: '2025-01-21' },
    { customer: 'Amit Patel', amount: '₹1,25,000', item: 'Diamond Ring', date: '2025-01-20' }
  ];

  pendingActions: PendingAction[] = [
    { action: 'Loan Maturity Due', count: 12, color: 'text-red-600', bg: 'bg-red-100' },
    { action: 'Auction Items', count: 8, color: 'text-orange-600', bg: 'bg-orange-100' },
    { action: 'Customer Verification', count: 5, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { action: 'Repledge Approvals', count: 3, color: 'text-blue-600', bg: 'bg-blue-100' }
  ];

  toggleSubmenu(menuId: string): void {
    this.expandedMenus[menuId] = !this.expandedMenus[menuId];
  }

  handleMenuClick(menuId: string, parentId?: string): void {
    if (parentId) {
      this.activeMenu = `${parentId}-${menuId}`;
      // Navigate to the specific route
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
    // Add logout logic here
    this.router.navigate(['/login']);
    this.showProfileDropdown = false;
  }

  onAddNew(): void {
    const currentSection = this.getPageTitle();
    console.log(`Add new ${currentSection} clicked`);
  }

  // Check if current route matches dashboard
  isDashboardRoute(): boolean {
    return this.router.url === '/dashboard' || this.router.url === '/';
  }
}
