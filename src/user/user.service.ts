import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateLocalUserDto } from 'src/module/user/dto/create-local-user.dto';
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async signupLocal(payload: CreateLocalUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        nickname: payload.nickname ?? null,
        emailVerified: false,
      },
    });
    return { id: user.id, email: user.email };
  }
}


