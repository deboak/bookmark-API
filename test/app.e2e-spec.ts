import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import * as dotenv from 'dotenv';
import { EditUserDto } from 'src/user/dto/edit-user.dto';
import { inspect } from 'util';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

// Load test environment variables
dotenv.config({ path: '.env.test' });

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const PORT = process.env.test_PORT || 3333;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(PORT);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl(`http://localhost:${PORT}`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'debo24@gmail.com',
      password: 'secret',
    };
    describe('Signup', () => {
      it('should throw an error, if there is no password provided', async () => {
        await pactum.spec()
          .post('/auth/signup')
          .withBody({email: dto.email})
          .expectStatus(400);
      });
      it('should throw an error, if there is no email provided', async () => {
        await pactum.spec()
          .post('/auth/signup')
          .withBody({password: dto.password})
          .expectStatus(400);
      });
      it('should throw an error, if there is no body provided', async () => {
        await pactum.spec()
          .post('/auth/signup')
          .expectStatus(400);
      });
      it('should signup', async () => {
        await pactum.spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('should throw an error, if there is no password provided', async () => {
        await pactum.spec()
          .post('/auth/signin')
          .withBody({email: dto.email})
          .expectStatus(400);
      });
      it('should throw an error, if there is no email provided', async () => {
        await pactum.spec()
          .post('/auth/signin')
          .withBody({password: dto.password})
          .expectStatus(400);
      });
      it('should throw an error, if there is no body provided', async () => {
        await pactum.spec()
          .post('/auth/signin')
          .expectStatus(400);
      });
      it('should signin', async () => {
        await pactum.spec()
        .post('/auth/signin')
        .withBody(dto)
        .expectStatus(200)
        .stores('userToken', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should throw an error, if no token is provided', async () => {
        await pactum.spec()
        .get('/users/me')
        .expectStatus(401);
      });
      it('should get current user', async () => {
        await pactum.spec()
        .get('/users/me')
        .withHeaders({
          Authorization: 'Bearer $S{userToken}',
        })
        .expectStatus(200);
      });
    });
    describe('Edit User', () => {
      it('should edit user', async () => {
        const dto: EditUserDto = {
          firstName: 'Olamiposi',
          email: 'olamiposi21@gmail.com',
        };
        await pactum.spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);

      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get empty bookmarks', async () => {
        await pactum.spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(200)
      });
    });
    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
          title: 'Debo\'s First Bookmark',
          description: 'This is the first bookmark',
          link: 'https://www.first-bookmark.com',
        }
      it('should create bookmark', async () => {
        await pactum.spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get bookmarks', () => {
      it('should get bookmarks', async () => {
        await pactum.spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });
    describe('Get bookmark by id', () => {
      it('should get bookmarks by id', async () => {
        await pactum.spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
      });
    });
    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'Debo\'s Updated Bookmark',
        description: 'This is the updated bookmark',
      }
      it('should edit bookmark', async () => {
        await pactum.spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });
    describe('Delete bookmark by id', () => {
      it('should delete bookmark', async () => {
        await pactum.spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(204);
      });
    });
  });
});
