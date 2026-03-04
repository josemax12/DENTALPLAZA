import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Paciente } from '../../../pacientes/domain/entities/paciente.entity';
import { Cita } from '../../../citas/domain/entities/cita.entity';

export enum EstadoTratamiento {
    PLANIFICADO = 'planificado',
    EN_PROGRESO = 'en_progreso',
    COMPLETADO = 'completado',
    ABANDONADO = 'abandonado',
}

@Entity('tratamientos_dentales')
export class TratamientoDental {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Paciente, (p) => p.tratamientos, { onDelete: 'CASCADE' })
    paciente: Paciente;

    @Column({ length: 150 })
    nombre: string;

    @Column({
        default: EstadoTratamiento.EN_PROGRESO,
    })
    estado: EstadoTratamiento;

    @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
    fechaInicio: Date;

    @Column({ name: 'fecha_fin', type: 'date', nullable: true })
    fechaFin: Date;

    @Column({ type: 'text', nullable: true })
    notas: string;

    @Column({ name: 'numeros_piezas', type: 'simple-array', nullable: true })
    numerosPiezas: number[];

    @Column({ name: 'costo_estimado', type: 'decimal', precision: 10, scale: 2, nullable: true })
    costoEstimado: number;

    @OneToMany(() => Cita, (c) => c.tratamiento)
    sesiones: Cita[];

    @CreateDateColumn({ name: 'created_at' })
    creadoEn: Date;
}
