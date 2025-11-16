// guards/item.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { ItemService } from '../service/item.service';

export const itemEditGuard: CanActivateFn = (route) => {
  const itemService = inject(ItemService);
  const router = inject(Router);
  const id = route.params['id'];

  if (!id) {
    router.navigate(['/itemtypes']);
    return false;
  }

  return itemService.getItemById(id).pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/itemtypes']);
      return of(false);
    })
  );
};