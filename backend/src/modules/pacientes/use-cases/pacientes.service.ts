import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Paciente } from '../domain/entities/paciente.entity';
import { IsString, IsOptional, IsEmail, IsArray } from 'class-validator';

export class CrearPacienteDto {
    @IsString() nombreCompleto: string;
    @IsOptional() @IsString() dni?: string;
    @IsOptional() fechaNacimiento?: string;
    @IsOptional() @IsString() telefono?: string;
    @IsOptional() @IsEmail() email?: string;
    @IsOptional() @IsArray() alertasMedicas?: string[];
    @IsOptional() @IsString() direccion?: string;
    @IsOptional() @IsString() grupoSanguineo?: string;
    @IsOptional() @IsString() contactoEmergenciaNombre?: string;
    @IsOptional() @IsString() contactoEmergenciaTelefono?: string;
}

@Injectable()
export class PacientesService {
    constructor(@InjectRepository(Paciente) private repo: Repository<Paciente>) { }

    async crear(dto: CrearPacienteDto): Promise<Paciente> {
        const paciente = this.repo.create({
            ...dto,
            alertasMedicas: dto.alertasMedicas || [],
        });
        return this.repo.save(paciente);
    }

    async buscarTodos(busqueda?: string): Promise<Paciente[]> {
        if (busqueda) {
            return this.repo.find({
                where: [
                    { nombreCompleto: Like(`%${busqueda}%`) },
                    { dni: Like(`%${busqueda}%`) },
                ],
                order: { nombreCompleto: 'ASC' },
            });
        }
        return this.repo.find({ order: { nombreCompleto: 'ASC' } });
    }

    async buscarPorId(id: string): Promise<Paciente> {
        const paciente = await this.repo.findOne({
            where: { id },
            relations: ['citas', 'tratamientos'],
        });
        if (!paciente) throw new NotFoundException(`Paciente ${id} no encontrado`);
        return paciente;
    }

    async actualizar(id: string, dto: Partial<CrearPacienteDto>): Promise<Paciente> {
        await this.buscarPorId(id);
        await this.repo.update(id, {
            ...dto,
            alertasMedicas: dto.alertasMedicas,
        } as any);
        return this.buscarPorId(id);
    }

    async eliminar(id: string): Promise<void> {
        await this.buscarPorId(id);
        await this.repo.delete(id);
    }
}
