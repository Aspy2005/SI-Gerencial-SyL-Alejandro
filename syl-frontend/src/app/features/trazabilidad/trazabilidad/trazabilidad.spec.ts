import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Trazabilidad } from './trazabilidad';

describe('Trazabilidad', () => {
  let component: Trazabilidad;
  let fixture: ComponentFixture<Trazabilidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Trazabilidad],
    }).compileComponents();

    fixture = TestBed.createComponent(Trazabilidad);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
