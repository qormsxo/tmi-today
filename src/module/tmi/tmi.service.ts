import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';
import { UserModel } from '../../generated/prisma/models/User';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class TmiService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  private readonly CODE_REGEX = /^[a-z0-9_]+$/;

  async getCategories(userId?: string) {
    const categories = await this.prisma.category.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: { select: { likes: true } },
        ...(userId && {
          likes: {
            where: { userId },
            select: { id: true },
          },
        }),
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      likeCount: cat._count.likes,
      ...(userId && { isLiked: cat.likes.length > 0 }),
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    if (!this.CODE_REGEX.test(dto.code) || dto.code.length > 50) {
      throw new BadRequestException('code는 영문 소문자, 숫자, 언더스코어만 1~50자로 입력해주세요.');
    }
    if (!dto.name?.trim() || dto.name.length > 100) {
      throw new BadRequestException('name은 1~100자로 입력해주세요.');
    }
    try {
      return await this.prisma.category.create({
        data: { code: dto.code.trim(), name: dto.name.trim() },
        select: { id: true, code: true, name: true },
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`카테고리 코드 '${dto.code}'가 이미 존재합니다.`);
      }
      throw e;
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`카테고리를 찾을 수 없습니다: ${id}`);
    }
    if (dto.code !== undefined) {
      if (!this.CODE_REGEX.test(dto.code) || dto.code.length > 50) {
        throw new BadRequestException('code는 영문 소문자, 숫자, 언더스코어만 1~50자로 입력해주세요.');
      }
    }
    if (dto.name !== undefined && (!dto.name.trim() || dto.name.length > 100)) {
      throw new BadRequestException('name은 1~100자로 입력해주세요.');
    }
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.code !== undefined && { code: dto.code.trim() }),
          ...(dto.name !== undefined && { name: dto.name.trim() }),
        },
        select: { id: true, code: true, name: true },
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`카테고리 코드 '${dto.code}'가 이미 존재합니다.`);
      }
      throw e;
    }
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`카테고리를 찾을 수 없습니다: ${id}`);
    }
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }

  async toggleCategoryLike(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`카테고리를 찾을 수 없습니다: ${categoryId}`);
    }

    const existingLike = await this.prisma.categoryLike.findUnique({
      where: { userId_categoryId: { userId, categoryId } },
    });

    if (existingLike) {
      await this.prisma.categoryLike.delete({
        where: { id: existingLike.id },
      });
    } else {
      await this.prisma.categoryLike.create({
        data: { userId, categoryId },
      });
    }

    const likeCount = await this.prisma.categoryLike.count({
      where: { categoryId },
    });

    return {
      liked: !existingLike,
      likeCount,
    };
  }

  async getMyLikedCategories(userId: string) {
    const likes = await this.prisma.categoryLike.findMany({
      where: { userId },
      include: {
        category: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const categoriesWithCount = await Promise.all(
      likes.map(async (like) => {
        const likeCount = await this.prisma.categoryLike.count({
          where: { categoryId: like.categoryId },
        });
        return {
          ...like.category,
          likeCount,
        };
      }),
    );

    return categoriesWithCount;
  }

  async getTodaysTmi(user: UserModel, categoryCode?: string): Promise<string> {
    let category: { id: string; name: string } | null = null;
    if (categoryCode) {
      category = await this.prisma.category.findUnique({
        where: { code: categoryCode },
        select: { id: true, name: true },
      });
      if (!category) {
        throw new BadRequestException(`Invalid category: ${categoryCode}`);
      }
    }

    const systemContent = category
      ? `너는 새롭고 흥미로운 TMI(Too Much Information)를 알려주는 한글 어시스턴트야. 이번에는 반드시 ${category.name} 관련 TMI만 알려줘.

출력 규칙 (반드시 지켜):
- TMI 사실만 출력해. "당신이 알고 있을지 모르겠지만", "~인데요", "어떤가요?" 같은 인사말·질문형 마무리는 절대 쓰지 마.
- 핵심 사실만 1~2문장으로 간결하게.`
      : `너는 새롭고 흥미로운 TMI(Too Much Information)를 알려주는 한글 어시스턴트야.

출력 규칙 (반드시 지켜):
- TMI 사실만 출력해. "당신이 알고 있을지 모르겠지만", "~인데요", "어떤가요?" 같은 인사말·질문형 마무리는 절대 쓰지 마.
- 핵심 사실만 1~2문장으로 간결하게.`;

    const userContent = category
      ? `오늘의 ${category.name} TMI를 알려줘`
      : '오늘의 TMI를 알려줘';

    const completion = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      model: 'gpt-4',
    });

    const tmiContent = completion.choices[0].message.content || '오늘의 TMI를 가져오는 데 실패했습니다.';

    await this.prisma.tmi.create({
      data: {
        content: tmiContent,
        userId: user.id,
        categoryId: category?.id,
      },
    });

    return tmiContent;
  }
}
