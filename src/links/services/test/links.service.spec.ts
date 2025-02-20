import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from '../links.service';
import { Repository } from 'typeorm';
import { Link } from '../../entities/link.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('LinksService', () => {
  let service: LinksService;
  let repository: Repository<Link>;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    clear: jest.fn(),
  };

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
  
    jest.clearAllMocks();
  
  });
  

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve link statistics', async () => {
    const link = {
      shortenedUrl: 'a1b2c3',
      originalUrl: 'https://example.com',
      clicks: 10,
      isValid: true,
      createdAt: new Date(),
      expirationDate: null,
    };

    mockRepository.findOne.mockResolvedValue(link);

    const stats = await service.getStats('a1b2c3');
    expect(stats).toEqual(link);
  });

  it('should throw an error if the link does not exist in getStats', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.getStats('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should throw an error if the link is invalidated in getOriginalUrl', async () => {
    const link = { shortenedUrl: 'test123', isValid: false };

    mockRepository.findOne.mockResolvedValue(link);

    await expect(service.getOriginalUrl('test123')).rejects.toThrow(ForbiddenException);
  });

  it('should throw an error if the link has expired', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    const link = { shortenedUrl: 'test123', isValid: true, expirationDate: expiredDate };

    mockRepository.findOne.mockResolvedValue(link);

    await expect(service.getOriginalUrl('test123')).rejects.toThrow(ForbiddenException);
  });
  
  it('should return an error if no password is provided for a protected link', async () => {
    const link = {
      shortenedUrl: 'protected123',
      isValid: true,
      passwordHash: await bcrypt.hash('secure123', 10),
    };
  
    mockRepository.findOne.mockResolvedValue(link);
  
    await expect(service.getOriginalUrl('protected123'))
      .rejects.toThrow(ForbiddenException);
  
    await expect(service.getOriginalUrl('protected123'))
      .rejects.toThrow('This link is password protected. Please provide a password.');
  });

  it('should throw an error if the password is incorrect', async () => {
    const passwordHash = await bcrypt.hash('correct_password', 10);

    const link = { shortenedUrl: 'test123', isValid: true, passwordHash };

    mockRepository.findOne.mockResolvedValue(link);

    await expect(service.getOriginalUrl('test123', 'wrong_password')).rejects.toThrow(ForbiddenException);
  });

  it('should return the original URL and increment clicks regardless of the request source', async () => {
    const mockRequest = { headers: { 'user-agent': 'Mozilla/5.0' } } as any;

    const link = {
      originalUrl: 'https://example.com',
      shortenedUrl: 'test123',
      passwordHash: await bcrypt.hash('correct_password', 10),
      isValid: true,
      clicks: 0,
    };

    mockRepository.findOne.mockResolvedValue(link);
    mockRepository.save.mockResolvedValue(link);

    const url = await service.getOriginalUrl('test123', 'correct_password', mockRequest);

    expect(url).toBe('https://example.com');
    expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ clicks: 1 }));
  });

  it('should create a link and return the shortenedUrl', async () => {
    const createDto = {
      originalUrl: 'https://example.com',
      password: 'secure123',
      expirationDate: '2025-02-28T00:00:00.000Z',
    };

    mockRepository.create.mockReturnValue(createDto);
    mockRepository.save.mockResolvedValue({ shortenedUrl: 'a1b2c3' });

    const result = await service.createLink(createDto);
    expect(result).toHaveProperty('shortenedUrl');
  });

  it('should invalidate a link', async () => {
    const link = { shortenedUrl: 'a1b2c3', isValid: true };

    mockRepository.findOne.mockResolvedValue(link);
    mockRepository.save.mockResolvedValue({ ...link, isValid: false });

    const result = await service.invalidateLink('a1b2c3');
    expect(result).toEqual({ message: 'The link has been successfully invalidated.' });
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should throw an error when invalidating a non-existent link', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.invalidateLink('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should increment clicks when the link is accessed from any source', async () => {
    const mockRequest = { headers: { 'user-agent': 'PostmanRuntime' } } as any;

    const link = {
      originalUrl: 'https://example.com',
      shortenedUrl: 'test123',
      isValid: true,
      clicks: 5,
    };

    mockRepository.findOne.mockResolvedValue(link);
    mockRepository.save.mockResolvedValue({ ...link, clicks: 6 });

    await service.getOriginalUrl('test123', undefined, mockRequest);

    expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ clicks: 6 }));
  });
  
});
