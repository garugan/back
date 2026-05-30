import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  constructor(private readonly configService: ConfigService) {}

  async verify(token: string | undefined, expectedAction: string) {
    const secret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    const minScore = Number(this.configService.get<string>('RECAPTCHA_MIN_SCORE') ?? 0.5);

    if (!secret) {
      throw new InternalServerErrorException('RECAPTCHA_SECRET_KEY is not configured');
    }

    if (!token) {
      throw new UnauthorizedException('Missing reCAPTCHA token');
    }

    const params = new URLSearchParams({
      secret,
      response: token,
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = (await response.json()) as RecaptchaVerifyResponse;

    if (!response.ok || !data.success) {
      throw new UnauthorizedException('reCAPTCHA verification failed');
    }

    if (data.action !== expectedAction) {
      throw new UnauthorizedException('Unexpected reCAPTCHA action');
    }

    if (typeof data.score === 'number' && data.score < minScore) {
      throw new UnauthorizedException('Low reCAPTCHA score');
    }
  }
}
