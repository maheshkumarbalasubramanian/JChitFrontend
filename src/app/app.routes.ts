import { Routes } from '@angular/router';
import { AddCustomer } from './app/add-customer/add-customer';
import { ViewCustomer } from './app/view-customer/view-customer';
import { App } from './app';
import { ItemAddComponent } from './app/item-add-component/item-add-component';
import { MainComponent } from './app/main-component/main-component';
import { ItemGroupAddComponent } from './app/item-group-add-component/item-group-add-component';
import { PurityAddComponent } from './app/purity-add-component/purity-add-component';
import { ItemGroupComponent } from './app/item-group-component/item-group-component';
import { ItemComponent } from './app/item-component/item-component';
import { PurityComponent } from './app/purity-component/purity-component';
import { SchemeAddEditComponent } from './app/scheme-add-edit-component/scheme-add-edit-component';
import { SchemesViewComponent } from './app/schemes-view-component/schemes-view-component';
import { GoldLoanCreateComponent } from './app/gold-loan-create-component/gold-loan-create-component';
import { ViewLoan } from './app/view-loan/view-loan';
import { AreaComponent } from './app/area/area';
import { AddAreaComponent } from './app/area-add/area-add';
import { AddRateSetComponent } from './app/rate-set/rate-set';
import { JewelFaultViewComponent } from './app/jewel-fault-view-component/jewel-fault-view-component';
import { JewelFaultComponent } from './app/jewel-fault-componenet/jewel-fault-component';
import { ReceiptComponent } from './app/receipt-component/receipt-component';
import { ViewReceiptComponent } from './app/view-receipt-component/view-receipt-component';
import { CompanyAddComponent } from './app/company-add-component/company-add-component';
import { CompanyViewComponent } from './app/company-view-component/company-view-component';
import { AddItemTypeComponent } from './app/add-item-type-component/add-item-type-component';
import { PrintComponent } from './app/print-component/print-component';
import { PrintReceiptComponent } from './app/print-receipt-component/print-receipt-component';

export const routes: Routes = [
    { path: '', component: MainComponent },
    { path: 'dashboard', component: MainComponent },
    { path: 'customers', component: ViewCustomer },
    { path: 'customers/add', component: AddCustomer },
    { path: 'customers/edit/:id', component: AddCustomer },
    { path: 'customers/view/:id', component: AddCustomer },

    { path: 'itemtypes/add', component:AddItemTypeComponent},
    { path: 'itemtypes/edit/:id', component:AddItemTypeComponent},
    { path: 'itemtypes/view/:id', component:AddItemTypeComponent},
    { path: 'itemtypes', component:ItemComponent},

    { path: 'itemgroups/add', component:ItemGroupAddComponent},
    { path: 'itemgroups/edit/:id', component:ItemGroupAddComponent},
    { path: 'itemgroups/view/:id', component:ItemGroupAddComponent},
    { path: 'itemgroups', component:ItemGroupComponent},

    { path: 'purity/add', component:PurityAddComponent},
    { path: 'purity/edit/:id', component:PurityAddComponent},
    { path: 'purity/view/:id', component:PurityAddComponent},
    { path: 'purity', component:PurityComponent},

    { path: 'schemes/add', component:SchemeAddEditComponent},
    { path: 'schemes/edit/:id', component:SchemeAddEditComponent},
    { path: 'schemes/view/:id', component:SchemeAddEditComponent},
    { path: 'schemes', component:SchemesViewComponent},


    { path: 'loans/add', component:GoldLoanCreateComponent},
    { path: 'loans/edit/:id', component:GoldLoanCreateComponent},
    { path: 'loans/view/:id', component:GoldLoanCreateComponent},
    { path: 'viewloan', component:ViewLoan},

     { path: 'area/add', component:AddAreaComponent},
     { path: 'area/edit/:id', component:AddAreaComponent},
     { path: 'area/view/:id', component:AddAreaComponent},
     { path: 'viewArea', component:AreaComponent},
     { path: 'rateSet/add', component:AddRateSetComponent},

     { path: 'jewelfault/add', component:JewelFaultComponent},
     { path: 'jewelfault/edit/:id', component:JewelFaultComponent},
     { path: 'jewelfault/view/:id', component:JewelFaultComponent},
     { path: 'jewelfault', component:JewelFaultViewComponent},

     { path: 'receipt', component:ViewReceiptComponent},
     { path: 'receipt/add', component:ReceiptComponent},
     { path: 'receipt/edit/:id', component:ReceiptComponent},

     { path: 'company/add', component:CompanyAddComponent},
     { path: 'company/edit/:id', component:CompanyAddComponent},
     { path: 'company/view/:id', component:CompanyAddComponent},
     { path: 'viewCompany', component:CompanyViewComponent},

     { path: 'printloan/:id', component:PrintComponent},
     { path: 'printreceipt/:id', component: PrintReceiptComponent },

  ];
