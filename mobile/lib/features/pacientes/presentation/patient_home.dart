import 'package:flutter/material.dart';

class PatientHomeScreen extends StatelessWidget {
  const PatientHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Salud Dental'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Hola, María',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const Text('Tu próxima cita es en 3 días.'),
            const SizedBox(height: 24),
            
            _buildActionCard(
              context,
              title: 'Agendar Cita',
              subtitle: 'Reserva tu espacio ahora',
              icon: Icons.calendar_month,
              color: const Color(0xFF3B82F6),
            ),
            const SizedBox(height: 16),
            _buildActionCard(
              context,
              title: 'Mis Tratamientos',
              subtitle: 'Ver historial y progreso',
              icon: Icons.medical_services_outlined,
              color: const Color(0xFF10B981),
            ),
            const SizedBox(height: 16),
            _buildActionCard(
              context,
              title: 'Pagos Pendientes',
              subtitle: 'Consulta tus cuotas',
              icon: Icons.payments_outlined,
              color: const Color(0xFFF59E0B),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {},
      ),
    );
  }
}
