import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LogisticaService, CrearInsumoDto, RegistrarConsumoDto } from '../../use-cases/logistica.service';

@ApiTags('Logistica - Insumos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('logistica/insumos')
export class LogisticaController {
    constructor(private readonly service: LogisticaService) { }

    @Get()
    @ApiOperation({ summary: 'Listar todos los insumos (opcional: solo stock bajo)' })
    @ApiQuery({ name: 'stock_bajo', required: false, type: Boolean })
    listar(@Query('stock_bajo') stockBajo?: string) {
        return this.service.listarInsumos(stockBajo === 'true');
    }

    @Get('caducidades')
    @ApiOperation({ summary: 'Listar insumos próximos a vencer (90 días)' })
    caducidades() {
        return this.service.obtenerProximosAVencer();
    }

    @Get('anomalias')
    @ApiOperation({ summary: 'Listar consumos anómalos (Real > Estimado * 1.2)' })
    anomalias() {
        return this.service.obtenerAnomalias();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalle de un insumo' })
    obtener(@Param('id') id: string) {
        return this.service.obtenerInsumo(id);
    }

    @Post()
    @ApiOperation({ summary: 'Registrar nuevo insumo' })
    crear(@Body() dto: CrearInsumoDto) {
        return this.service.crearInsumo(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar insumo' })
    actualizar(@Param('id') id: string, @Body() dto: Partial<CrearInsumoDto>) {
        return this.service.actualizarInsumo(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar insumo' })
    eliminar(@Param('id') id: string) {
        return this.service.eliminarInsumo(id);
    }

    @Post('consumo')
    @ApiOperation({ summary: 'Registrar consumo de insumo en una sesión/cita' })
    registrarConsumo(@Body() dto: RegistrarConsumoDto) {
        return this.service.registrarConsumo(dto);
    }
}
