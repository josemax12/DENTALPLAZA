import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receta } from './domain/entities/receta.entity';
import { Paciente } from '../pacientes/domain/entities/paciente.entity';
import { Doctor } from '../usuarios/domain/entities/doctor.entity';
import { RecetasService } from './use-cases/recetas.service';
import { RecetasController } from './adapters/driving/recetas.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Receta, Paciente, Doctor]),
        AuthModule,
        NotificacionesModule,
    ],
    controllers: [RecetasController],
    providers: [RecetasService],
    exports: [RecetasService],
})
export class RecetasModule { }
