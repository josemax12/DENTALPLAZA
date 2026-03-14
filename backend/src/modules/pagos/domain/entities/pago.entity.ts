import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Paciente } from '../../../pacientes/domain/entities/paciente.entity';
import { Cita } from '../../../citas/domain/entities/cita.entity';

export enum MetodoPago {
    EFECTIVO = 'efectivo',
    TARJETA = 'tarjeta',
    TRANSFERENCIA = 'transferencia',
    YAPE = 'yape',
    PLIN = 'plin',
}

export enum EstadoPago {
    PENDIENTE = 'pendiente',
    COMPLETADO = 'completado',
    PARCIAL = 'parcial',
    CANCELADO = 'cancelado',
}

@Entity('pagos')
export class Pago {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Paciente, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn()
    paciente: Paciente;

    @ManyToOne(() => Cita, { nullable: true, eager: false })
    @JoinColumn()
    cita: Cita;

    @Column({ length: 200 })
    concepto: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    montoTotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    montoPagado: number;

    @Column({
        name: 'metodo_pago',
        default: MetodoPago.EFECTIVO,
    })
    metodoPago: MetodoPago;

    @Column({
        name: 'estado',
        default: EstadoPago.PENDIENTE,
    })
    estado: EstadoPago;

    @Column({ name: 'numero_comprobante', length: 50, nullable: true })
    numeroComprobante: string;

    @Column({ type: 'text', nullable: true })
    notas: string;

    @Column({ name: 'fecha_pago', type: 'timestamp', nullable: true })
    fechaPago: Date;

    @CreateDateColumn({ name: 'created_at' })
    creadoEn: Date;
}
