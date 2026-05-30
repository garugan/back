import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RecaptchaService } from './recaptcha.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  async register(data: RegisterDto) {
    if (!data.email?.trim() || !data.password) {
      throw new BadRequestException('Email and password are required');
    }

    if (data.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    await this.recaptchaService.verify(data.recaptchaToken, 'register');

    const email = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: data.name?.trim() || null,
        passwordHash: await hash(data.password, 12),
      },
    });

    return this.createAuthResponse(user);
  }

  async login(data: LoginDto) {
    if (!data.email?.trim() || !data.password) {
      throw new BadRequestException('Email and password are required');
    }

    await this.recaptchaService.verify(data.recaptchaToken, 'login');

    const email = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await compare(data.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    return user;
  }

  private createAuthResponse(user: { id: string; email: string; name: string | null }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
