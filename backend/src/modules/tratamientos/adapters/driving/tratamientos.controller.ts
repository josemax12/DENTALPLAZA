import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TratamientoDental, EstadoTratamiento } from '../../domain/entities/tratamiento.entity';
import { Paciente } from '../../../pacientes/domain/entities/paciente.entity';
import { IsString, IsOptional, IsEnum, IsUUID, IsArray, IsNumber, IsDateString } from 'class-validator';
import { NotificacionesService } from '../../../notificaciones/use-cases/notificaciones.service';
import { NotificacionesGateway } from '../../../notificaciones/notificaciones.gateway';

class CrearTratamientoDto {
    @IsUUID() pacienteId: string;
    @IsString() nombre: string;
    @IsOptional() @IsEnum(EstadoTratamiento) estado?: EstadoTratamiento;
    @IsOptional() @IsDateString() fechaInicio?: string;
    @IsOptional() @IsDateString() fechaFin?: string;
    @IsOptional() @IsString() notas?: string;
    @IsOptional() @IsArray() @IsNumber({}, { each: true }) numerosPiezas?: number[];
    @IsOptional() @IsNumber() costoEstimado?: number;
}

@ApiTags('Tratamientos Dentales')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tratamientos')
export class TratamientosController {
    constructor(
        @InjectRepository(TratamientoDental) private repo: Repository<TratamientoDental>,
        @InjectRepository(Paciente) private pacienteRepo: Repository<Paciente>,
        private readonly notifService: NotificacionesService,
        private readonly notifGateway: NotificacionesGateway,
    ) { }

    @Get('paciente/:pacienteId')
    @ApiOperation({ summary: 'Listar tratamientos de un paciente' })
    listarPorPaciente(@Param('pacienteId') pacienteId: string) {
        return this.repo.find({ where: { paciente: { id: pacienteId } }, order: { fechaInicio: 'DESC' } });
    }

    @Post()
    @ApiOperation({ summary: 'Registrar tratamiento dental' })
    async crear(@Body() dto: CrearTratamientoDto) {
        const paciente = await this.pacienteRepo.findOne({ where: { id: dto.pacienteId } });
        if (!paciente) throw new NotFoundException('Paciente no encontrado');

        const tratamiento = this.repo.create({
            ...dto,
            paciente,
            numerosPiezas: dto.numerosPiezas || [],
            fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
            fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
        } as any);
        const saved = await this.repo.save(tratamiento) as unknown as TratamientoDental;

        // Notificar al paciente
        try {
            const notif = await this.notifService.crear({
                tipo: 'nuevo_tratamiento',
                titulo: '🩸 Nuevo Tratamiento Asignado',
                mensaje: `Se te ha asignado el tratamiento: "${dto.nombre}". Consulta tu historial para más detalles.`,
                destinatarioRol: 'paciente',
                destinatarioId: dto.pacienteId,
                pacienteNombre: paciente.nombreCompleto,
                referenciaId: saved.id,
            });
            this.notifGateway.emitToPaciente(dto.pacienteId, 'notif_paciente', notif);
        } catch (err) {
            console.error('Error al notificar paciente por tratamiento:', err);
        }

        return saved;
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar estado/datos del tratamiento' })
    async actualizar(@Param('id') id: string, @Body() dto: Partial<CrearTratamientoDto>) {
        await this.repo.update(id, {
            ...dto,
            ...(dto.numerosPiezas && { numerosPiezas: dto.numerosPiezas }),
            ...(dto.fechaInicio && { fechaInicio: new Date(dto.fechaInicio) }),
            ...(dto.fechaFin && { fechaFin: new Date(dto.fechaFin) }),
        } as any);
        return this.repo.findOne({ where: { id } });
    }
}
