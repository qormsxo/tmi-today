import { Test, TestingModule } from '@nestjs/testing';
import { TmiService } from './tmi.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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

  beforeEach(async () => {
    // 각 테스트 전에 모의를 초기화합니다.
    mockCreate.mockClear();
    (OpenAI as unknown as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_api_key'),
          },
        },
      ],
    }).compile();

    service = module.get<TmiService>(TmiService);
  });

  it('TmiService는 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('getTodaysTmi', () => {
    it('올바른 인자와 함께 openai.chat.completions.create를 호출해야 한다', async () => {
      const mockCompletion = {
        choices: [{ message: { content: '테스트 TMI' } }],
      };
      mockCreate.mockResolvedValue(mockCompletion);

      await service.getTodaysTmi();

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'system',
            content: '너는 새롭고 흥미로운 TMI(Too Much Information)를 알려줘서 대화주제를 던져주는 유용한 한글 어시스턴트야.'
          },
          {
            role: 'user',
            content: '오늘의 TMI를 간결하게 알려줘'
          }
        ],
        model: 'gpt-4',
      });
    });

    it('OpenAI 응답에서 content를 반환해야 한다', async () => {
      const mockCompletion = {
        choices: [{ message: { content: '테스트 TMI' } }],
      };
      mockCreate.mockResolvedValue(mockCompletion);

      const result = await service.getTodaysTmi();

      expect(result).toBe('테스트 TMI');
    });

    it('content가 null일 경우 기본 메시지를 반환해야 한다', async () => {
      const mockCompletion = {
        choices: [{ message: { content: null } }],
      };
      mockCreate.mockResolvedValue(mockCompletion);

      const result = await service.getTodaysTmi();

      expect(result).toBe('오늘의 TMI를 가져오는 데 실패했습니다.');
    });
  });
});