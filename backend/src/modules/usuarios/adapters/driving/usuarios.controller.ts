import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../domain/entities/usuario.entity';
import { Doctor } from '../../domain/entities/doctor.entity';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

class CrearDoctorDto {
    @IsString() usuarioId: string;
    @IsOptional() @IsString() especialidad?: string;
    @IsOptional() @IsNumber() comision?: number;
}

@ApiTags('Usuarios y Doctores')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('usuarios')
export class UsuariosController {
    constructor(
        @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
        @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Listar todos los usuarios activos' })
    listarUsuarios() {
        return this.usuarioRepo.find({ where: { esActivo: true }, order: { nombre: 'ASC' } });
    }

    @Get('doctores')
    @ApiOperation({ summary: 'Listar todos los doctores activos' })
    listarDoctores() {
        return this.doctorRepo.find({ relations: ['usuario'], where: { esActivo: true } });
    }

    @Post('doctores')
    @ApiOperation({ summary: 'Asignar rol de doctor a un usuario' })
    async crearDoctor(@Body() dto: CrearDoctorDto) {
        const usuario = await this.usuarioRepo.findOne({ where: { id: dto.usuarioId } });
        if (!usuario) throw new Error('Usuario no encontrado');

        const doctor = this.doctorRepo.create({
            usuario,
            especialidad: dto.especialidad,
            comision: dto.comision,
        });
        return this.doctorRepo.save(doctor);
    }

    @Put('doctores/:id')
    @ApiOperation({ summary: 'Actualizar datos de doctor (especialidad, comisión)' })
    async actualizarDoctor(@Param('id') id: string, @Body() dto: Partial<CrearDoctorDto> & { esActivo?: boolean }) {
        await this.doctorRepo.update(id, {
            ...dto,
        });
        return this.doctorRepo.findOne({ where: { id }, relations: ['usuario'] });
    }
}
