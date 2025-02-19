import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from './links.service';
import { Repository } from 'typeorm';
import { Link } from './entities/link.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

describe('LinksService', () => {
  let service: LinksService;
  let repository: Repository<Link>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: getRepositoryToken(Link),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    repository = module.get<Repository<Link>>(getRepositoryToken(Link));
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería obtener estadísticas de un enlace', async () => {
    const link = {
      id: '123',
      shortenedUrl: 'a1b2c3',
      originalUrl: 'https://example.com',
      clicks: 10,
      isValid: true,
      createdAt: new Date(),
      expirationDate: null,
    };

    mockRepository.findOne.mockResolvedValue(link);

    const stats = await service.getStats('123');
    expect(stats).toEqual({
      shortenedUrl: link.shortenedUrl,
      originalUrl: link.originalUrl,
      clicks: link.clicks,
      isValid: link.isValid,
      createdAt: link.createdAt,
      expirationDate: link.expirationDate,
    });
  });

  it('debería lanzar un error si el enlace no existe', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.getStats('999')).rejects.toThrow('El enlace no existe.');
  });
});
