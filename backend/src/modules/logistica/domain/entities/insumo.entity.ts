import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Proveedor } from './proveedor.entity';
import { InsumoCita } from './insumo-cita.entity';

@Entity('insumos')
export class Insumo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    nombre: string;

    @Column({ length: 80, unique: true, nullable: true })
    sku: string;

    @Column({ length: 80, nullable: true })
    categoria: string;

    @Column({ name: 'unidad_medida', length: 30, nullable: true })
    unidadMedida: string;

    @Column({ name: 'stock_actual', type: 'decimal', precision: 10, scale: 3, default: 0 })
    stockActual: number;

    @Column({ name: 'stock_minimo', type: 'decimal', precision: 10, scale: 3, default: 5 })
    stockMinimo: number;

    @Column({ name: 'cantidad_reorden', type: 'decimal', precision: 10, scale: 3, nullable: true })
    cantidadReorden: number;

    @ManyToOne(() => Proveedor, { nullable: true, eager: true })
    proveedorPreferido: Proveedor;

    @Column({ name: 'ultimo_precio_compra', type: 'decimal', precision: 10, scale: 2, nullable: true })
    ultimoPrecioCompra: number;

    @Column({ name: 'fecha_caducidad', type: 'date', nullable: true })
    fechaCaducidad: Date;

    @Column({ name: 'dias_alerta_antes', default: 60 })
    diasAlertaAntes: number;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @OneToMany(() => InsumoCita, (ic) => ic.insumo)
    usos: InsumoCita[];

    @CreateDateColumn({ name: 'created_at' })
    creadoEn: Date;
}
