import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';
import { Doctor } from './doctor.entity';

export enum RolUsuario {
    ADMIN = 'admin',
    DOCTOR = 'doctor',
    ASISTENTE = 'asistente',
    RECEPCIONISTA = 'recepcionista',
    PACIENTE = 'paciente',
}

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    nombre: string;

    @Column({ unique: true, length: 150 })
    email: string;

    @Column({ name: 'contrasena_hash' })
    contrasenaHash: string;

    @Column({ default: RolUsuario.RECEPCIONISTA })
    rol: RolUsuario;

    @Column({ name: 'es_activo', default: true })
    esActivo: boolean;

    @OneToOne(() => Doctor, (d) => d.usuario)
    doctor: Doctor;

    @CreateDateColumn({ name: 'created_at' })
    creadoEn: Date;
}
