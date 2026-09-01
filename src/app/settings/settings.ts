import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Nav } from '../shared/nav/nav';
import { CurrencyService } from '../services/currency';
import { ProfilePictureService } from '../services/profile-picture';

@Component({
  selector: 'app-settings',
  imports: [Nav, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
  readonly currencyService = inject(CurrencyService);
  readonly profilePictureService = inject(ProfilePictureService);
  readonly countryControl = new FormControl(this.currencyService.selectedCountry(), { nonNullable: true });

  selectCountry(): void {
    this.currencyService.setCountry(this.countryControl.value);
  }
}
