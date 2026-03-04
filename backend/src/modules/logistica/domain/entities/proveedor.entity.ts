import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { Insumo } from './insumo.entity';

@Entity('proveedores')
export class Proveedor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    nombre: string;

    @Column({ length: 15, nullable: true })
    ruc: string;

    @Column({ name: 'telefono_contacto', length: 20, nullable: true })
    telefonoContacto: string;

    @Column({ name: 'correo_contacto', length: 150, nullable: true })
    correoContacto: string;

    @Column({ length: 300, nullable: true })
    direccion: string;

    @Column({ type: 'text', nullable: true })
    notas: string;

    @Column({ name: 'es_activo', default: true })
    esActivo: boolean;

    @OneToMany(() => Insumo, (i) => i.proveedorPreferido)
    insumos: Insumo[];

    @CreateDateColumn({ name: 'created_at' })
    creadoEn: Date;
}
