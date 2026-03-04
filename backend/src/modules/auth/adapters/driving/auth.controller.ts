import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { AuthService } from '../../use-cases/auth.service';
import { RolUsuario } from '../../../usuarios/domain/entities/usuario.entity';

class LoginDto {
    @IsEmail() email: string;
    @IsString() @MinLength(6) contrasena: string;
}

class RegistrarDto {
    @IsString() nombre: string;
    @IsEmail() email: string;
    @IsString() @MinLength(6) contrasena: string;
    @IsEnum(RolUsuario) @IsOptional() rol?: RolUsuario;
}

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
    @UseGuards(AuthGuard('local'))
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('registrar')
    @ApiOperation({ summary: 'Registrar nuevo usuario' })
    async registrar(@Body() dto: RegistrarDto) {
        return this.authService.registrar(dto.nombre, dto.email, dto.contrasena, dto.rol);
    }

    @Post('login-paciente')
    @ApiOperation({ summary: 'Login de paciente con DNI y contraseña' })
    async loginPaciente(@Body() body: { dni: string; contrasena: string }) {
        return this.authService.loginPaciente(body.dni, body.contrasena);
    }

    @Get('perfil')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
    async perfil(@Request() req) {
        return req.user;
    }
}
