import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../links/entities/link.entity';

describe('LinksController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<Link>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repository = moduleFixture.get<Repository<Link>>(getRepositoryToken(Link));
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST links (crear un enlace acortado)', async () => {
    const response = await request(app.getHttpServer())
      .post('/links')
      .send({
        originalUrl: 'https://example.com',
        password: 'segura123',
        expirationDate: '2025-02-28T00:00:00.000Z',
      })
      .expect(201);

    expect(response.body).toHaveProperty('shortenedUrl');
  });

  it('/GET links/:id/stats (obtener estadísticas)', async () => {
    const newLink = repository.create({
      originalUrl: 'https://example.com',
      shortenedUrl: 'a1b2c3',
      clicks: 0,
      isValid: true,
      createdAt: new Date(),
      expirationDate: null,
    });

    await repository.save(newLink);

    const response = await request(app.getHttpServer())
      .get(`/links/${newLink.id}/stats`)
      .expect(200);

    expect(response.body).toEqual({
      shortenedUrl: newLink.shortenedUrl,
      originalUrl: newLink.originalUrl,
      clicks: 0,
      isValid: true,
      createdAt: expect.any(String),
      expirationDate: null,
    });
  });

  it('/PUT links/:id/invalidate (invalidar un enlace)', async () => {
    const newLink = repository.create({
      originalUrl: 'https://example.com',
      shortenedUrl: 'a1b2c3',
      clicks: 0,
      isValid: true,
      createdAt: new Date(),
      expirationDate: null,
    });

    await repository.save(newLink);

    const response = await request(app.getHttpServer())
      .put(`/links/${newLink.id}/invalidate`)
      .expect(200);

    expect(response.body).toEqual({ message: 'El enlace ha sido invalidado exitosamente.' });

    const updatedLink = await repository.findOne({ where: { id: newLink.id } });
    expect(updatedLink?.isValid).toBe(false);
  });
});
