import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './domain/entities/paciente.entity';
import { PacientesController } from './adapters/driving/pacientes.controller';
import { PacientesService } from './use-cases/pacientes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Paciente]), AuthModule],
    controllers: [PacientesController],
    providers: [PacientesService],
    exports: [PacientesService],
})
export class PacientesModule { }
