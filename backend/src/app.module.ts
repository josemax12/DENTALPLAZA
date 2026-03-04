import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { CitasModule } from './modules/citas/citas.module';
import { LogisticaModule } from './modules/logistica/logistica.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { TratamientosModule } from './modules/tratamientos/tratamientos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { RecetasModule } from './modules/recetas/recetas.module';
import { PagosModule } from './modules/pagos/pagos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqlite',
        database: 'database.sqlite',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsuariosModule,
    PacientesModule,
    TratamientosModule,
    CitasModule,
    LogisticaModule,
    NotificacionesModule,
    RecetasModule,
    PagosModule,
  ],
})
export class AppModule { }
