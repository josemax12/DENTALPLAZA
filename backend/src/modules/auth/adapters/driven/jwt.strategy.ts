import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../use-cases/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService, private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET') || 'cambia_este_secreto_en_produccion_2026',
        });
    }

    async validate(payload: { sub: string; email: string; rol: string }) {
        const usuario = await this.authService.buscarPorId(payload.sub);
        if (!usuario) {
            throw new UnauthorizedException();
        }
        return { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre };
    }
}
