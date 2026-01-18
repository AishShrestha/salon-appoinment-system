import { Test, TestingModule } from '@nestjs/testing';
import { KhaltiService } from './khalti.service';

describe('KhaltiService', () => {
  let service: KhaltiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KhaltiService],
    }).compile();

    service = module.get<KhaltiService>(KhaltiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
