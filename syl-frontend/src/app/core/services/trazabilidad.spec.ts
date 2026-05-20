import { TestBed } from '@angular/core/testing';

import { Trazabilidad } from './trazabilidad';

describe('Trazabilidad', () => {
  let service: Trazabilidad;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Trazabilidad);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
