import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogisticaService } from './logistica.service';

@Injectable()
export class AlertasService {
    private readonly logger = new Logger(AlertasService.name);

    constructor(private readonly logisticaService: LogisticaService) { }

    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async verificarAlertasCaducidad() {
        this.logger.log('🔔 Verificando alertas de caducidad...');
        const insumosProximosAVencer = await this.logisticaService.obtenerProximosAVencer();

        if (insumosProximosAVencer.length === 0) {
            this.logger.log('✅ No hay insumos próximos a vencer.');
            return;
        }

        for (const insumo of insumosProximosAVencer) {
            const diasRestantes = Math.ceil(
                (new Date(insumo.fechaCaducidad).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            const severidad = diasRestantes <= 7 ? '🔴 CRÍTICA' : diasRestantes <= 30 ? '🟡 ALTA' : '🟢 MEDIA';
            this.logger.warn(
                `${severidad} | ${insumo.nombre} vence en ${diasRestantes} días (${new Date(insumo.fechaCaducidad).toLocaleDateString('es-PE')})`,
            );
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async verificarStockBajo() {
        this.logger.log('📦 Verificando stock mínimo...');
        const insumosStockBajo = await this.logisticaService.listarInsumos(true);

        if (insumosStockBajo.length === 0) {
            this.logger.log('✅ Todos los insumos tienen stock suficiente.');
            return;
        }

        for (const insumo of insumosStockBajo) {
            this.logger.warn(
                `⚠️ STOCK BAJO | ${insumo.nombre} | Actual: ${insumo.stockActual} | Mínimo: ${insumo.stockMinimo} [${insumo.unidadMedida}]`,
            );
        }
    }
}
