import {
    Controller, Get, Post, Put, Patch, Delete,
    Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PagosService, CrearPagoDto, AbonarDto } from '../../use-cases/pagos.service';

@ApiTags('Pagos y Facturación')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('pagos')
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    @Post()
    @ApiOperation({ summary: 'Registrar un nuevo pago o deuda' })
    crear(@Body() dto: CrearPagoDto) {
        return this.pagosService.crear(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos los pagos' })
    listarTodos() {
        return this.pagosService.listarTodos();
    }

    @Get('resumen')
    @ApiOperation({ summary: 'Resumen general de caja (dashboard)' })
    resumenGeneral() {
        return this.pagosService.resumenGeneral();
    }

    @Get('paciente/:pacienteId')
    @ApiOperation({ summary: 'Listar pagos de un paciente' })
    listarPorPaciente(@Param('pacienteId') pacienteId: string) {
        return this.pagosService.listarPorPaciente(pacienteId);
    }

    @Get('paciente/:pacienteId/resumen')
    @ApiOperation({ summary: 'Estado de cuenta de un paciente' })
    resumenPorPaciente(@Param('pacienteId') pacienteId: string) {
        return this.pagosService.resumenPorPaciente(pacienteId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener pago por ID' })
    obtenerPorId(@Param('id') id: string) {
        return this.pagosService.obtenerPorId(id);
    }

    @Patch(':id/abonar')
    @ApiOperation({ summary: 'Registrar un abono a un pago existente' })
    abonar(@Param('id') id: string, @Body() dto: AbonarDto) {
        return this.pagosService.abonar(id, dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar datos de un pago' })
    actualizar(@Param('id') id: string, @Body() dto: Partial<CrearPagoDto>) {
        return this.pagosService.actualizar(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar un pago' })
    eliminar(@Param('id') id: string) {
        return this.pagosService.eliminar(id);
    }
}
