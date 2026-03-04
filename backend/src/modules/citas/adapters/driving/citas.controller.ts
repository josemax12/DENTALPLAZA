import {
    Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CitasService, CrearCitaDto } from '../../use-cases/citas.service';
import { EstadoCita } from '../../domain/entities/cita.entity';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class CambiarEstadoDto {
    @IsEnum(EstadoCita) estado: EstadoCita;
    @IsOptional() @IsString() notas?: string;
}

@ApiTags('Citas')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('citas')
export class CitasController {
    constructor(private readonly service: CitasService) { }

    @Get()
    @ApiOperation({ summary: 'Listar citas (filtrar por fecha)' })
    @ApiQuery({ name: 'fecha', required: false, description: 'YYYY-MM-DD' })
    listar(@Query('fecha') fecha?: string) {
        return this.service.buscarTodas(fecha);
    }

    @Get('resumen-hoy')
    @ApiOperation({ summary: 'Resumen de citas del día de hoy' })
    resumenHoy() {
        return this.service.obtenerResumenHoy();
    }

    @Get('doctor/:doctorId')
    @ApiOperation({ summary: 'Citas de un doctor (filtrar por fecha)' })
    @ApiQuery({ name: 'fecha', required: false })
    porDoctor(@Param('doctorId') doctorId: string, @Query('fecha') fecha?: string) {
        return this.service.buscarPorDoctor(doctorId, fecha);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener cita con insumos utilizados' })
    obtenerUna(@Param('id') id: string) {
        return this.service.buscarPorId(id);
    }

    @Post()
    @ApiOperation({ summary: 'Crear nueva cita' })
    crear(@Body() dto: CrearCitaDto) {
        return this.service.crear(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar cita' })
    actualizar(@Param('id') id: string, @Body() dto: Partial<CrearCitaDto>) {
        return this.service.actualizar(id, dto);
    }

    @Patch(':id/estado')
    @ApiOperation({ summary: 'Cambiar estado de la cita' })
    cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
        return this.service.cambiarEstado(id, dto.estado, dto.notas);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar cita' })
    eliminar(@Param('id') id: string) {
        return this.service.eliminar(id);
    }
}
