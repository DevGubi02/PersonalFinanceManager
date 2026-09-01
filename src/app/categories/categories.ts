// Import the Angular building blocks and our services/models.
import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core'; // Component + signals + OnPush.
import { CommonModule } from '@angular/common';      // *ngFor, *ngIf.
import { FormsModule } from '@angular/forms';        // [(ngModel)] two-way binding.
import { Nav } from '../shared/nav/nav';             // The top navigation bar.
import { Api } from '../services/api';               // Our API service.
import { Category } from '../models/models';         // The Category data shape.
import { ToastService } from '../services/toast';

@Component({
  selector: 'app-categories',                        // The HTML tag <app-categories>.
  standalone: true,                                  // Manages its own imports.
  imports: [CommonModule, FormsModule, Nav],         // Directives + forms + nav bar.
  changeDetection: ChangeDetectionStrategy.OnPush,   // Only re-render when signals change (fast + predictable).
  templateUrl: './categories.html',                  // The HTML layout.
  styleUrl: './categories.css'                       // The styles.
})
export class Categories implements OnInit {          // The categories page component.
  // "items" is a SIGNAL holding the list. When we call items.set(...), Angular re-renders instantly.
  items = signal<Category[]>([]);                    // The list of categories shown on screen.
  loading = signal<boolean>(true);                   // True while loading (a signal so the UI updates at once).
  saving = signal<boolean>(false);                   // True while saving (a signal).

  newItem: Category = { name: '', type: 'Expense' }; // The "new category" form model (bound with ngModel).

  constructor(private api: Api, private toast: ToastService) {} // Receive the API service and toast helper.

  ngOnInit(): void { this.load(); }                  // Load categories when the page opens.

  // Fetch the categories from the API.
  load(): void {                                     // The load method.
    this.loading.set(true);                          // Show loading (updates the UI immediately).
    this.api.getCategories().subscribe({             // Ask the API for the categories.
      next: (data) => {                               // Runs when the data arrives.
        this.items.set(data);                         // Store the list in the signal -> UI updates instantly.
        this.loading.set(false);                      // Done loading.
      },
      error: () => {                                  // Runs if the request fails.
        this.loading.set(false);                      // Stop loading on error.
      }
    });
  }

  // Add a new category from the form.
  add(): void {                                      // The add method.
    if (!this.newItem.name.trim()) {
      this.toast.show('Please enter a category name.');
      return; // Require a category name.
    }

    this.saving.set(true);                           // Show saving (updates the UI immediately).
    this.api.createCategory(this.newItem).subscribe({ // Ask the API to create it.
      next: () => {                                   // Runs on success.
        this.saving.set(false);                       // Done saving.
        this.newItem = { name: '', type: 'Expense' }; // Reset the form.
        this.load();                                  // Refresh the list.
      },
      error: () => {                                  // Runs on failure.
        this.saving.set(false);                       // Stop saving on error.
      }
    });
  }

  // Delete a category after confirming with the user.
  remove(id?: number): void {                        // The delete method.
    if (!id) return;                                 // Need an id to delete.
    if (!confirm('Delete this category?')) return;   // Ask for confirmation.
    this.api.deleteCategory(id).subscribe(() => this.load()); // Delete then refresh.
  }
}
