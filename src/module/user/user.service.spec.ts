import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeAll(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(UserService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  it('signupLocal: 새 이메일이면 사용자 생성하고 id/email 반환', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');

    const result = await service.signupLocal({ email: 'a@b.com', password: 'pass', nickname: 'nick' });

    expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'a@b.com',
        passwordHash: 'hashed',
        nickname: 'nick',
        emailVerified: false,
      },
    });
    expect(result).toEqual({ id: 'u1', email: 'a@b.com' });
  });

  it('signupLocal: 중복 이메일이면 ConflictException', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'exists' });

    await expect(
      service.signupLocal({ email: 'dup@ex.com', password: 'pass' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});


