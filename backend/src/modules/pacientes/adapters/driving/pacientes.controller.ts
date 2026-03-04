import {
    Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,
    UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PacientesService, CrearPacienteDto } from '../../use-cases/pacientes.service';

@ApiTags('Pacientes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('pacientes')
export class PacientesController {
    constructor(private readonly service: PacientesService) { }

    @Get('reniec/:dni')
    @ApiOperation({ summary: 'Consultar DNI en RENIEC' })
    async consultarReniec(@Param('dni') dni: string) {
        const token = 'sk_11408.E9YtXefRjIeP1sHEZuLRaorfD7BZMkiI';

        // Lista de APIs a intentar en orden
        const apis = [
            { url: `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, headers: { 'Authorization': `Bearer ${token}` } },
            { url: `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, headers: { 'Authorization': token } },
            { url: `https://apiperu.dev/api/dni/${dni}`, headers: { 'Authorization': `Bearer ${token}` } },
        ];

        for (const apiConfig of apis) {
            try {
                const resp = await fetch(apiConfig.url, {
                    headers: { 'Accept': 'application/json', ...apiConfig.headers },
                });
                if (resp.ok) {
                    const data = await resp.json();
                    // Normalizar respuesta (diferentes APIs usan diferentes campos)
                    const result = data.data || data;
                    if (result.nombres) {
                        return {
                            nombres: result.nombres,
                            apellidoPaterno: result.apellidoPaterno || result.apellido_paterno,
                            apellidoMaterno: result.apellidoMaterno || result.apellido_materno,
                        };
                    }
                }
            } catch {
                continue; // Intentar siguiente API
            }
        }

        // Si ninguna API funciona, retornar error amigable
        console.log('Todas las APIs RENIEC fallaron para DNI:', dni);
        return { error: true, message: 'RENIEC temporalmente no disponible. Ingrese el nombre manualmente.' };
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos los pacientes (búsqueda opcional)' })
    @ApiQuery({ name: 'busqueda', required: false })
    listar(@Query('busqueda') busqueda?: string) {
        return this.service.buscarTodos(busqueda);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener ficha completa de un paciente' })
    obtenerUno(@Param('id') id: string) {
        return this.service.buscarPorId(id);
    }

    @Post()
    @ApiOperation({ summary: 'Registrar nuevo paciente' })
    crear(@Body() dto: CrearPacienteDto) {
        return this.service.crear(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar datos del paciente' })
    actualizar(@Param('id') id: string, @Body() dto: Partial<CrearPacienteDto>) {
        return this.service.actualizar(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar paciente' })
    eliminar(@Param('id') id: string) {
        return this.service.eliminar(id);
    }

    @Post(':id/foto')
    @ApiOperation({ summary: 'Subir foto de perfil del paciente' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('foto', {
        storage: diskStorage({
            destination: './uploads/pacientes',
            filename: (_req, file, cb) => {
                const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
        fileFilter: (_req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                cb(null, true);
            } else {
                cb(null, false);
            }
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }))
    async subirFoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
        if (!file) return { error: 'Solo se permiten imágenes (jpg, png, webp)' };
        const fotoUrl = `/uploads/pacientes/${file.filename}`;
        return this.service.actualizar(id, { fotoPerfil: fotoUrl } as any);
    }
}
