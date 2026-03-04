import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notificaciones',
})
export class NotificacionesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`🔔 Cliente conectado a notificaciones: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`🔕 Cliente desconectado: ${client.id}`);
    }

    /**
     * El cliente envía su pacienteId al conectarse para unirse a su sala personal.
     * Esto permite enviar notificaciones dirigidas solo a ese paciente.
     */
    @SubscribeMessage('join_patient_room')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() pacienteId: string,
    ) {
        client.join(`paciente:${pacienteId}`);
        console.log(`🏥 Paciente ${pacienteId} unido a su sala`);
    }

    /** Emitir a todos los administradores y doctores */
    emitToAll(event: string, data: any) {
        this.server.emit(event, data);
    }

    /** Emitir a un paciente específico por su ID */
    emitToPaciente(pacienteId: string, event: string, data: any) {
        this.server.to(`paciente:${pacienteId}`).emit(event, data);
    }
}
