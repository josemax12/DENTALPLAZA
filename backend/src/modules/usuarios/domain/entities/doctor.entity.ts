import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Cita } from '../../../citas/domain/entities/cita.entity';

@Entity('doctores')
export class Doctor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Usuario, (u) => u.doctor, { cascade: true })
    @JoinColumn()
    usuario: Usuario;

    @Column({ length: 100, nullable: true })
    especialidad: string;

    @Column({ name: 'google_calendar_id', length: 200, nullable: true })
    googleCalendarId: string;

    @Column({ name: 'google_refresh_token', type: 'text', nullable: true })
    googleRefreshToken: string;

    @Column({ name: 'es_activo', default: true })
    esActivo: boolean;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
    comision: number;

    @OneToMany(() => Cita, (c) => c.doctor)
    citas: Cita[];
}
