import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Paciente } from '../../../pacientes/domain/entities/paciente.entity';
import { Usuario } from '../../../usuarios/domain/entities/usuario.entity';
import { TratamientoDental } from '../../../tratamientos/domain/entities/tratamiento.entity';
import { InsumoCita } from '../../../logistica/domain/entities/insumo-cita.entity';

export enum EstadoCita {
    PROGRAMADA = 'programada',
    CONFIRMADA = 'confirmada',
    EN_PROGRESO = 'en_progreso',
    COMPLETADA = 'completada',
    CANCELADA = 'cancelada',
    NO_ASISTIO = 'no_asistio',
}

@Entity('citas')
export class Cita {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Paciente, (p) => p.citas, { eager: true })
    paciente: Paciente;

    @ManyToOne(() => Usuario, { eager: true })
    doctor: Usuario;

    @ManyToOne(() => TratamientoDental, (t) => t.sesiones, { nullable: true })
    tratamiento: TratamientoDental;

    @Column({ name: 'fecha_hora' })
    fechaHora: Date;

    @Column({ name: 'duracion_minutos', default: 45 })
    duracionMinutos: number;

    @Column({
        default: EstadoCita.PROGRAMADA,
    })
    estado: EstadoCita;

    @Column({ name: 'google_event_id', length: 200, nullable: true })
    googleEventId: string;

    @Column({ length: 300, nullable: true })
    motivo: string;

    @Column({ name: 'notas_sesion', type: 'text', nullable: true })
    notasSesion: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    costo: number;

    @Column({ default: false })
    pagado: boolean;

    @OneToMany(() => InsumoCita, (ic) => ic.cita)
    insumosUtilizados: InsumoCita[];

    @CreateDateColumn({ name: 'created_at' })
    creadoEn: Date;
}
