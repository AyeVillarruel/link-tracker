import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../src/links/entities/link.entity';
import * as bcrypt from 'bcrypt';

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
    await repository.clear();
    await app.close();
  });

  let shortenedUrl: string;

  it('/POST links (create a shortened link)', async () => {
    const response = await request(app.getHttpServer())
      .post('/links')
      .send({
        originalUrl: 'https://example.com',
        password: 'secure123',
        expirationDate: '2025-02-28T00:00:00.000Z',
      })
      .expect(201);

    expect(response.body).toHaveProperty('shortenedUrl');
    expect(response.body).toHaveProperty('target', 'https://example.com');

    shortenedUrl = response.body.shortenedUrl;
  });

  it('/GET links/:shortenedUrl (redirect to the original URL)', async () => {
    const responsePost = await request(app.getHttpServer())
      .post('/links')
      .send({
        originalUrl: 'https://example.com',
      })
      .expect(201);

    const shortenedUrl = responsePost.body.shortenedUrl;

    const response = await request(app.getHttpServer())
      .get(`/links/${shortenedUrl}`)
      .expect(302);

    expect(response.header.location).toBe('https://example.com');
  });

  it('/GET links/:shortenedUrl/stats (get link statistics)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/links/${shortenedUrl}/stats`)
      .expect(200);

    expect(response.body).toHaveProperty('shortenedUrl', shortenedUrl);
    expect(response.body).toHaveProperty('originalUrl', 'https://example.com');
    expect(response.body).toHaveProperty('clicks');
    expect(response.body).toHaveProperty('isValid', true);
  });

  it('/PUT links/:shortenedUrl/invalidate (invalidate a link)', async () => {
    await request(app.getHttpServer())
      .put(`/links/${shortenedUrl}/invalidate`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/links/${shortenedUrl}`)
      .expect(403);

    expect(response.body).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      message: 'This link has been invalidated.',
    });
  });

  it('/GET links/:shortenedUrl with correct password', async () => {
    const secureLink = repository.create({
      originalUrl: 'https://secure.com',
      shortenedUrl: 'secure123',
      passwordHash: await bcrypt.hash('secure123', 10),
      isValid: true,
      createdAt: new Date(),
    });

    await repository.save(secureLink);

    const response = await request(app.getHttpServer())
      .get(`/links/${secureLink.shortenedUrl}?password=secure123`)
      .expect(302);

    expect(response.header.location).toBe('https://secure.com');
  });

  it('/GET links/:shortenedUrl with incorrect password', async () => {
    const secureLink = repository.create({
      originalUrl: 'https://secure.com',
      shortenedUrl: 'secure456',
      passwordHash: await bcrypt.hash('secure123', 10),
      isValid: true,
      createdAt: new Date(),
    });

    await repository.save(secureLink);

    const response = await request(app.getHttpServer())
      .get(`/links/${secureLink.shortenedUrl}?password=wrongpass`)
      .expect(403);

    expect(response.body).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Incorrect password.',
    });
  });

  it('/GET links/:shortenedUrl expired', async () => {
    const expiredLink = repository.create({
      originalUrl: 'https://expired.com',
      shortenedUrl: 'expired123',
      clicks: 0,
      isValid: true,
      createdAt: new Date(),
      expirationDate: new Date(Date.now() - 1000), // Expired
    });

    await repository.save(expiredLink);

    const response = await request(app.getHttpServer())
      .get(`/links/${expiredLink.shortenedUrl}`)
      .expect(403);

    expect(response.body).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      message: 'This link has expired.',
    });
  });

  it('/GET links/:shortenedUrl non-existent', async () => {
    const response = await request(app.getHttpServer())
      .get('/links/not-exist')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'The link does not exist.',
    });
  });
});
