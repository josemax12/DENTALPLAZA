import {
    Controller, Get, Post, Param, Query, UseGuards, Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificacionesService } from '../../use-cases/notificaciones.service';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notificaciones')
export class NotificacionesController {
    constructor(private readonly service: NotificacionesService) { }

    @Get()
    @ApiOperation({ summary: 'Listar notificaciones por rol' })
    listar(@Query('rol') rol: string = 'admin') {
        return this.service.listarPorRol(rol);
    }

    @Get('count')
    @ApiOperation({ summary: 'Contar notificaciones no leídas' })
    async count(@Query('rol') rol: string = 'admin') {
        const count = await this.service.noLeidasCount(rol);
        return { count };
    }

    @Patch(':id/leer')
    @ApiOperation({ summary: 'Marcar notificación como leída' })
    marcarLeida(@Param('id') id: string) {
        return this.service.marcarLeida(id);
    }

    @Patch('leer-todas')
    @ApiOperation({ summary: 'Marcar todas como leídas' })
    marcarTodasLeidas(@Query('rol') rol: string = 'admin') {
        return this.service.marcarTodasLeidas(rol);
    }
}
