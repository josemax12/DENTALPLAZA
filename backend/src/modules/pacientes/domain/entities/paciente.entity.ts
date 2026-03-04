import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Usuario } from '../../../usuarios/domain/entities/usuario.entity';
import { Cita } from '../../../citas/domain/entities/cita.entity';
import { TratamientoDental } from '../../../tratamientos/domain/entities/tratamiento.entity';

@Entity('pacientes')
export class Paciente {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'nombre_completo', length: 200 })
    nombreCompleto: string;

    @Column({ length: 12, unique: true, nullable: true })
    dni: string;

    @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
    fechaNacimiento: Date;

    @Column({ length: 20, nullable: true })
    telefono: string;

    @Column({ length: 150, nullable: true })
    email: string;

    @Column({ name: 'alertas_medicas', type: 'simple-array', nullable: true })
    alertasMedicas: string[];

    @Column({ length: 500, nullable: true })
    direccion: string;

    @Column({ name: 'grupo_sanguineo', length: 5, nullable: true })
    grupoSanguineo: string;

    @Column({ name: 'contacto_emergencia_nombre', length: 200, nullable: true })
    contactoEmergenciaNombre: string;

    @Column({ name: 'contacto_emergencia_telefono', length: 20, nullable: true })
    contactoEmergenciaTelefono: string;

    @Column({ name: 'foto_perfil', length: 500, nullable: true })
    fotoPerfil: string;

    @ManyToOne(() => Usuario, { nullable: true })
    usuario: Usuario;

    @OneToMany(() => Cita, (cita) => cita.paciente)
    citas: Cita[];

    @OneToMany(() => TratamientoDental, (t) => t.paciente)
    tratamientos: TratamientoDental[];

    @CreateDateColumn({ name: 'created_at' })
    creadoEn: Date;
}
