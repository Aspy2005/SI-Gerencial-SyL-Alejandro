import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotesListComponent } from './lotes-list';

describe('LotesListComponentt', () => {
  let component: LotesListComponent;
  let fixture: ComponentFixture<LotesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LotesListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LotesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
