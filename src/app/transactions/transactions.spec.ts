import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Api } from '../services/api';
import { Transactions } from './transactions';

describe('Transactions', () => {
  let component: Transactions;
  let fixture: ComponentFixture<Transactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [
        {
          provide: Api,
          useValue: {
            getCategories: () => of([]),
            getTransactions: () => of([]),
            createTransaction: () => of({}),
            deleteTransaction: () => of(undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Transactions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should update the transaction type when a category is selected', () => {
    component['categoriesSignal'].set([
      { id: 7, name: 'Salary', type: 'Income' },
      { id: 8, name: 'Groceries', type: 'Expense' },
    ]);

    component.newItem.categoryId = 7;
    component.onCategoryChange();

    expect(component.newItem.type).toBe('Income');
  });
});
