import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from '../../domain/entities/proveedor.entity';
import { IsString, IsOptional } from 'class-validator';

class CrearProveedorDto {
    @IsString() nombre: string;
    @IsOptional() @IsString() ruc?: string;
    @IsOptional() @IsString() telefonoContacto?: string;
    @IsOptional() @IsString() correoContacto?: string;
    @IsOptional() @IsString() direccion?: string;
    @IsOptional() @IsString() notas?: string;
}

@ApiTags('Logistica - Proveedores')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('logistica/proveedores')
export class ProveedoresController {
    constructor(@InjectRepository(Proveedor) private repo: Repository<Proveedor>) { }

    @Get()
    @ApiOperation({ summary: 'Listar proveedores' })
    listar() {
        return this.repo.find({ where: { esActivo: true }, order: { nombre: 'ASC' } });
    }

    @Post()
    @ApiOperation({ summary: 'Registrar proveedor' })
    crear(@Body() dto: CrearProveedorDto) {
        const p = this.repo.create(dto);
        return this.repo.save(p);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar proveedor' })
    async actualizar(@Param('id') id: string, @Body() dto: Partial<CrearProveedorDto>) {
        await this.repo.update(id, dto);
        return this.repo.findOne({ where: { id } });
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Desactivar proveedor' })
    desactivar(@Param('id') id: string) {
        return this.repo.update(id, { esActivo: false });
    }
}
