import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TratamientoDental } from './domain/entities/tratamiento.entity';
import { TratamientosController } from './adapters/driving/tratamientos.controller';
import { Paciente } from '../pacientes/domain/entities/paciente.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
    imports: [TypeOrmModule.forFeature([TratamientoDental, Paciente]), AuthModule, NotificacionesModule],
    controllers: [TratamientosController],
})
export class TratamientosModule { }
