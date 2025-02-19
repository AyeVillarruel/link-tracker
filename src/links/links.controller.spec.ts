import { Test, TestingModule } from '@nestjs/testing';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';

const mockLinksService = {
  getStats: jest.fn(),
  invalidateLink: jest.fn(),
};

describe('LinksController', () => {
  let controller: LinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [
        {
          provide: LinksService,
          useValue: mockLinksService,
        },
      ],
    }).compile();

    controller = module.get<LinksController>(LinksController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería obtener estadísticas de un enlace', async () => {
    const stats = {
      shortenedUrl: 'a1b2c3',
      originalUrl: 'https://example.com',
      clicks: 5,
      isValid: true,
      createdAt: new Date(),
      expirationDate: null,
    };

    mockLinksService.getStats.mockResolvedValue(stats);

    const result = await controller.getStats('123');
    expect(result).toEqual(stats);
  });

  it('debería invalidar un enlace', async () => {
    mockLinksService.invalidateLink.mockResolvedValue({ message: 'El enlace ha sido invalidado exitosamente.' });

    const result = await controller.invalidate('123');
    expect(result).toEqual({ message: 'El enlace ha sido invalidado exitosamente.' });
  });
});
