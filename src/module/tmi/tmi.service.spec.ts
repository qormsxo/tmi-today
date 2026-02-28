import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TmiService } from './tmi.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

const mockUser = { id: 'user-1', email: 'test@test.com' };

// OpenAI 모듈을 모의 처리합니다.
const mockCreate = jest.fn();
jest.mock('openai', () => {
  const mockOpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));

  return {
    __esModule: true,
    default: mockOpenAI,
  };
});

describe('TmiService', () => {
  let service: TmiService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tmi: {
      create: jest.fn(),
    },
    categoryLike: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockCreate.mockClear();
    (OpenAI as unknown as jest.Mock).mockClear();
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.category.findUnique.mockResolvedValue(null);
    mockPrisma.tmi.create.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmiService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test_api_key') },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TmiService>(TmiService);
  });

  it('TmiService는 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('getCategories', () => {
    it('카테고리 목록을 likeCount와 함께 반환해야 한다', async () => {
      const categories = [
        { id: '1', code: 'food', name: '음식', _count: { likes: 5 }, likes: [] },
        { id: '2', code: 'animal', name: '동물', _count: { likes: 3 }, likes: [] },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.getCategories();

      expect(result).toEqual([
        { id: '1', code: 'food', name: '음식', likeCount: 5 },
        { id: '2', code: 'animal', name: '동물', likeCount: 3 },
      ]);
    });

    it('userId가 주어지면 isLiked를 포함해야 한다', async () => {
      const categories = [
        { id: '1', code: 'food', name: '음식', _count: { likes: 5 }, likes: [{ id: 'like-1' }] },
        { id: '2', code: 'animal', name: '동물', _count: { likes: 3 }, likes: [] },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.getCategories('user-1');

      expect(result).toEqual([
        { id: '1', code: 'food', name: '음식', likeCount: 5, isLiked: true },
        { id: '2', code: 'animal', name: '동물', likeCount: 3, isLiked: false },
      ]);
    });
  });

  describe('getTodaysTmi', () => {
    it('카테고리 없이 올바른 인자와 함께 openai.chat.completions.create를 호출해야 한다', async () => {
      const mockCompletion = {
        choices: [{ message: { content: '테스트 TMI' } }],
      };
      mockCreate.mockResolvedValue(mockCompletion);

      await service.getTodaysTmi(mockUser as never);

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('TMI 사실만 출력해'),
          },
          {
            role: 'user',
            content: '오늘의 TMI를 알려줘',
          },
        ],
        model: 'gpt-4',
      });
    });

    it('카테고리 있을 때 해당 카테고리 프롬프트를 사용해야 한다', async () => {
      const mockCompletion = {
        choices: [{ message: { content: '사과 TMI' } }],
      };
      mockCreate.mockResolvedValue(mockCompletion);
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: '음식',
      });

      await service.getTodaysTmi(mockUser as never, 'food');

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('음식 관련 TMI'),
          },
          {
            role: 'user',
            content: '오늘의 음식 TMI를 알려줘',
          },
        ],
        model: 'gpt-4',
      });
    });

    it('OpenAI 응답에서 content를 반환해야 한다', async () => {
      const mockCompletion = {
        choices: [{ message: { content: '테스트 TMI' } }],
      };
      mockCreate.mockResolvedValue(mockCompletion);

      const result = await service.getTodaysTmi(mockUser as never);

      expect(result).toBe('테스트 TMI');
    });

    it('content가 null일 경우 기본 메시지를 반환해야 한다', async () => {
      const mockCompletion = {
        choices: [{ message: { content: null } }],
      };
      mockCreate.mockResolvedValue(mockCompletion);

      const result = await service.getTodaysTmi(mockUser as never);

      expect(result).toBe('오늘의 TMI를 가져오는 데 실패했습니다.');
    });

    it('잘못된 카테고리 코드일 때 BadRequestException을 던져야 한다', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.getTodaysTmi(mockUser as never, 'invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createCategory', () => {
    it('유효한 DTO로 카테고리를 생성해야 한다', async () => {
      const dto = { code: 'sports', name: '스포츠' };
      const created = { id: 'cat-1', code: 'sports', name: '스포츠' };
      mockPrisma.category.create.mockResolvedValue(created);

      const result = await service.createCategory(dto);

      expect(result).toEqual(created);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: { code: 'sports', name: '스포츠' },
        select: { id: true, code: true, name: true },
      });
    });

    it('잘못된 code 형식일 때 BadRequestException을 던져야 한다', async () => {
      await expect(service.createCategory({ code: 'Invalid', name: '테스트' })).rejects.toThrow(BadRequestException);
      await expect(service.createCategory({ code: 'food-code!', name: '테스트' })).rejects.toThrow(BadRequestException);
    });

    it('code 중복 시 ConflictException을 던져야 한다', async () => {
      mockPrisma.category.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.createCategory({ code: 'food', name: '음식2' })).rejects.toThrow(ConflictException);
    });
  });

  describe('updateCategory', () => {
    it('존재하는 카테고리를 수정해야 한다', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.category.update.mockResolvedValue({
        id: 'cat-1',
        code: 'sports',
        name: '스포츠·운동',
      });

      const result = await service.updateCategory('cat-1', { name: '스포츠·운동' });

      expect(result.name).toBe('스포츠·운동');
    });

    it('존재하지 않는 id일 때 NotFoundException을 던져야 한다', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.updateCategory('invalid-id', { name: '테스트' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCategory', () => {
    it('존재하는 카테고리를 삭제해야 한다', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.category.delete.mockResolvedValue({});

      const result = await service.deleteCategory('cat-1');

      expect(result).toEqual({ deleted: true });
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });

    it('존재하지 않는 id일 때 NotFoundException을 던져야 한다', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.deleteCategory('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleCategoryLike', () => {
    it('좋아요가 없으면 생성하고 liked: true를 반환해야 한다', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.categoryLike.findUnique.mockResolvedValue(null);
      mockPrisma.categoryLike.create.mockResolvedValue({ id: 'like-1' });
      mockPrisma.categoryLike.count.mockResolvedValue(1);

      const result = await service.toggleCategoryLike('user-1', 'cat-1');

      expect(result).toEqual({ liked: true, likeCount: 1 });
      expect(mockPrisma.categoryLike.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', categoryId: 'cat-1' },
      });
    });

    it('좋아요가 있으면 삭제하고 liked: false를 반환해야 한다', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.categoryLike.findUnique.mockResolvedValue({ id: 'like-1' });
      mockPrisma.categoryLike.delete.mockResolvedValue({});
      mockPrisma.categoryLike.count.mockResolvedValue(0);

      const result = await service.toggleCategoryLike('user-1', 'cat-1');

      expect(result).toEqual({ liked: false, likeCount: 0 });
      expect(mockPrisma.categoryLike.delete).toHaveBeenCalledWith({
        where: { id: 'like-1' },
      });
    });

    it('존재하지 않는 카테고리일 때 NotFoundException을 던져야 한다', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.toggleCategoryLike('user-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyLikedCategories', () => {
    it('내가 좋아요한 카테고리 목록을 반환해야 한다', async () => {
      mockPrisma.categoryLike.findMany.mockResolvedValue([
        { categoryId: 'cat-1', category: { id: 'cat-1', code: 'food', name: '음식' } },
        { categoryId: 'cat-2', category: { id: 'cat-2', code: 'animal', name: '동물' } },
      ]);
      mockPrisma.categoryLike.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5);

      const result = await service.getMyLikedCategories('user-1');

      expect(result).toEqual([
        { id: 'cat-1', code: 'food', name: '음식', likeCount: 10 },
        { id: 'cat-2', code: 'animal', name: '동물', likeCount: 5 },
      ]);
    });

    it('좋아요한 카테고리가 없으면 빈 배열을 반환해야 한다', async () => {
      mockPrisma.categoryLike.findMany.mockResolvedValue([]);

      const result = await service.getMyLikedCategories('user-1');

      expect(result).toEqual([]);
    });
  });
});