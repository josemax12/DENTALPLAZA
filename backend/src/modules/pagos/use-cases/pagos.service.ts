import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Pago, EstadoPago, MetodoPago } from '../domain/entities/pago.entity';
import { Paciente } from '../../pacientes/domain/entities/paciente.entity';

export class CrearPagoDto {
    pacienteId: string;
    citaId?: string;
    concepto: string;
    montoTotal: number;
    montoPagado?: number;
    metodoPago?: MetodoPago;
    notas?: string;
    fechaPago?: string;
    numeroComprobante?: string;
}

export class AbonarDto {
    monto: number;
    metodoPago?: MetodoPago;
    notas?: string;
    numeroComprobante?: string;
}

@Injectable()
export class PagosService {
    constructor(
        @InjectRepository(Pago) private repo: Repository<Pago>,
        @InjectRepository(Paciente) private pacienteRepo: Repository<Paciente>,
    ) { }

    async crear(dto: CrearPagoDto): Promise<Pago> {
        const paciente = await this.pacienteRepo.findOne({ where: { id: dto.pacienteId } });
        if (!paciente) throw new NotFoundException('Paciente no encontrado');

        const montoPagado = dto.montoPagado ?? 0;
        const estado = this.calcularEstado(dto.montoTotal, montoPagado);

        const pago = this.repo.create({
            paciente,
            cita: dto.citaId ? { id: dto.citaId } as any : undefined,
            concepto: dto.concepto,
            montoTotal: dto.montoTotal,
            montoPagado,
            metodoPago: dto.metodoPago ?? MetodoPago.EFECTIVO,
            estado,
            notas: dto.notas,
            fechaPago: dto.fechaPago ? new Date(dto.fechaPago) : montoPagado > 0 ? new Date() : undefined,
            numeroComprobante: dto.numeroComprobante,
        } as any);

        return this.repo.save(pago as any) as Promise<Pago>;
    }

    async listarTodos(): Promise<Pago[]> {
        return this.repo.find({ order: { creadoEn: 'DESC' } });
    }

    async listarPorPaciente(pacienteId: string): Promise<Pago[]> {
        return this.repo.find({
            where: { paciente: { id: pacienteId } },
            order: { creadoEn: 'DESC' },
        });
    }

    async obtenerPorId(id: string): Promise<Pago> {
        const pago = await this.repo.findOne({ where: { id } });
        if (!pago) throw new NotFoundException(`Pago ${id} no encontrado`);
        return pago;
    }

    async abonar(id: string, dto: AbonarDto): Promise<Pago> {
        const pago = await this.obtenerPorId(id);
        const nuevoMonto = Number(pago.montoPagado) + Number(dto.monto);
        const estado = this.calcularEstado(Number(pago.montoTotal), nuevoMonto);

        await this.repo.update(id, {
            montoPagado: nuevoMonto,
            estado,
            metodoPago: dto.metodoPago ?? pago.metodoPago,
            fechaPago: new Date(),
            notas: dto.notas ? `${pago.notas ?? ''}\n${dto.notas}`.trim() : pago.notas,
            numeroComprobante: dto.numeroComprobante ?? pago.numeroComprobante,
        });

        return this.obtenerPorId(id);
    }

    async actualizar(id: string, dto: Partial<CrearPagoDto>): Promise<Pago> {
        const pago = await this.obtenerPorId(id);
        const montoTotal = dto.montoTotal ?? Number(pago.montoTotal);
        const montoPagado = dto.montoPagado ?? Number(pago.montoPagado);

        await this.repo.update(id, {
            ...(dto.concepto && { concepto: dto.concepto }),
            ...(dto.montoTotal !== undefined && { montoTotal: dto.montoTotal }),
            ...(dto.montoPagado !== undefined && { montoPagado: dto.montoPagado }),
            ...(dto.metodoPago && { metodoPago: dto.metodoPago }),
            ...(dto.notas !== undefined && { notas: dto.notas }),
            ...(dto.numeroComprobante !== undefined && { numeroComprobante: dto.numeroComprobante }),
            ...(dto.fechaPago && { fechaPago: new Date(dto.fechaPago) }),
            estado: this.calcularEstado(montoTotal, montoPagado),
        });

        return this.obtenerPorId(id);
    }

    async eliminar(id: string): Promise<void> {
        await this.obtenerPorId(id);
        await this.repo.delete(id);
    }

    async resumenPorPaciente(pacienteId: string): Promise<{
        totalDeuda: number;
        totalPagado: number;
        saldoPendiente: number;
        pagos: Pago[];
    }> {
        const pagos = await this.listarPorPaciente(pacienteId);
        const totalDeuda = pagos.reduce((s, p) => s + Number(p.montoTotal), 0);
        const totalPagado = pagos.reduce((s, p) => s + Number(p.montoPagado), 0);
        return {
            totalDeuda,
            totalPagado,
            saldoPendiente: totalDeuda - totalPagado,
            pagos,
        };
    }

    async resumenGeneral(): Promise<{
        totalFacturado: number;
        totalCobrado: number;
        totalPendiente: number;
        pagosMes: number;
    }> {
        const pagos = await this.repo.find();
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

        const pagosMes = await this.repo.find({
            where: { fechaPago: Between(inicioMes, finMes) },
        });

        return {
            totalFacturado: pagos.reduce((s, p) => s + Number(p.montoTotal), 0),
            totalCobrado: pagos.reduce((s, p) => s + Number(p.montoPagado), 0),
            totalPendiente: pagos.reduce((s, p) => s + (Number(p.montoTotal) - Number(p.montoPagado)), 0),
            pagosMes: pagosMes.reduce((s, p) => s + Number(p.montoPagado), 0),
        };
    }

    private calcularEstado(total: number, pagado: number): EstadoPago {
        if (pagado <= 0) return EstadoPago.PENDIENTE;
        if (pagado >= total) return EstadoPago.COMPLETADO;
        return EstadoPago.PARCIAL;
    }
}
