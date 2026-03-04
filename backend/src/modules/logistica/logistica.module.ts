import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Insumo } from './domain/entities/insumo.entity';
import { Proveedor } from './domain/entities/proveedor.entity';
import { InsumoCita } from './domain/entities/insumo-cita.entity';
import { LogisticaController } from './adapters/driving/logistica.controller';
import { ProveedoresController } from './adapters/driving/proveedores.controller';
import { LogisticaService } from './use-cases/logistica.service';
import { AlertasService } from './use-cases/alertas.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Insumo, Proveedor, InsumoCita]), AuthModule],
    controllers: [LogisticaController, ProveedoresController],
    providers: [LogisticaService, AlertasService],
    exports: [LogisticaService],
})
export class LogisticaModule { }
