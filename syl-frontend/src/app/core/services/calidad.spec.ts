import { TestBed } from '@angular/core/testing';

import { Calidad } from './calidad';

describe('Calidad', () => {
  let service: Calidad;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Calidad);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
