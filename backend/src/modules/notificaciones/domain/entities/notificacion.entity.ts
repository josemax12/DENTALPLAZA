import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notificaciones')
export class Notificacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50 })
    tipo: string; // 'nueva_cita', 'cita_cancelada', 'mensaje', etc.

    @Column({ length: 500 })
    titulo: string;

    @Column({ type: 'text', nullable: true })
    mensaje: string;

    @Column({ name: 'destinatario_rol', length: 30, default: 'admin' })
    destinatarioRol: string; // 'admin', 'doctor', 'paciente'

    @Column({ name: 'destinatario_id', nullable: true })
    destinatarioId: string; // specific user/doctor ID if targeted

    @Column({ name: 'paciente_nombre', length: 200, nullable: true })
    pacienteNombre: string;

    @Column({ default: false })
    leida: boolean;

    @Column({ name: 'referencia_id', nullable: true })
    referenciaId: string; // ID of related entity (cita, etc.)

    @CreateDateColumn({ name: 'created_at' })
    creadoEn: Date;
}
