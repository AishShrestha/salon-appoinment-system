import { Test, TestingModule } from '@nestjs/testing';
import { KhaltiController } from './khalti.controller';

describe('KhaltiController', () => {
  let controller: KhaltiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KhaltiController],
    }).compile();

    controller = module.get<KhaltiController>(KhaltiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
