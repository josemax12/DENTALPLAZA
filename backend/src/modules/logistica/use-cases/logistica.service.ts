import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Insumo } from '../domain/entities/insumo.entity';
import { Proveedor } from '../domain/entities/proveedor.entity';
import { InsumoCita } from '../domain/entities/insumo-cita.entity';
import { IsString, IsOptional, IsNumber, IsUUID, IsDateString } from 'class-validator';

export class CrearInsumoDto {
    @IsString() nombre: string;
    @IsOptional() @IsString() sku?: string;
    @IsOptional() @IsString() categoria?: string;
    @IsOptional() @IsString() unidadMedida?: string;
    @IsOptional() @IsNumber() stockActual?: number;
    @IsOptional() @IsNumber() stockMinimo?: number;
    @IsOptional() @IsNumber() cantidadReorden?: number;
    @IsOptional() @IsUUID() proveedorPreferidoId?: string;
    @IsOptional() @IsNumber() ultimoPrecioCompra?: number;
    @IsOptional() @IsDateString() fechaCaducidad?: string;
    @IsOptional() @IsNumber() diasAlertaAntes?: number;
    @IsOptional() @IsString() descripcion?: string;
}

export class RegistrarConsumoDto {
    @IsUUID() citaId: string;
    @IsUUID() insumoId: string;
    @IsNumber() cantidadEstimada: number;
    @IsOptional() @IsNumber() cantidadReal?: number;
    @IsOptional() @IsNumber() costoUnitario?: number;
    @IsOptional() @IsString() notas?: string;
}

@Injectable()
export class LogisticaService {
    constructor(
        @InjectRepository(Insumo) private insumoRepo: Repository<Insumo>,
        @InjectRepository(Proveedor) private proveedorRepo: Repository<Proveedor>,
        @InjectRepository(InsumoCita) private insumoCitaRepo: Repository<InsumoCita>,
    ) { }

    // ---- Insumos ----
    async crearInsumo(dto: CrearInsumoDto): Promise<Insumo> {
        const insumo = this.insumoRepo.create({
            ...dto,
            ...(dto.fechaCaducidad && { fechaCaducidad: new Date(dto.fechaCaducidad) }),
            ...(dto.proveedorPreferidoId && { proveedorPreferido: { id: dto.proveedorPreferidoId } as any }),
        });
        return this.insumoRepo.save(insumo);
    }

    async listarInsumos(soloStockBajo = false): Promise<Insumo[]> {
        const todos = await this.insumoRepo.find({ order: { nombre: 'ASC' } });
        if (soloStockBajo) return todos.filter(i => Number(i.stockActual) <= Number(i.stockMinimo));
        return todos;
    }

    async obtenerInsumo(id: string): Promise<Insumo> {
        const insumo = await this.insumoRepo.findOne({ where: { id } });
        if (!insumo) throw new NotFoundException(`Insumo ${id} no encontrado`);
        return insumo;
    }

    async actualizarInsumo(id: string, dto: Partial<CrearInsumoDto>): Promise<Insumo> {
        await this.obtenerInsumo(id);
        await this.insumoRepo.update(id, {
            ...dto,
            ...(dto.fechaCaducidad && { fechaCaducidad: new Date(dto.fechaCaducidad) }),
        });
        return this.obtenerInsumo(id);
    }

    async eliminarInsumo(id: string): Promise<void> {
        await this.obtenerInsumo(id);
        await this.insumoRepo.delete(id);
    }

    // ---- Registro de insumos por cita ----
    async registrarConsumo(dto: RegistrarConsumoDto): Promise<InsumoCita> {
        const insumo = await this.obtenerInsumo(dto.insumoId);
        const registro = this.insumoCitaRepo.create({
            cita: { id: dto.citaId } as any,
            insumo,
            cantidadEstimada: dto.cantidadEstimada,
            cantidadReal: dto.cantidadReal,
            costoUnitario: dto.costoUnitario ?? insumo.ultimoPrecioCompra,
            notas: dto.notas,
        });

        // Descontar stock si se registró cantidad real
        if (dto.cantidadReal) {
            await this.insumoRepo.update(dto.insumoId, {
                stockActual: () => `stock_actual - ${dto.cantidadReal}`,
            });
        }

        return this.insumoCitaRepo.save(registro);
    }

    // ---- Anomalías ----
    async obtenerAnomalias(): Promise<InsumoCita[]> {
        const todos = await this.insumoCitaRepo.find({
            relations: ['insumo', 'cita', 'cita.paciente', 'cita.doctor', 'cita.doctor.usuario'],
            where: { cantidadReal: LessThanOrEqual(0) },
        });
        // Filtrar donde consumo real > 1.2x estimado
        return (await this.insumoCitaRepo.find({
            relations: ['insumo', 'cita', 'cita.paciente'],
        })).filter(ic => ic.cantidadReal && ic.cantidadReal > ic.cantidadEstimada * 1.2);
    }

    // ---- Insumos próximos a vencer ----
    async obtenerProximosAVencer(): Promise<Insumo[]> {
        const limite = new Date();
        limite.setDate(limite.getDate() + 90);
        return this.insumoRepo.find({
            where: { fechaCaducidad: LessThanOrEqual(limite) },
            order: { fechaCaducidad: 'ASC' },
        });
    }
}
