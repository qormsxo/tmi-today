import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class TmiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async getTodaysTmi(): Promise<string> {
    const completion = await this.openai.chat.completions.create({
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

    return completion.choices[0].message.content || '오늘의 TMI를 가져오는 데 실패했습니다.';
  }
}
