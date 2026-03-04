import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../use-cases/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({ usernameField: 'email', passwordField: 'contrasena' });
    }

    async validate(email: string, contrasena: string) {
        const usuario = await this.authService.validarUsuario(email, contrasena);
        if (!usuario) throw new UnauthorizedException('Credenciales incorrectas');
        return usuario;
    }
}
