import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from '../domain/entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
    constructor(
        @InjectRepository(Notificacion)
        private readonly repo: Repository<Notificacion>,
    ) { }

    async crear(data: Partial<Notificacion>): Promise<Notificacion> {
        const notif = this.repo.create(data);
        return this.repo.save(notif);
    }

    async listarPorRol(rol: string): Promise<Notificacion[]> {
        return this.repo.find({
            where: [
                { destinatarioRol: rol },
                { destinatarioRol: 'todos' },
            ],
            order: { creadoEn: 'DESC' },
            take: 50,
        });
    }

    async noLeidasCount(rol: string): Promise<number> {
        return this.repo.count({
            where: [
                { destinatarioRol: rol, leida: false },
                { destinatarioRol: 'todos', leida: false },
            ],
        });
    }

    async marcarLeida(id: string): Promise<void> {
        await this.repo.update(id, { leida: true });
    }

    async marcarTodasLeidas(rol: string): Promise<void> {
        await this.repo.update(
            { destinatarioRol: rol, leida: false },
            { leida: true },
        );
    }
}
