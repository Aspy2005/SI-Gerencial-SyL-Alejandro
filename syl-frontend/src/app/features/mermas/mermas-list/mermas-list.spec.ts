import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MermasList } from './mermas-list';

describe('MermasList', () => {
  let component: MermasList;
  let fixture: ComponentFixture<MermasList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MermasList],
    }).compileComponents();

    fixture = TestBed.createComponent(MermasList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
