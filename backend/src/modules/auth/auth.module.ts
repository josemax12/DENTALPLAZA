import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './adapters/driving/auth.controller';
import { AuthService } from './use-cases/auth.service';
import { JwtStrategy } from './adapters/driven/jwt.strategy';
import { LocalStrategy } from './adapters/driven/local.strategy';
import { Usuario } from '../usuarios/domain/entities/usuario.entity';
import { Doctor } from '../usuarios/domain/entities/doctor.entity';
import { Paciente } from '../pacientes/domain/entities/paciente.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Usuario, Doctor, Paciente]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET'),
                signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '8h') },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, LocalStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
