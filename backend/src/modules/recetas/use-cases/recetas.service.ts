import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receta } from '../domain/entities/receta.entity';
import { Paciente } from '../../pacientes/domain/entities/paciente.entity';
import { Doctor } from '../../usuarios/domain/entities/doctor.entity';
import { NotificacionesService } from '../../notificaciones/use-cases/notificaciones.service';
import { NotificacionesGateway } from '../../notificaciones/notificaciones.gateway';

const PDFDocument = require('pdfkit');

export class CrearRecetaDto {
    pacienteId: string;
    doctorId: string;
    diagnostico: string;
    medicamentos: Array<{
        nombre: string;
        dosis: string;
        frecuencia: string;
        duracion: string;
    }>;
    indicaciones?: string;
    proximaRevision?: string;
}

@Injectable()
export class RecetasService {
    constructor(
        @InjectRepository(Receta) private recetaRepo: Repository<Receta>,
        @InjectRepository(Paciente) private pacienteRepo: Repository<Paciente>,
        @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
        private readonly notifService: NotificacionesService,
        private readonly notifGateway: NotificacionesGateway,
    ) { }

    async crear(dto: CrearRecetaDto): Promise<Receta> {
        const paciente = await this.pacienteRepo.findOne({ where: { id: dto.pacienteId } });
        if (!paciente) throw new NotFoundException('Paciente no encontrado');

        const doctor = dto.doctorId
            ? await this.doctorRepo.findOne({ where: { id: dto.doctorId }, relations: ['usuario'] })
            : null;

        const receta = this.recetaRepo.create({
            paciente,
            doctor: doctor || undefined,
            diagnostico: dto.diagnostico,
            medicamentos: JSON.stringify(dto.medicamentos),
            indicaciones: dto.indicaciones,
            proximaRevision: dto.proximaRevision,
        });

        const saved = await this.recetaRepo.save(receta);

        // Notificar al paciente en tiempo real
        try {
            const notif = await this.notifService.crear({
                tipo: 'nueva_receta',
                titulo: '📝 Nueva Receta Médica',
                mensaje: `Se te ha generado una nueva receta para: "${dto.diagnostico}". Descárgala desde tu portal.`,
                destinatarioRol: 'paciente',
                destinatarioId: dto.pacienteId,
                pacienteNombre: paciente.nombreCompleto,
                referenciaId: saved.id,
            });
            this.notifGateway.emitToPaciente(dto.pacienteId, 'notif_paciente', notif);
        } catch (err) {
            console.error('Error al notificar paciente por receta:', err);
        }

        return saved;
    }

    async listarPorPaciente(pacienteId: string): Promise<Receta[]> {
        return this.recetaRepo.find({
            where: { paciente: { id: pacienteId } },
            order: { creadaEn: 'DESC' },
            relations: ['doctor', 'doctor.usuario'],
        });
    }

    async listarTodas(): Promise<Receta[]> {
        return this.recetaRepo.find({
            order: { creadaEn: 'DESC' },
            relations: ['doctor', 'doctor.usuario'],
        });
    }

    async obtenerPorId(id: string): Promise<Receta> {
        const receta = await this.recetaRepo.findOne({
            where: { id },
            relations: ['doctor', 'doctor.usuario'],
        });
        if (!receta) throw new NotFoundException(`Receta ${id} no encontrada`);
        return receta;
    }

    async eliminar(id: string): Promise<void> {
        await this.obtenerPorId(id);
        await this.recetaRepo.delete(id);
    }

    async generarPDF(id: string): Promise<Buffer> {
        const receta = await this.obtenerPorId(id);
        await this.recetaRepo.update(id, { descargada: true });

        const medicamentos = JSON.parse(receta.medicamentos || '[]');
        const doctorNombre = receta.doctor?.usuario?.nombre || 'Doctor Asignado';
        const doctorEspecialidad = receta.doctor?.especialidad || 'Odontólogo';

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const primaryColor = '#1e40af';
            const accentColor = '#3b82f6';
            const textMuted = '#64748b';

            // ─── HEADER ───────────────────────────────────────────────────
            doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

            doc.fill('white').fontSize(22).font('Helvetica-Bold')
                .text('DENTAL PLAZA', 50, 25, { align: 'left' });

            doc.fill('white').fontSize(10).font('Helvetica')
                .text('Sistema de Gestión Odontológica', 50, 52)
                .text('Tel: +51 999 000 111  |  dental@plaza.com', 50, 65)
                .text('Av. Principal 123, Lima, Perú', 50, 78);

            doc.fill('white').fontSize(14).font('Helvetica-Bold')
                .text('RECETA MÉDICA', 350, 32, { align: 'right', width: 195 });
            doc.fill('#bfdbfe').fontSize(10).font('Helvetica')
                .text(`N° ${receta.id.substring(0, 8).toUpperCase()}`, 350, 54, { align: 'right', width: 195 });
            doc.fill('#bfdbfe').fontSize(9)
                .text(`Fecha: ${new Date(receta.creadaEn).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, 350, 70, { align: 'right', width: 195 });

            // ─── PATIENT INFO ─────────────────────────────────────────────
            doc.rect(50, 115, 495, 75).fill('#f0f9ff');
            doc.rect(50, 115, 4, 75).fill(accentColor);

            doc.fill(textMuted).fontSize(8).font('Helvetica-Bold')
                .text('DATOS DEL PACIENTE', 65, 122);
            doc.fill('#0f172a').fontSize(14).font('Helvetica-Bold')
                .text(receta.paciente?.nombreCompleto || '—', 65, 135);
            const infoY = 156;
            doc.fill(textMuted).fontSize(9).font('Helvetica')
                .text(`DNI: ${receta.paciente?.dni || 'N/D'}`, 65, infoY)
                .text(`Teléfono: ${receta.paciente?.telefono || 'N/D'}`, 230, infoY)
                .text(`Email: ${receta.paciente?.email || 'N/D'}`, 380, infoY);

            // ─── DIAGNOSTICO ──────────────────────────────────────────────
            doc.fill('#0f172a').fontSize(11).font('Helvetica-Bold')
                .text('DIAGNÓSTICO', 50, 208);
            doc.moveTo(50, 222).lineTo(545, 222).stroke(accentColor);

            doc.fill('#1e293b').fontSize(10).font('Helvetica')
                .text(receta.diagnostico, 50, 230, { width: 495 });

            // ─── MEDICAMENTOS ─────────────────────────────────────────────
            let curY = doc.y + 20;
            doc.fill('#0f172a').fontSize(11).font('Helvetica-Bold')
                .text('MEDICAMENTOS RECETADOS', 50, curY);
            doc.moveTo(50, curY + 14).lineTo(545, curY + 14).stroke(accentColor);

            curY += 24;
            medicamentos.forEach((med: any, idx: number) => {
                if (curY > 680) { doc.addPage(); curY = 50; }

                doc.circle(63, curY + 8, 9).fill(accentColor);
                doc.fill('white').fontSize(9).font('Helvetica-Bold').text(`${idx + 1}`, 59, curY + 4);

                doc.fill('#0f172a').fontSize(11).font('Helvetica-Bold')
                    .text(med.nombre, 82, curY, { width: 350 });
                curY += 16;

                doc.fill(textMuted).fontSize(9).font('Helvetica')
                    .text(`Dosis: ${med.dosis}   ·   Frecuencia: ${med.frecuencia}   ·   Duración: ${med.duracion}`, 82, curY);
                curY += 20;

                if (idx < medicamentos.length - 1) {
                    doc.moveTo(82, curY - 5).lineTo(545, curY - 5).stroke('#e2e8f0');
                }
            });

            // ─── INDICACIONES ─────────────────────────────────────────────
            if (receta.indicaciones) {
                curY += 10;
                doc.fill('#0f172a').fontSize(11).font('Helvetica-Bold').text('INDICACIONES GENERALES', 50, curY);
                doc.moveTo(50, curY + 14).lineTo(545, curY + 14).stroke(accentColor);
                curY += 22;
                doc.fill('#1e293b').fontSize(10).font('Helvetica').text(receta.indicaciones, 50, curY, { width: 495 });
                curY = doc.y + 16;
            }

            // ─── PRÓXIMA REVISIÓN ─────────────────────────────────────────
            if (receta.proximaRevision) {
                doc.rect(50, curY, 495, 40).fill('#eff6ff');
                doc.rect(50, curY, 4, 40).fill(accentColor);
                doc.fill(textMuted).fontSize(8).font('Helvetica-Bold').text('PRÓXIMA REVISIÓN', 65, curY + 6);
                doc.fill('#0f172a').fontSize(10).font('Helvetica').text(receta.proximaRevision, 65, curY + 20);
                curY += 55;
            }

            // ─── FIRMA ────────────────────────────────────────────────────
            const signY = Math.max(curY + 20, 670);
            doc.moveTo(350, signY).lineTo(545, signY).stroke('#334155');
            doc.fill('#0f172a').fontSize(10).font('Helvetica-Bold')
                .text(doctorNombre, 350, signY + 6, { width: 195, align: 'center' });
            doc.fill(textMuted).fontSize(9).font('Helvetica')
                .text(doctorEspecialidad, 350, signY + 20, { width: 195, align: 'center' });

            // ─── FOOTER ───────────────────────────────────────────────────
            doc.rect(0, doc.page.height - 32, doc.page.width, 32).fill(primaryColor);
            doc.fill('white').fontSize(8).font('Helvetica')
                .text('Documento válido con sello y firma del profesional. Dental Plaza © ' + new Date().getFullYear(),
                    50, doc.page.height - 18, { align: 'center', width: doc.page.width - 100 });

            doc.end();
        });
    }
}
