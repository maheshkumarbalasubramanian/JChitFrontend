// guards/item-group.guard.ts - Route guard for edit mode
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { ItemGroupService } from '../service/Item-group-service';

export const itemGroupEditGuard: CanActivateFn = (route) => {
  const itemGroupService = inject(ItemGroupService);
  const router = inject(Router);
  const id = route.params['id'];

  if (!id) {
    router.navigate(['/item-groups']);
    return false;
  }

  return itemGroupService.getItemGroupById(id).pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/item-groups']);
      return of(false);
    })
  );
};