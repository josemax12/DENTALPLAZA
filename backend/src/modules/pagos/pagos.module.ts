import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './domain/entities/pago.entity';
import { Paciente } from '../pacientes/domain/entities/paciente.entity';
import { PagosService } from './use-cases/pagos.service';
import { PagosController } from './adapters/driving/pagos.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Pago, Paciente]),
        AuthModule,
    ],
    controllers: [PagosController],
    providers: [PagosService],
    exports: [PagosService],
})
export class PagosModule { }
