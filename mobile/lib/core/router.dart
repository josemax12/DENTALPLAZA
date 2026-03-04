import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:odonto_sync/features/auth/presentation/login_screen.dart';
import 'package:odonto_sync/features/pacientes/presentation/patient_home.dart';
import 'package:odonto_sync/features/agenda/presentation/doctor_home.dart';

// Este es el proveedor de navegación para toda la app.
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/patient-home',
        builder: (context, state) => const PatientHomeScreen(),
      ),
      GoRoute(
        path: '/doctor-home',
        builder: (context, state) => const DoctorHomeScreen(),
      ),
    ],
  );
});
