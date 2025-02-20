import { Test, TestingModule } from '@nestjs/testing';
import { LinksController } from '../links.controller';
import { LinksService } from '../../services/links.service';
import { ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';

const mockLinksService = {
  getStats: jest.fn(),
  invalidateLink: jest.fn(),
  createLink: jest.fn(),
  getOriginalUrl: jest.fn(),
  isBrowserRequest: jest.fn().mockResolvedValue(false), 
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle redirection correctly', async () => {
    const responseMock = {
      redirect: jest.fn(),
    } as unknown as Response;
  
    const requestMock = {
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      query: {
        password: 'secure123', 
      },
    } as unknown as Request;
  
    mockLinksService.getOriginalUrl.mockResolvedValue('https://example.com');
  
    await controller.redirect('short123', requestMock, responseMock);
  
    expect(responseMock.redirect).toHaveBeenCalledWith(302, 'https://example.com');
  });

  it('should return a 403 response if the link is invalidated during redirection', async () => {
    const responseMock = {
      redirect: jest.fn(),
    } as unknown as Response;
  
    const requestMock = {
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    } as unknown as Request;
  
    mockLinksService.getOriginalUrl.mockRejectedValueOnce(
      new ForbiddenException('This link has been invalidated.')
    );

    await expect(controller.redirect('short123', requestMock, responseMock))
      .rejects.toThrow(ForbiddenException);

    expect(responseMock.redirect).not.toHaveBeenCalled();
  });
});
