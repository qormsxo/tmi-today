import { BadRequestException } from '@nestjs/common';
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
    },
    tmi: {
      create: jest.fn(),
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
    it('카테고리 목록을 반환해야 한다', async () => {
      const categories = [
        { id: '1', code: 'food', name: '음식' },
        { id: '2', code: 'animal', name: '동물' },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.getCategories();

      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true },
      });
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
});