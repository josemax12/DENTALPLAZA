import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario, RolUsuario } from '../../usuarios/domain/entities/usuario.entity';
import { Paciente } from '../../pacientes/domain/entities/paciente.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
        @InjectRepository(Paciente) private pacienteRepo: Repository<Paciente>,
        private jwtService: JwtService,
    ) { }

    async onModuleInit() {
        try {
            const admin = await this.usuarioRepo.findOne({ where: { email: 'admin@admin.com' } });
            if (!admin) {
                const hash = await bcrypt.hash('admin123', 12);
                const user = this.usuarioRepo.create({
                    nombre: 'Administrador Sistema',
                    email: 'admin@admin.com',
                    contrasenaHash: hash,
                    rol: RolUsuario.ADMIN,
                });
                await this.usuarioRepo.save(user);
                console.log('✅ Usuario Administrador predeterminado creado (admin@admin.com / admin123)');
            }
        } catch (e) {
            console.log('ℹ️ Verificación de usuario administrador completada');
        }
    }

    async validarUsuario(email: string, contrasena: string): Promise<Usuario | null> {
        const usuario = await this.usuarioRepo.findOne({ where: { email, esActivo: true } });
        if (!usuario) return null;
        const valido = await bcrypt.compare(contrasena, usuario.contrasenaHash);
        return valido ? usuario : null;
    }

    async login(usuario: Usuario) {
        const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
        return {
            accessToken: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
            },
        };
    }

    async loginPaciente(dni: string, contrasena: string) {
        const paciente = await this.pacienteRepo.findOne({
            where: { dni },
            relations: ['usuario'],
        });
        if (!paciente) throw new NotFoundException('No se encontró un paciente con ese DNI');

        // Si el paciente ya tiene un usuario vinculado, verificar contraseña
        if (paciente.usuario) {
            const valido = await bcrypt.compare(contrasena, paciente.usuario.contrasenaHash);
            if (!valido) throw new UnauthorizedException('Contraseña incorrecta');

            const payload = { sub: paciente.usuario.id, email: paciente.usuario.email, rol: 'paciente', pacienteId: paciente.id };
            return {
                accessToken: this.jwtService.sign(payload),
                usuario: {
                    id: paciente.usuario.id,
                    nombre: paciente.nombreCompleto,
                    email: paciente.usuario.email,
                    rol: 'paciente',
                    pacienteId: paciente.id,
                },
            };
        }

        // Primera vez: crear usuario con la contraseña proporcionada
        const email = paciente.email || `${dni}@paciente.dental`;
        const hash = await bcrypt.hash(contrasena, 12);
        const usuario = this.usuarioRepo.create({
            nombre: paciente.nombreCompleto,
            email,
            contrasenaHash: hash,
            rol: RolUsuario.PACIENTE,
        });
        await this.usuarioRepo.save(usuario);

        paciente.usuario = usuario;
        await this.pacienteRepo.save(paciente);

        const payload = { sub: usuario.id, email, rol: 'paciente', pacienteId: paciente.id };
        return {
            accessToken: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                nombre: paciente.nombreCompleto,
                email,
                rol: 'paciente',
                pacienteId: paciente.id,
            },
        };
    }

    async registrar(nombre: string, email: string, contrasena: string, rol: RolUsuario = RolUsuario.RECEPCIONISTA) {
        const existe = await this.usuarioRepo.findOne({ where: { email } });
        if (existe) throw new ConflictException('El correo ya está registrado');

        const hash = await bcrypt.hash(contrasena, 12);
        const usuario = this.usuarioRepo.create({ nombre, email, contrasenaHash: hash, rol });
        await this.usuarioRepo.save(usuario);

        return this.login(usuario);
    }

    async buscarPorId(id: string): Promise<Usuario | null> {
        return this.usuarioRepo.findOne({ where: { id } });
    }
}
