import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MallasList } from './mallas-list';

describe('MallasList', () => {
  let component: MallasList;
  let fixture: ComponentFixture<MallasList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MallasList],
    }).compileComponents();

    fixture = TestBed.createComponent(MallasList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
