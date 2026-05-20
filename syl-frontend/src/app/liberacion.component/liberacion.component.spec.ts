import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiberacionComponent } from './liberacion.component';

describe('LiberacionComponent', () => {
  let component: LiberacionComponent;
  let fixture: ComponentFixture<LiberacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LiberacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LiberacionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
