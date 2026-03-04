import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Paciente } from '../../../pacientes/domain/entities/paciente.entity';
import { Doctor } from '../../../usuarios/domain/entities/doctor.entity';

@Entity('recetas')
export class Receta {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Paciente, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn()
    paciente: Paciente;

    @ManyToOne(() => Doctor, { eager: true, nullable: true })
    @JoinColumn()
    doctor: Doctor;

    @Column({ length: 200 })
    diagnostico: string;

    @Column({ type: 'text' })
    medicamentos: string; // JSON: [{nombre, dosis, frecuencia, duracion}]

    @Column({ type: 'text', nullable: true })
    indicaciones: string;

    @Column({ nullable: true })
    proximaRevision: string;

    @Column({ default: false })
    descargada: boolean;

    @CreateDateColumn({ name: 'created_at' })
    creadaEn: Date;
}
