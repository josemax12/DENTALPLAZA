import {
    Controller, Get, Post, Delete, Param, Body,
    UseGuards, Res, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { RecetasService, CrearRecetaDto } from '../../use-cases/recetas.service';

@ApiTags('Recetas Digitales')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('recetas')
export class RecetasController {
    constructor(private readonly recetasService: RecetasService) { }

    @Post()
    @ApiOperation({ summary: 'Crear una nueva receta digital' })
    crear(@Body() dto: CrearRecetaDto) {
        return this.recetasService.crear(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas las recetas (admin)' })
    listarTodas() {
        return this.recetasService.listarTodas();
    }

    @Get('paciente/:pacienteId')
    @ApiOperation({ summary: 'Listar recetas de un paciente' })
    listarPorPaciente(@Param('pacienteId') pacienteId: string) {
        return this.recetasService.listarPorPaciente(pacienteId);
    }

    @Get(':id/pdf')
    @ApiOperation({ summary: 'Descargar receta en PDF' })
    async descargarPDF(@Param('id') id: string, @Res() res: Response) {
        const pdfBuffer = await this.recetasService.generarPDF(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="receta-${id.substring(0, 8)}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar una receta' })
    eliminar(@Param('id') id: string) {
        return this.recetasService.eliminar(id);
    }
}
