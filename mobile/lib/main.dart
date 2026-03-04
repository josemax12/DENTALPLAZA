import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:odonto_sync/core/app_theme.dart';
import 'package:odonto_sync/core/router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicialización de base de datos local (Offline Support)
  await Hive.initFlutter();
  await Hive.openBox('settings');
  await Hive.openBox('offline_queue');

  runApp(
    const ProviderScope(
      child: OdontoSyncApp(),
    ),
  );
}

class OdontoSyncApp extends ConsumerWidget {
  const OdontoSyncApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'OdontoSync',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
