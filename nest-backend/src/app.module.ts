import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { DefaultController } from './controllers/default.controller';
import { PembayaranController } from './controllers/pembayaran.controller';
import { PembayaranService } from './services/pembayaran.service';
import { EmployeeEntity } from './entities/employee.entity';
import { PayrollEntity } from './entities/payroll.entity';
import { AccountEntity } from './entities/account.entity';
import { JournalEntryEntity } from './entities/journal-entry.entity';
import { UserEntity } from './entities/user.entity';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      process.env.DB_TYPE === 'postgres'
        ? {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'gaji_akuntansi',
            autoLoadEntities: true,
            synchronize: true,
          }
        : {
            type: 'sqljs',
            location: process.env.DB_FILE || 'gaji-akuntansi.sqlite',
            autoSave: true,
            autoLoadEntities: true,
            synchronize: true,
          },
    ),
    TypeOrmModule.forFeature([
      EmployeeEntity,
      PayrollEntity,
      AccountEntity,
      JournalEntryEntity,
      UserEntity,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-me',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [DefaultController, PembayaranController, AuthController],
  providers: [PembayaranService, AuthService, JwtStrategy, RolesGuard],
})
export class AppModule {}
