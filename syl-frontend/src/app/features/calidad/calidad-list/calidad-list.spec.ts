import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalidadList } from './calidad-list';

describe('CalidadList', () => {
  let component: CalidadList;
  let fixture: ComponentFixture<CalidadList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalidadList],
    }).compileComponents();

    fixture = TestBed.createComponent(CalidadList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
