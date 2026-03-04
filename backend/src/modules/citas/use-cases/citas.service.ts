import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cita, EstadoCita } from '../domain/entities/cita.entity';
import { Paciente } from '../../pacientes/domain/entities/paciente.entity';
import { NotificacionesService } from '../../notificaciones/use-cases/notificaciones.service';
import { NotificacionesGateway } from '../../notificaciones/notificaciones.gateway';
import { IsString, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';

export class CrearCitaDto {
    @IsUUID() pacienteId: string;
    @IsUUID() doctorId: string;
    @IsOptional() @IsUUID() tratamientoId?: string;
    @IsDateString() fechaHora: string;
    @IsOptional() @IsNumber() duracionMinutos?: number;
    @IsOptional() @IsString() motivo?: string;
    @IsOptional() @IsNumber() costo?: number;
}

@Injectable()
export class CitasService {
    constructor(
        @InjectRepository(Cita) private repo: Repository<Cita>,
        @InjectRepository(Paciente) private readonly pacienteRepo: Repository<Paciente>,
        private readonly notifService: NotificacionesService,
        private readonly notifGateway: NotificacionesGateway,
    ) { }

    async crear(dto: CrearCitaDto): Promise<Cita> {
        const cita = this.repo.create({
            paciente: { id: dto.pacienteId } as any,
            doctor: { id: dto.doctorId } as any,
            tratamiento: dto.tratamientoId ? { id: dto.tratamientoId } as any : null,
            fechaHora: new Date(dto.fechaHora),
            duracionMinutos: dto.duracionMinutos ?? 45,
            motivo: dto.motivo,
            costo: dto.costo,
        });

        const savedCita = await this.repo.save(cita);

        // Notificación para Admin/Doctor
        try {
            const paciente = await this.pacienteRepo.findOne({ where: { id: dto.pacienteId } });
            const pacienteNombre = paciente?.nombreCompleto || 'Un paciente';

            const notification = await this.notifService.crear({
                tipo: 'nueva_cita',
                titulo: 'Nueva Cita Solicitada',
                mensaje: `${pacienteNombre} ha solicitado una cita para el ${new Date(dto.fechaHora).toLocaleString()}`,
                destinatarioRol: 'admin',
                pacienteNombre,
                referenciaId: savedCita.id,
            });

            // Emitir por WebSocket
            this.notifGateway.emitToAll('nueva_notificacion', notification);
        } catch (error) {
            console.error('Error al enviar notificación:', error);
        }

        return savedCita;
    }

    async buscarPorDoctor(doctorId: string, fecha?: string): Promise<Cita[]> {
        const where: any = { doctor: { id: doctorId } };
        if (fecha) {
            const inicio = new Date(fecha);
            inicio.setHours(0, 0, 0, 0);
            const fin = new Date(fecha);
            fin.setHours(23, 59, 59, 999);
            where.fechaHora = Between(inicio, fin);
        }
        return this.repo.find({ where, order: { fechaHora: 'ASC' } });
    }

    async buscarTodas(fecha?: string): Promise<Cita[]> {
        if (fecha) {
            const inicio = new Date(fecha);
            inicio.setHours(0, 0, 0, 0);
            const fin = new Date(fecha);
            fin.setHours(23, 59, 59, 999);
            return this.repo.find({ where: { fechaHora: Between(inicio, fin) }, order: { fechaHora: 'ASC' } });
        }
        return this.repo.find({ order: { fechaHora: 'DESC' }, take: 100 });
    }

    async buscarPorId(id: string): Promise<Cita> {
        const cita = await this.repo.findOne({
            where: { id },
            relations: ['insumosUtilizados', 'insumosUtilizados.insumo', 'tratamiento'],
        });
        if (!cita) throw new NotFoundException(`Cita ${id} no encontrada`);
        return cita;
    }

    async cambiarEstado(id: string, estado: EstadoCita, notas?: string): Promise<Cita> {
        const cita = await this.buscarPorId(id);
        cita.estado = estado;
        if (notas) cita.notasSesion = notas;
        const saved = await this.repo.save(cita);

        // Notificar al paciente si la cita fue confirmada o cancelada
        try {
            const pacienteId = (cita.paciente as any)?.id || (cita as any).pacienteId;
            if (pacienteId) {
                let titulo = '';
                let mensaje = '';
                const fecha = new Date(cita.fechaHora).toLocaleString('es-PE', {
                    day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                });

                if (estado === EstadoCita.CONFIRMADA) {
                    titulo = '✅ Cita Confirmada';
                    mensaje = `Tu cita del ${fecha} ha sido confirmada. ¡Te esperamos!`;
                } else if (estado === EstadoCita.CANCELADA) {
                    titulo = '❌ Cita Cancelada';
                    mensaje = `Tu cita del ${fecha} ha sido cancelada. Por favor, contáctanos para reagendar.`;
                } else if (estado === EstadoCita.COMPLETADA) {
                    titulo = '🎉 Cita Completada';
                    mensaje = `Tu cita del ${fecha} ha sido marcada como completada. ¡Gracias por visitarnos!`;
                }

                if (titulo) {
                    const notif = await this.notifService.crear({
                        tipo: `cita_${estado}`,
                        titulo,
                        mensaje,
                        destinatarioRol: 'paciente',
                        destinatarioId: pacienteId,
                        referenciaId: id,
                    });
                    this.notifGateway.emitToPaciente(pacienteId, 'notif_paciente', notif);
                }
            }
        } catch (err) {
            console.error('Error al notificar paciente:', err);
        }

        return saved;
    }

    async actualizar(id: string, dto: Partial<CrearCitaDto> & { pagado?: boolean; googleEventId?: string }): Promise<Cita> {
        await this.buscarPorId(id);
        await this.repo.update(id, {
            ...(dto.fechaHora && { fechaHora: new Date(dto.fechaHora) }),
            ...(dto.duracionMinutos && { duracionMinutos: dto.duracionMinutos }),
            ...(dto.motivo !== undefined && { motivo: dto.motivo }),
            ...(dto.costo !== undefined && { costo: dto.costo }),
            ...(dto.pagado !== undefined && { pagado: dto.pagado }),
            ...(dto.googleEventId !== undefined && { googleEventId: dto.googleEventId }),
        });
        return this.buscarPorId(id);
    }

    async eliminar(id: string): Promise<void> {
        await this.buscarPorId(id);
        await this.repo.delete(id);
    }

    async obtenerResumenHoy(): Promise<{ total: number; completadas: number; pendientes: number; canceladas: number }> {
        const hoy = new Date();
        const inicio = new Date(hoy); inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy); fin.setHours(23, 59, 59, 999);
        const citas = await this.repo.find({ where: { fechaHora: Between(inicio, fin) } });
        return {
            total: citas.length,
            completadas: citas.filter(c => c.estado === EstadoCita.COMPLETADA).length,
            pendientes: citas.filter(c => [EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA].includes(c.estado)).length,
            canceladas: citas.filter(c => c.estado === EstadoCita.CANCELADA).length,
        };
    }
}
