import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './domain/entities/usuario.entity';
import { Doctor } from './domain/entities/doctor.entity';
import { UsuariosController } from './adapters/driving/usuarios.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Usuario, Doctor]), AuthModule],
    controllers: [UsuariosController],
})
export class UsuariosModule { }
