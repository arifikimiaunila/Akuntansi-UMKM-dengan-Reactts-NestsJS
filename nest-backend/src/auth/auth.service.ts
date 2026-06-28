import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { UserEntity, UserRole } from '../entities/user.entity';

interface RegisterDto {
  name?: string;
  username?: string;
  password?: string;
  role?: UserRole;
}

interface LoginDto {
  username?: string;
  password?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultUsers();
  }

  async register(dto: RegisterDto) {
    const name = (dto.name || '').trim();
    const username = (dto.username || '').trim().toLowerCase();
    const password = dto.password || '';
    const role: UserRole = dto.role || 'hr';

    if (!name || !username || !password) {
      return { error: 'name, username, dan password wajib diisi' };
    }

    const exists = await this.userRepository.findOne({ where: { username } });
    if (exists) {
      return { error: 'username sudah dipakai' };
    }

    const passwordHash = await hash(password, 10);
    const user = this.userRepository.create({
      name,
      username,
      passwordHash,
      role,
      active: true,
    });

    const saved = await this.userRepository.save(user);
    return {
      status: 'success',
      data: {
        id: saved.id,
        name: saved.name,
        username: saved.username,
        role: saved.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const username = (dto.username || '').trim().toLowerCase();
    const password = dto.password || '';

    if (!username || !password) {
      return { error: 'username dan password wajib diisi' };
    }

    const user = await this.userRepository.findOne({ where: { username, active: true } });
    if (!user) {
      return { error: 'username atau password salah' };
    }

    const validPassword = await compare(password, user.passwordHash);
    if (!validPassword) {
      return { error: 'username atau password salah' };
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    return {
      status: 'success',
      data: {
        accessToken: token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      },
    };
  }

  private async seedDefaultUsers(): Promise<void> {
    const defaults: Array<{ name: string; username: string; password: string; role: UserRole }> = [
      { name: 'Owner Utama', username: 'owner', password: 'Owner#123', role: 'owner' },
      { name: 'Admin Sistem', username: 'admin', password: 'Admin#123', role: 'admin' },
      { name: 'Finance Lead', username: 'finance', password: 'Finance#123', role: 'finance' },
      { name: 'HR Staff', username: 'hr', password: 'Hr#12345', role: 'hr' },
    ];

    for (const user of defaults) {
      const exists = await this.userRepository.findOne({ where: { username: user.username } });
      if (!exists) {
        const passwordHash = await hash(user.password, 10);
        await this.userRepository.save(
          this.userRepository.create({
            name: user.name,
            username: user.username,
            passwordHash,
            role: user.role,
            active: true,
          }),
        );
      }
    }
  }
}
