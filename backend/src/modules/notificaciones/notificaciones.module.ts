import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from './domain/entities/notificacion.entity';
import { NotificacionesService } from './use-cases/notificaciones.service';
import { NotificacionesController } from './adapters/driving/notificaciones.controller';
import { NotificacionesGateway } from './notificaciones.gateway';

@Module({
    imports: [TypeOrmModule.forFeature([Notificacion])],
    controllers: [NotificacionesController],
    providers: [NotificacionesService, NotificacionesGateway],
    exports: [NotificacionesService, NotificacionesGateway],
})
export class NotificacionesModule { }
