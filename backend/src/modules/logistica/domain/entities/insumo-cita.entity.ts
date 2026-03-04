import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Cita } from '../../../citas/domain/entities/cita.entity';
import { Insumo } from './insumo.entity';

@Entity('insumos_cita')
export class InsumoCita {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Cita, (c) => c.insumosUtilizados, { onDelete: 'CASCADE' })
    cita: Cita;

    @ManyToOne(() => Insumo, (i) => i.usos, { eager: true })
    insumo: Insumo;

    @Column({ name: 'cantidad_estimada', type: 'decimal', precision: 10, scale: 3 })
    cantidadEstimada: number;

    @Column({ name: 'cantidad_real', type: 'decimal', precision: 10, scale: 3, nullable: true })
    cantidadReal: number;

    @Column({ name: 'costo_unitario', type: 'decimal', precision: 10, scale: 2, nullable: true })
    costoUnitario: number;

    @Column({ type: 'text', nullable: true })
    notas: string;

    @CreateDateColumn({ name: 'registrado_en' })
    registradoEn: Date;
}
