import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './domain/entities/cita.entity';
import { CitasController } from './adapters/driving/citas.controller';
import { CitasService } from './use-cases/citas.service';
import { AuthModule } from '../auth/auth.module';
import { Paciente } from '../pacientes/domain/entities/paciente.entity';
import { Doctor } from '../usuarios/domain/entities/doctor.entity';
import { TratamientoDental } from '../tratamientos/domain/entities/tratamiento.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cita, Paciente, Doctor, TratamientoDental]),
        AuthModule,
        NotificacionesModule
    ],
    controllers: [CitasController],
    providers: [CitasService],
    exports: [CitasService],
})
export class CitasModule { }
