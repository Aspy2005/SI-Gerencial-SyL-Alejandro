import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduccionList } from './produccion-list';

describe('ProduccionList', () => {
  let component: ProduccionList;
  let fixture: ComponentFixture<ProduccionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProduccionList],
    }).compileComponents();

    fixture = TestBed.createComponent(ProduccionList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
